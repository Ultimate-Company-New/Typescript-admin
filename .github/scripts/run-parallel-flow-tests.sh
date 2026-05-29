#!/usr/bin/env bash
# Runs Playwright/Maven test targets in parallel (one JVM per target).
# Targets may be a class (UsersFlowTests) or a single method (LoginFlowTests#test01_successfulLogin).
#
# Prereq (once per pipeline / after clean):
#   cd Spring-PlayWright-Automation
#   mvn exec:java -Dexec.mainClass=com.microsoft.playwright.CLI -Dexec.args="install chromium"
#   mvn clean test-compile -Plocal -Dtest.env=local -DskipTests
#   export FLOW_TEST_SKIP_COMPILE=true
#
# Usage:
#   run-parallel-flow-tests.sh <suite_label> <java_package> <target> [<target> ...]

set -euo pipefail

if [[ $# -lt 3 ]]; then
  echo "Usage: $0 <suite_label> <java_package> <target> [<target> ...]" >&2
  echo "  target examples: UsersFlowTests  LoginFlowTests#test01_successfulLogin" >&2
  exit 2
fi

SUITE_LABEL="$1"
TEST_PACKAGE="$2"
shift 2
TEST_TARGETS=("$@")

if [[ ${#TEST_TARGETS[@]} -eq 0 ]]; then
  echo "No test targets provided for ${SUITE_LABEL}" >&2
  exit 2
fi

STAGGER_SEC="${FLOW_TEST_STAGGER_SEC:-8}"
PLAYWRIGHT_BROWSER="${FLOW_TEST_BROWSER:-chrome}"
FAIL_FAST="${FLOW_TEST_FAIL_FAST:-false}"
FLOW_TEST_FAST="${FLOW_TEST_FAST:-false}"
FLOW_TEST_SKIP_COMPILE="${FLOW_TEST_SKIP_COMPILE:-false}"
LOG_DIR="${FLOW_TEST_LOG_DIR:-flow-test-logs}"

if [[ -n "${FLOW_TEST_PLAYWRIGHT_DIR:-}" ]]; then
  PLAYWRIGHT_DIR="${FLOW_TEST_PLAYWRIGHT_DIR}"
elif [[ -f pom.xml ]] && [[ -d src/test/java/AdminToolTests ]]; then
  PLAYWRIGHT_DIR="$(pwd)"
else
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  PLAYWRIGHT_DIR="$(cd "${SCRIPT_DIR}/../../.." && pwd)/Spring-PlayWright-Automation"
fi

cd "${PLAYWRIGHT_DIR}"
mkdir -p "${LOG_DIR}"

echo "=========================================="
echo "${SUITE_LABEL}: ${#TEST_TARGETS[@]} target(s) in parallel (stagger=${STAGGER_SEC}s)"
echo "Browser=${PLAYWRIGHT_BROWSER}, fail_fast=${FAIL_FAST}, fast_pagination=${FLOW_TEST_FAST}"
echo "Logs: ${PLAYWRIGHT_DIR}/${LOG_DIR}/"
echo "=========================================="

if [[ "${FLOW_TEST_SKIP_COMPILE}" != "true" ]]; then
  echo "Compiling test sources..."
  mvn -B -ntp -q test-compile -Plocal -Dtest.env=local -DskipTests
else
  echo "Skipping compile (FLOW_TEST_SKIP_COMPILE=true)."
fi

PARALLEL_TARGET_ROOT="${PLAYWRIGHT_DIR}/target/parallel"
mkdir -p "${PARALLEL_TARGET_ROOT}"
if [[ -d "${PLAYWRIGHT_DIR}/target/test-classes" ]]; then
  echo "Preparing isolated Maven target dirs (avoids parallel corruption of target/)..."
  for target in "${TEST_TARGETS[@]}"; do
    slug=$(echo "$target" | tr '#/' '__')
    par_dir="${PARALLEL_TARGET_ROOT}/${slug}"
    mkdir -p "${par_dir}"
    rsync -a --delete "${PLAYWRIGHT_DIR}/target/classes/" "${par_dir}/classes/"
    rsync -a --delete "${PLAYWRIGHT_DIR}/target/test-classes/" "${par_dir}/test-classes/"
  done
fi

MVN_TEST_ARGS=(
  -B
  -ntp
  surefire:test
  -Plocal
  -Dtest.env=local
  -Djacoco.skip=true
  -Dplaywright.browser="${PLAYWRIGHT_BROWSER}"
  -Dplaywright.headless=true
  -Dplaywright.video.enabled=false
  -Dplaywright.tracing.enabled=false
  -Dplaywright.chromium.fallbackToChrome=true
  -Dsurefire.redirectTestOutputToFile=false
  -Dsurefire.printSummary=true
  -Dsurefire.useFile=false
)

if [[ "${FLOW_TEST_FAST}" == "true" ]]; then
  MVN_TEST_ARGS+=(-Dgrid.flow.fast=true)
fi

verify_test_log() {
  local log_file="$1"
  [[ -f "$log_file" ]] || return 1
  grep -q "BUILD SUCCESS" "$log_file" || return 1
  grep -qE "Tests run: [1-9][0-9]*, Failures: 0, Errors: 0, Skipped: 0" "$log_file" || return 1
  return 0
}

print_log_summary() {
  local log_file="$1"
  grep -E "Tests run:|BUILD SUCCESS|BUILD FAILURE|Time elapsed:" "$log_file" 2>/dev/null | tail -6 || true
}

print_failure_steps() {
  local log_file="$1"
  echo "--- Step / assertion context (last 40 matches) ---"
  grep -E "▶️  STEP |✅ PASSED STEP |⏱ TEST |❌|AssertionFailedError|expected: <|but was: <|BUILD FAILURE|Errors: |Failures: " \
    "$log_file" 2>/dev/null | tail -40 || echo "(no step markers in log)"
}

log_slug() {
  echo "$1" | tr '#/' '__'
}

# Stream Maven stdout/stderr to CI with a prefix; write the same stream to a log file.
run_target() {
  local target="$1"
  local slug
  slug=$(log_slug "$target")
  local log_file="${LOG_DIR}/${slug}.log"
  local mvn_exit_file="${LOG_DIR}/${slug}.mvnexit"
  local par_dir="${PARALLEL_TARGET_ROOT}/${slug}"

  (
    set -o pipefail
    stdbuf -oL -eL mvn "${MVN_TEST_ARGS[@]}" \
      -Dproject.build.directory="${par_dir}" \
      -Dmaven.compiler.skip=true \
      -Dmaven.test.compiler.skip=true \
      -Dsurefire.reportNameSuffix="${slug}" \
      -Dtest="${TEST_PACKAGE}.${target}" 2>&1 \
      | tee "${log_file}" \
      | sed -u "s/^/[${target}] /"
    echo "${PIPESTATUS[0]}" > "${mvn_exit_file}"
  )
}

pid_list=()
target_list=()
failed_targets=()
suite_start_ms=$(($(date +%s) * 1000))

# FIX: Launch all targets immediately (truly parallel), then sleep a flat
# STAGGER_SEC between launches instead of multiplying index × STAGGER_SEC.
# The old code did: sleep $((index * STAGGER_SEC)) BEFORE the launch, which
# meant the 8th test waited 56 s just to start, and the total blocking delay
# before all 8 were running was ~280 s — effectively sequential.
test_index=0
total_targets=${#TEST_TARGETS[@]}
for target in "${TEST_TARGETS[@]}"; do
  echo "Starting ${target}..."
  run_target "${target}" &
  pid_list+=("$!")
  target_list+=("$target")

  # Stagger: flat sleep AFTER launch, skip after the last target
  test_index=$((test_index + 1))
  if [[ $test_index -lt $total_targets && $STAGGER_SEC -gt 0 ]]; then
    echo "Staggering next target by ${STAGGER_SEC}s..."
    sleep "${STAGGER_SEC}"
  fi
done

echo "All ${SUITE_LABEL} targets launched. Streaming logs below..."
echo ""

# FIX: Use 'wait -n' (bash 4.3+) to process results as each job finishes
# instead of waiting in strict launch order. This means a fast test at index 7
# is reported immediately rather than waiting for slow tests at index 0-6.
# Falls back to ordered wait if wait -n is unavailable.
declare -A pid_to_index
for i in "${!pid_list[@]}"; do
  pid_to_index["${pid_list[$i]}"]=$i
done

remaining_pids=("${pid_list[@]}")

while [[ ${#remaining_pids[@]} -gt 0 ]]; do
  # Wait for any one child to finish
  if wait -n "${remaining_pids[@]}"; then
    finished_status=0
  else
    finished_status=$?
  fi

  # Find which pid just finished by checking exit files
  finished_pid=""
  finished_i=""
  for pid in "${remaining_pids[@]}"; do
    if ! kill -0 "$pid" 2>/dev/null; then
      finished_pid="$pid"
      finished_i="${pid_to_index[$pid]}"
      break
    fi
  done

  # If we couldn't match (race condition), fall back: drain remaining in order
  if [[ -z "$finished_pid" ]]; then
    break
  fi

  target="${target_list[$finished_i]}"
  slug=$(log_slug "$target")
  log_file="${LOG_DIR}/${slug}.log"
  mvn_exit_file="${LOG_DIR}/${slug}.mvnexit"

  class_start_ms=$(($(date +%s) * 1000))
  class_elapsed_s=$(( ($(date +%s) * 1000 - suite_start_ms) / 1000 ))

  mvn_exit=1
  if [[ -f "${mvn_exit_file}" ]]; then
    mvn_exit=$(cat "${mvn_exit_file}")
  elif [[ $finished_status -eq 0 ]]; then
    mvn_exit=0
  fi

  if [[ $mvn_exit -eq 0 ]] && verify_test_log "${log_file}"; then
    test_seconds=$(grep -oE "Time elapsed: [0-9.]+ s" "${log_file}" | tail -1 | grep -oE "[0-9.]+" || echo "?")
    echo "✓ ${target} passed (finished at ${class_elapsed_s}s suite wall, surefire ~${test_seconds}s)"
  else
    echo "❌ ${target} failed (mvn exit ${mvn_exit}, finished at ${class_elapsed_s}s suite wall)"
    failed_targets+=("$target")
    echo "=== ${target} summary ==="
    print_log_summary "${log_file}"
    print_failure_steps "${log_file}"
    if [[ "${FAIL_FAST}" == "true" ]]; then
      echo "FAIL_FAST=true — killing remaining jobs..."
      for pid in "${remaining_pids[@]}"; do
        [[ "$pid" == "$finished_pid" ]] && continue
        kill "$pid" 2>/dev/null || true
      done
      exit 1
    fi
  fi
  echo ""

  # Remove finished pid from remaining list
  new_remaining=()
  for pid in "${remaining_pids[@]}"; do
    [[ "$pid" == "$finished_pid" ]] && continue
    new_remaining+=("$pid")
  done
  remaining_pids=("${new_remaining[@]}")
done

# Fallback: drain any remaining pids in order (handles the race-condition break above)
for i in "${!pid_list[@]}"; do
  pid="${pid_list[$i]}"
  # Skip already-processed pids
  already_done=false
  for rp in "${remaining_pids[@]}"; do
    [[ "$rp" == "$pid" ]] && { already_done=true; break; }
  done
  $already_done || continue

  target="${target_list[$i]}"
  slug=$(log_slug "$target")
  log_file="${LOG_DIR}/${slug}.log"
  mvn_exit_file="${LOG_DIR}/${slug}.mvnexit"

  if wait "$pid"; then
    wait_ok=0
  else
    wait_ok=$?
  fi

  class_elapsed_s=$(( ($(date +%s) * 1000 - suite_start_ms) / 1000 ))

  mvn_exit=1
  if [[ -f "${mvn_exit_file}" ]]; then
    mvn_exit=$(cat "${mvn_exit_file}")
  elif [[ $wait_ok -eq 0 ]]; then
    mvn_exit=0
  fi

  if [[ $mvn_exit -eq 0 ]] && verify_test_log "${log_file}"; then
    test_seconds=$(grep -oE "Time elapsed: [0-9.]+ s" "${log_file}" | tail -1 | grep -oE "[0-9.]+" || echo "?")
    echo "✓ ${target} passed (finished at ${class_elapsed_s}s suite wall, surefire ~${test_seconds}s)"
  else
    echo "❌ ${target} failed (mvn exit ${mvn_exit}, finished at ${class_elapsed_s}s suite wall)"
    failed_targets+=("$target")
    echo "=== ${target} summary ==="
    print_log_summary "${log_file}"
    print_failure_steps "${log_file}"
    if [[ "${FAIL_FAST}" == "true" ]]; then
      exit 1
    fi
  fi
  echo ""
done

suite_elapsed_s=$(( ($(date +%s) * 1000 - suite_start_ms) / 1000 ))
echo "=========================================="
echo "${SUITE_LABEL} suite wall time: ${suite_elapsed_s}s (parallel)"
echo "=========================================="

if [[ ${#failed_targets[@]} -gt 0 ]]; then
  echo "Failed target(s): ${failed_targets[*]}"
  exit 1
fi

echo "✓ All ${SUITE_LABEL} targets passed."