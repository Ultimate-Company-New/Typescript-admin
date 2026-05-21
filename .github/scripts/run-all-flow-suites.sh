#!/usr/bin/env bash
# Runs Login → Grid → View flow suites sequentially.
# Within each suite, targets run in parallel via run-parallel-flow-tests.sh.
#
# Expects Playwright browsers + test-compile already done (CI prepare step).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PARALLEL_SCRIPT="${SCRIPT_DIR}/run-parallel-flow-tests.sh"

if [[ ! -x "${PARALLEL_SCRIPT}" ]]; then
  chmod +x "${PARALLEL_SCRIPT}"
fi

export FLOW_TEST_SKIP_COMPILE="${FLOW_TEST_SKIP_COMPILE:-true}"
export FLOW_TEST_LOG_DIR="${FLOW_TEST_LOG_DIR:-flow-test-logs}"

echo "################################################################"
echo "# Flow test pipeline: Login → Grid → View"
echo "# Parallelism: within each suite only"
echo "################################################################"
echo ""

echo "========== 1/3 Login Flow (parallel methods + client landing) =========="
"${PARALLEL_SCRIPT}" \
  "Login Flow" \
  AdminToolTests.flows \
  "LoginFlowTests#test01_successfulLogin" \
  "LoginFlowTests#test02_unsuccessfulLogin_wrongPassword" \
  "LoginFlowTests#test03_unsuccessfulLogin_emailNotConfirmed" \
  "LoginFlowTests#test04_resetPassword_successful" \
  "LoginFlowTests#test05_resetPassword_unsuccessful" \
  "ClientLandingFlowTests#test01_clientLandingDisplaysAlphabeticalGridAndCounts" \
  "ClientLandingFlowTests#test02_paginationNavigatesThroughClientList" \
  "ClientLandingFlowTests#test03_filterClientsByName"

echo ""
echo "========== 2/3 Grid Flow (parallel grid classes) =========="
"${PARALLEL_SCRIPT}" \
  "Grid Flow" \
  AdminToolTests.flows.GridFlows \
  UsersFlowTests \
  UserGroupsFlowTests \
  LeadsFlowTests \
  PromosFlowTests \
  ProductsFlowTests \
  PackagesFlowTests \
  PickupLocationsFlowTests \
  MessagesFlowTests

echo ""
echo "========== 3/3 View Flow (parallel view classes) =========="
"${PARALLEL_SCRIPT}" \
  "View Flow" \
  AdminToolTests.flows.ViewFlows \
  ViewUserFlowTests \
  ViewUserGroupFlowTests \
  ViewLeadFlowTests \
  ViewPromoFlowTests \
  ViewProductFlowTests \
  ViewPackageFlowTests \
  ViewPickupLocationFlowTests \
  ViewMessageFlowTests

echo ""
echo "✓ Login, Grid, and View flow suites all passed."
