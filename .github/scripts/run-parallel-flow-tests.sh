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

STAGGER_SEC="${FLOW_TEST_STAGGER_SEC:-0}"
PLAYWRIGHT_BROWSER="${FLOW_TEST_BROWSER:-chromium}"
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
  -Dsurefire.redirectTestOutputToFile=false
  -Dsurefire.printSummary=true
  -Dsurefire.useFile=false
)

if [[ "${FLOW_TEST_FAST}" == "true" ]]; then
  MVN_TEST_ARGS+=(-Dgrid.flow.fast=true)
fi

log_slug() {
  echo "$1" | tr '#/' '__'
}

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

# Stream Maven stdout/stderr to CI with a prefix; write the same stream to a log file.
run_target() {
  local target="$1"
  local slug
  slug=$(log_slug "$target")
  local log_file="${LOG_DIR}/${slug}.log"
  local mvn_exit_file="${LOG_DIR}/${slug}.mvnexit"

  (
    set -o pipefail
    stdbuf -oL -eL mvn "${MVN_TEST_ARGS[@]}" \
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

test_index=0
for target in "${TEST_TARGETS[@]}"; do
  if [[ $test_index -gt 0 && $STAGGER_SEC -gt 0 ]]; then
    stagger_sec=$((test_index * STAGGER_SEC))
    echo "Staggering ${target} start by ${stagger_sec}s..."
    sleep "$stagger_sec"
  fi
  test_index=$((test_index + 1))
  echo "Starting ${target}..."
  run_target "${target}" &
  pid_list+=("$!")
  target_list+=("$target")
done

echo "All ${SUITE_LABEL} targets launched. Streaming logs below..."
echo ""

for i in "${!pid_list[@]}"; do
  pid="${pid_list[$i]}"
  target="${target_list[$i]}"
  slug=$(log_slug "$target")
  log_file="${LOG_DIR}/${slug}.log"
  mvn_exit_file="${LOG_DIR}/${slug}.mvnexit"

  class_start_ms=$(($(date +%s) * 1000))
  if wait "$pid"; then
    wait_ok=0
  else
    wait_ok=$?
  fi
  class_elapsed_s=$(( ($(date +%s) * 1000 - class_start_ms) / 1000 ))

  mvn_exit=1
  if [[ -f "${mvn_exit_file}" ]]; then
    mvn_exit=$(cat "${mvn_exit_file}")
  elif [[ $wait_ok -eq 0 ]]; then
    mvn_exit=0
  fi

  if [[ $mvn_exit -eq 0 ]] && verify_test_log "${log_file}"; then
    test_seconds=$(grep -oE "Time elapsed: [0-9.]+ s" "${log_file}" | tail -1 | grep -oE "[0-9.]+" || echo "?")
    echo "✓ ${target} passed (wall ${class_elapsed_s}s, surefire ~${test_seconds}s)"
  else
    echo "❌ ${target} failed (mvn exit ${mvn_exit}, wall ${class_elapsed_s}s)"
    failed_targets+=("$target")
    echo "=== ${target} summary ==="
    print_log_summary "${log_file}"
    print_failure_steps "${log_file}"
    if [[ "${FAIL_FAST}" == "true" ]]; then
      for j in "${!pid_list[@]}"; do
        [[ $j -eq $i ]] && continue
        kill "${pid_list[$j]}" 2>/dev/null || true
      done
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
  echo "Log files: ${LOG_DIR}/$(printf '%s ' "${failed_targets[@]/#/${LOG_DIR}/}")"
  exit 1
fi

echo "✓ All ${SUITE_LABEL} targets passed."
