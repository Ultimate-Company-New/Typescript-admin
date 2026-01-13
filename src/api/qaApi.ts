import type {
  QADashboardResponseModel,
  TestExecutionRequestModel,
  TestExecutionStatusModel,
  TestRunRequestModel,
  TestRunResponseModel,
} from "../models/api-models";

import axiosInstance from "./axiosConfig";

/**
 * API endpoints for QA Dashboard operations
 */
const API_ROUTES = {
  GET_DASHBOARD_DATA: "/QA/getDashboardData",
  SAVE_TEST_RUN: "/QA/saveTestRun",
  RUN_TESTS: "/QA/runTests",
};

// ==================== API FUNCTIONS ====================

/**
 * Fetches all QA dashboard data in a single request.
 * Includes services, coverage summary, and available services.
 */
export const getDashboardData = async (): Promise<QADashboardResponseModel> => {
  const response = await axiosInstance.get<QADashboardResponseModel>(
    API_ROUTES.GET_DASHBOARD_DATA
  );
  return response.data;
};

/**
 * Starts a test execution.
 * Returns immediately with execution status that includes executionId for polling.
 *
 * Request body determines scope:
 * - { runAll: true } - Run ALL tests in the API
 * - { serviceName: "AddressService" } - Run all tests for that service
 * - { serviceName: "AddressService", methodName: "toggleAddress" } - Run tests for specific method
 * - { testNames: ["test1", "test2"], testClassName: "AddressServiceTest" } - Run specific tests
 */
export const runTests = async (
  request: TestExecutionRequestModel
): Promise<TestExecutionStatusModel> => {
  const response = await axiosInstance.put<TestExecutionStatusModel>(
    API_ROUTES.RUN_TESTS,
    request
  );
  return response.data;
};

/**
 * Gets the current status and progress of a test execution.
 * Poll this endpoint to track real-time test progress.
 *
 * @param executionId The execution ID from runTests response
 */
export const getTestExecutionStatus = async (
  executionId: string
): Promise<TestExecutionStatusModel> => {
  const response = await axiosInstance.get<TestExecutionStatusModel>(
    `${API_ROUTES.RUN_TESTS}/${executionId}`
  );
  return response.data;
};

/**
 * Helper function to run tests for a service
 */
export const runTestsForService = async (
  serviceName: string
): Promise<TestExecutionStatusModel> => {
  return runTests({ serviceName });
};

/**
 * Helper function to run tests for a specific method
 */
export const runTestsForMethod = async (
  serviceName: string,
  methodName: string
): Promise<TestExecutionStatusModel> => {
  return runTests({ serviceName, methodName });
};

/**
 * Helper function to run specific test methods
 */
export const runSpecificTests = async (
  testClassName: string,
  testNames: string[],
  serviceName?: string
): Promise<TestExecutionStatusModel> => {
  return runTests({ testClassName, testNames, serviceName });
};

/**
 * Helper function to run all tests
 */
export const runAllTests = async (): Promise<TestExecutionStatusModel> => {
  return runTests({ runAll: true });
};

/**
 * Saves a test run with its results to the database
 */
export const saveTestRun = async (
  request: TestRunRequestModel
): Promise<TestRunResponseModel> => {
  const response = await axiosInstance.put<TestRunResponseModel>(
    API_ROUTES.SAVE_TEST_RUN,
    request
  );
  return response.data;
};

export const qaApi = {
  getDashboardData,
  runTests,
  getTestExecutionStatus,
  runTestsForService,
  runTestsForMethod,
  runSpecificTests,
  runAllTests,
  saveTestRun,
};
