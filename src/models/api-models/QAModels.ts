/**
 * QA Dashboard Models
 * Type definitions for QA API request and response models
 */

/**
 * Test information including method name, display name, and last run information
 */
export interface TestInfo {
  testMethodName: string
  /**
   * Declaring test class selector for Maven/Surefire.
   * For @Nested tests this includes the nested class via '$'
   * (e.g. "AddressServiceTest$GetAddressByIdTests").
   */
  declaringTestClassName?: string | null
  displayName: string | null
  // Last run information
  hasBeenRun: boolean
  lastRunStatus?: string | null
  lastRunAt?: string | null
  lastRunByUserName?: string | null
  lastRunByUserId?: number | null
  lastRunDurationMs?: number | null
  lastRunErrorMessage?: string | null
  lastRunStackTrace?: string | null
}

/**
 * Method information with associated tests
 */
export interface MethodInfo {
  methodName: string
  httpMethod: string | null
  apiRoute: string
  description: string
  associatedUnitTests: TestInfo[]
  testCount: number
  hasCoverage: boolean
}

/**
 * Service information with all methods and tests
 */
export interface QAServiceResponse {
  serviceName: string
  controllerName: string
  basePath: string
  testClassName: string
  methods: MethodInfo[]
  totalMethods: number
  methodsWithCoverage: number
  totalTests: number
  coveragePercentage: number
}

/**
 * Coverage summary response
 */
export interface CoverageSummary {
  totalServices: number
  totalMethods: number
  totalMethodsWithCoverage: number
  totalTests: number
  overallCoveragePercentage: number
  serviceBreakdown: ServiceBreakdown[]
}

/**
 * Service breakdown in coverage summary
 */
export interface ServiceBreakdown {
  serviceName: string
  totalMethods: number
  methodsWithCoverage: number
  totalTests: number
  coveragePercentage: number
}

/**
 * Test result from running a test
 */
export interface TestResult {
  testName: string
  displayName: string | null
  status: 'passed' | 'failed' | 'skipped' | 'running'
  duration?: number
  errorMessage?: string
  stackTrace?: string
}

/**
 * Test run response
 */
export interface TestRunResponse {
  totalTests: number
  passed: number
  failed: number
  skipped: number
  duration: number
  results: TestResult[]
}

// ==================== NEW TYPES FOR TEST RUN TRACKING ====================

/**
 * Individual test result data for saving to database
 */
export interface TestResultData {
  methodName: string
  testClassName?: string
  testMethodName: string
  displayName?: string | null
  status: 'PASSED' | 'FAILED' | 'SKIPPED' | 'ERROR'
  durationMs?: number
  errorMessage?: string
  stackTrace?: string
}

/**
 * Request model for saving a test run
 */
export interface TestRunRequestModel {
  serviceName: string
  runType: 'SINGLE_METHOD' | 'SERVICE' | 'ALL_SERVICES'
  environment?: string
  totalDurationMs?: number
  results: TestResultData[]
}

/**
 * Response model for saved test run
 */
export interface TestRunResponseModel {
  testRunId: number
  serviceName: string
  runType: string
  userId: number
  userName: string
  environment: string
  startTime: string
  endTime: string | null
  totalTests: number
  passedCount: number
  failedCount: number
  skippedCount: number
  status: string
  createdDate: string
}

/**
 * Latest test result response model
 */
export interface LatestTestResultResponseModel {
  latestTestResultId: number
  serviceName: string
  testClassName: string
  testMethodName: string
  status: 'PASSED' | 'FAILED' | 'SKIPPED' | 'ERROR' | 'NOT_RUN'
  durationMs: number
  errorMessage: string | null
  stackTrace: string | null
  lastRunId: number | null
  lastRunByUserId: number
  lastRunByUserName: string
  lastRunAt: string
  createdDate: string
  modifiedDate: string
}

// ==================== COMBINED DASHBOARD RESPONSE ====================

/**
 * Per-service breakdown in coverage summary
 */
export interface ServiceBreakdownData {
  serviceName: string
  totalMethods: number
  methodsWithCoverage: number
  totalTests: number
  coveragePercentage: number
}

/**
 * Coverage summary data
 */
export interface CoverageSummaryData {
  totalServices: number
  totalMethods: number
  totalMethodsWithCoverage: number
  totalTests: number
  overallCoveragePercentage: number
  serviceBreakdown: ServiceBreakdownData[]
}

/**
 * A single automated API test class
 */
export interface AutomatedApiTestInfo {
  testClass: string
  relativePath: string
}

/**
 * A category of automated API tests (e.g., Address, Client, Lead)
 */
export interface AutomatedApiTestCategory {
  categoryName: string
  relativePath: string
  tests: AutomatedApiTestInfo[]
}

/**
 * Automated API tests section (Playwright/API integration tests)
 */
export interface AutomatedApiTestsData {
  basePath: string
  totalTests: number
  categories: AutomatedApiTestCategory[]
}

/**
 * Combined QA Dashboard response model
 * Contains all data needed for the QA Dashboard in a single response
 */
export interface QADashboardResponseModel {
  services: QAServiceResponse[]
  coverageSummary: CoverageSummaryData
  availableServices: string[]
  automatedApiTests?: AutomatedApiTestsData | null
}

// ==================== TEST EXECUTION MODELS ====================

/**
 * Request model for starting a test execution.
 * Supports multiple modes based on which fields are set.
 */
export interface TestExecutionRequestModel {
  /** Run all tests in the project */
  runAll?: boolean
  /** Service name to run tests for (e.g., "AddressService") */
  serviceName?: string
  /** Method name to filter tests by (e.g., "toggleAddress") */
  methodName?: string
  /** Specific test method names to run */
  testNames?: string[]
  /** Test class name (e.g., "AddressServiceTest") */
  testClassName?: string
}

/**
 * Individual test result from execution
 */
export interface TestResultInfo {
  testMethodName: string
  displayName?: string | null
  status: 'PASSED' | 'FAILED' | 'SKIPPED' | 'RUNNING' | 'PENDING'
  durationMs: number
  errorMessage?: string | null
  stackTrace?: string | null
  methodName?: string | null
}

/**
 * Test execution status model for real-time progress tracking
 */
export interface TestExecutionStatusModel {
  executionId: string
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'COMPLETED_WITH_FAILURES' | 'FAILED' | 'CANCELLED'
  totalTests: number
  completedTests: number
  passedTests: number
  failedTests: number
  skippedTests: number
  durationMs: number
  startedAt: string
  completedAt?: string | null
  serviceName?: string | null
  methodName?: string | null
  results: TestResultInfo[]
  errorMessage?: string | null
  progressPercentage: number
}
