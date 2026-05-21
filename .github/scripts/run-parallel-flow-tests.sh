#!/usr/bin/env bash
# Runs Playwright/Maven flow test classes in parallel (one JVM per class).
# Requires: Prepare Playwright automation step already ran (browser install + mvn clean).
#
# Usage:
#   run-parallel-flow-tests.sh <suite_label> <java_package> <TestClass> [<TestClass> ...]
#
# Example:
#   run-parallel-flow-tests.sh "Grid Flow" AdminToolTests.flows.GridFlows UsersFlowTests LeadsFlowTests

set -euo pipefail

if [[ $# -lt 3 ]]; then
  echo "Usage: $0 <suite_label> <java_package> <TestClass> [<TestClass> ...]" >&2
  exit 2
fi

SUITE_LABEL="$1"
TEST_PACKAGE="$2"
shift 2
TEST_CLASSES=("$@")

if [[ ${#TEST_CLASSES[@]} -eq 0 ]]; then
  echo "No test classes provided for ${SUITE_LABEL}" >&2
  exit 2
fi

echo "=========================================="
echo "${SUITE_LABEL}: launching ${#TEST_CLASSES[@]} test class(es)"
echo "Package: ${TEST_PACKAGE}"
echo "=========================================="

pids=()
declare -A test_map

for test_class in "${TEST_CLASSES[@]}"; do
  echo "Starting ${test_class} in background..."
  mvn -B verify \
    -Plocal \
    -Dtest.env=local \
    -Dplaywright.browser=chromium \
    -Dplaywright.headless=true \
    -Dproject.build.directory="target/${test_class}" \
    -Dtest="${TEST_PACKAGE}.${test_class}" > "${test_class}.log" 2>&1 &

  pid=$!
  pids+=("$pid")
  test_map["$pid"]="$test_class"
done

echo "All ${SUITE_LABEL} tests launched. Monitoring execution..."

failed=0
while [[ ${#pids[@]} -gt 0 ]]; do
  still_running=()
  for pid in "${pids[@]}"; do
    if kill -0 "$pid" 2>/dev/null; then
      still_running+=("$pid")
    else
      wait "$pid"
      exit_code=$?
      test_name="${test_map[$pid]}"
      if [[ $exit_code -ne 0 ]]; then
        echo "❌ ${test_name} failed with exit code ${exit_code}!"
        echo "======================================================="
        echo "=== ERROR LOGS FOR TEST: ${test_name} ==="
        echo "======================================================="
        cat "${test_name}.log" || true
        echo "======================================================="
        failed=1
      else
        echo "✓ ${test_name} passed successfully."
        echo "::group::Logs for ${test_name}"
        cat "${test_name}.log" || true
        echo "::endgroup::"
      fi
    fi
  done

  if [[ $failed -eq 1 ]]; then
    echo "Terminating remaining running ${SUITE_LABEL} tests..."
    for pid in "${still_running[@]}"; do
      kill "$pid" 2>/dev/null || true
    done
    sleep 1
    for pid in "${still_running[@]}"; do
      test_name="${test_map[$pid]}"
      echo "Test ${test_name} was terminated early."
      if [[ -f "${test_name}.log" ]]; then
        echo "::group::Partial Logs for Terminated Test ${test_name}"
        cat "${test_name}.log" || true
        echo "::endgroup::"
      fi
    done
    exit 1
  fi

  pids=("${still_running[@]}")
  [[ ${#pids[@]} -gt 0 ]] && sleep 2
done

echo "✓ All ${SUITE_LABEL} tests completed successfully!"
