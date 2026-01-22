import BugReportIcon from "@mui/icons-material/BugReport";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CodeIcon from "@mui/icons-material/Code";
import ErrorIcon from "@mui/icons-material/Error";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Container,
  Divider,
  IconButton,
  LinearProgress,
  Paper,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";

import { qaApi } from "../../api/qaApi";
import type {
  CoverageSummaryData,
  MethodInfo,
  QAServiceResponse,
  TestExecutionStatusModel,
  TestResult,
  TestResultData,
} from "../../models/api-models";
import type {
  MethodTestState,
  ServiceTestState,
} from "../../models/QADashboardModels";
import styles from "../../styles/QADashboard.module.scss";

// Test status type
type TestStatus = "idle" | "running" | "passed" | "failed" | "skipped";

// Tab types
type TabValue = "unit" | "api" | "browser";

// TabPanel component props
interface TabPanelProps {
  children?: React.ReactNode;
  index: TabValue;
  value: TabValue;
}

/**
 * TabPanel component for rendering tab content
 */
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`qa-tabpanel-${index}`}
      aria-labelledby={`qa-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

/**
 * QA Dashboard Page
 * Central hub for Quality Assurance and testing functionalities
 * Features:
 * - Service-based test organization
 * - Individual and batch test execution
 * - Progress tracking with visual indicators
 * - Detailed test results with error messages
 */
const QADashboard = (): JSX.Element => {
  const [services, setServices] = useState<QAServiceResponse[]>([]);
  const [coverage, setCoverage] = useState<CoverageSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedService, setExpandedService] = useState<string | false>(false);
  const [serviceTestStates, setServiceTestStates] = useState<ServiceTestState>(
    {}
  );
  const [currentTab, setCurrentTab] = useState<TabValue>("unit");

  // Fetch all dashboard data in a single request
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const dashboardData = await qaApi.getDashboardData();

      setServices(dashboardData.services);
      setCoverage(dashboardData.coverageSummary);

      // Initialize test states using the last run info from TestInfo (returned by backend)
      const initialStates: ServiceTestState = {};
      dashboardData.services.forEach((service) => {
        const methodStates: MethodTestState = {};
        service.methods.forEach((method) => {
          // Check if we have last run results from the backend response
          const methodResults: TestResult[] = [];
          let hasResults = false;

          method.associatedUnitTests.forEach((test) => {
            // Use the hasBeenRun and lastRunStatus from the backend response
            if (test.hasBeenRun && test.lastRunStatus) {
              hasResults = true;
              methodResults.push({
                testName: test.testMethodName,
                displayName: test.displayName,
                status: test.lastRunStatus.toLowerCase() as
                  | "passed"
                  | "failed"
                  | "skipped",
                duration: test.lastRunDurationMs || undefined,
                errorMessage: test.lastRunErrorMessage || undefined,
                stackTrace: test.lastRunStackTrace || undefined,
              });
            }
          });

          const hasFailure = methodResults.some((r) => r.status === "failed");
          methodStates[method.methodName] = {
            status: hasResults ? (hasFailure ? "failed" : "passed") : "idle",
            results: methodResults,
            expanded: false,
          };
        });
        initialStates[service.serviceName] = {
          isRunning: false,
          progress: 0,
          totalTests: service.totalTests,
          completedTests: 0,
          methodStates,
        };
      });
      setServiceTestStates(initialStates);
    } catch (err) {
      setError("Failed to load QA data. Please try again.");
      console.error("Error fetching QA data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Helper function to save test run results to the database
  const saveTestRunResults = async (
    serviceName: string,
    methodName: string,
    results: TestResult[],
    runType: "SINGLE_METHOD" | "SERVICE" | "ALL_SERVICES" = "SINGLE_METHOD"
  ) => {
    try {
      const testResults: TestResultData[] = results.map((r) => ({
        methodName: methodName,
        testMethodName: r.testName,
        displayName: r.displayName,
        status: r.status.toUpperCase() as
          | "PASSED"
          | "FAILED"
          | "SKIPPED"
          | "ERROR",
        durationMs: r.duration,
        errorMessage: r.errorMessage,
        stackTrace: r.stackTrace,
      }));

      await qaApi.saveTestRun({
        serviceName,
        runType,
        environment: "localhost",
        totalDurationMs: results.reduce((sum, r) => sum + (r.duration || 0), 0),
        results: testResults,
      });
    } catch (err) {
      console.error("Failed to save test run results:", err);
      // Don't block the UI - results are still displayed even if save fails
    }
  };

  // Poll for test execution status
  const pollTestExecution = async (
    executionId: string,
    _serviceName: string,
    _methodName: string | null,
    onProgress: (status: TestExecutionStatusModel) => void
  ): Promise<TestExecutionStatusModel> => {
    const POLL_INTERVAL = 1000; // 1 second
    const MAX_POLLS = 300; // 5 minutes max

    for (let i = 0; i < MAX_POLLS; i++) {
      try {
        const status = await qaApi.getTestExecutionStatus(executionId);
        onProgress(status);

        if (
          status.status === "COMPLETED" ||
          status.status === "COMPLETED_WITH_FAILURES" ||
          status.status === "FAILED" ||
          status.status === "CANCELLED"
        ) {
          return status;
        }

        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
      } catch (err) {
        console.error("Error polling test execution:", err);
        throw err;
      }
    }

    throw new Error("Test execution timed out");
  };

  // Convert backend test results to frontend format
  const convertResults = (status: TestExecutionStatusModel): TestResult[] => {
    return status.results.map((r) => ({
      testName: r.testMethodName,
      displayName: r.displayName || null,
      status: r.status.toLowerCase() as
        | "passed"
        | "failed"
        | "skipped"
        | "running",
      duration: r.durationMs,
      errorMessage: r.errorMessage || undefined,
      stackTrace: r.stackTrace || undefined,
    }));
  };

  const resolveDeclaringTestClassName = (
    serviceName: string,
    methodName: string,
    testMethodName: string
  ): string | null => {
    const service = services.find((s) => s.serviceName === serviceName);
    const method = service?.methods?.find((m) => m.methodName === methodName);
    const testInfo = method?.associatedUnitTests?.find(
      (t) => t.testMethodName === testMethodName
    );
    return testInfo?.declaringTestClassName || null;
  };

  // Run tests for a single method
  const runMethodTests = async (
    serviceName: string,
    method: MethodInfo,
    _runType: "SINGLE_METHOD" | "SERVICE" | "ALL_SERVICES" = "SINGLE_METHOD"
  ) => {
    if (method.testCount === 0) return;

    // Update state to running
    setServiceTestStates((prev) => ({
      ...prev,
      [serviceName]: {
        ...prev[serviceName],
        methodStates: {
          ...prev[serviceName].methodStates,
          [method.methodName]: {
            ...prev[serviceName].methodStates[method.methodName],
            status: "running",
            results: [],
            progress: 0,
            completedTests: 0,
            totalTests: method.testCount,
            passedTests: 0,
            failedTests: 0,
            skippedTests: 0,
          },
        },
      },
    }));

    try {
      // Start test execution via API
      const initialStatus = await qaApi.runTests({
        serviceName,
        methodName: method.methodName,
      })

      // Poll for progress
      const finalStatus = await pollTestExecution(
        initialStatus.executionId,
        serviceName,
        method.methodName,
        (status) => {
          // Update UI with progress
          const results = convertResults(status);
          const totalTests = status.totalTests || method.testCount;
          const completedTests = status.completedTests || 0;
          const progress =
            status.progressPercentage ??
            (totalTests > 0 ? (completedTests / totalTests) * 100 : 0);

          const failedTests = status.failedTests ?? 0;
          const skippedTests = status.skippedTests ?? 0;
          const backendPassed = status.passedTests ?? 0;
          // While Maven is running we may only have an estimated completed count; assume completed-but-unknown are passed
          const optimisticPassed = Math.max(
            0,
            completedTests - failedTests - skippedTests
          );
          const passedTests = Math.min(
            completedTests,
            Math.max(backendPassed, optimisticPassed)
          );

          setServiceTestStates((prev) => ({
            ...prev,
            [serviceName]: {
              ...prev[serviceName],
              methodStates: {
                ...prev[serviceName].methodStates,
                [method.methodName]: {
                  ...prev[serviceName].methodStates[method.methodName],
                  results,
                  completedTests,
                  totalTests,
                  progress,
                  passedTests,
                  failedTests,
                  skippedTests,
                },
              },
            },
          }));
        }
      );

      // Finalize status
      const results = convertResults(finalStatus);
      const hasFailed = results.some((r) => r.status === "failed");
      const totalTests = finalStatus.totalTests || method.testCount;
      const completedTests = finalStatus.completedTests || results.length;
      const failedTests =
        finalStatus.failedTests ??
        results.filter((r) => r.status === "failed").length;
      const skippedTests =
        finalStatus.skippedTests ??
        results.filter((r) => r.status === "skipped").length;
      const passedTests =
        finalStatus.passedTests ??
        Math.max(0, completedTests - failedTests - skippedTests);
      setServiceTestStates((prev) => ({
        ...prev,
        [serviceName]: {
          ...prev[serviceName],
          methodStates: {
            ...prev[serviceName].methodStates,
            [method.methodName]: {
              ...prev[serviceName].methodStates[method.methodName],
              status: hasFailed ? "failed" : "passed",
              results,
              completedTests,
              totalTests,
              progress: 100,
              passedTests,
              failedTests,
              skippedTests,
            },
          },
        },
      }));

      // Persist results (non-blocking)
      void saveTestRunResults(
        serviceName,
        method.methodName,
        results,
        "SINGLE_METHOD"
      );
    } catch (err) {
      console.error("Error running method tests:", err);
      setServiceTestStates((prev) => ({
        ...prev,
        [serviceName]: {
          ...prev[serviceName],
          methodStates: {
            ...prev[serviceName].methodStates,
            [method.methodName]: {
              ...prev[serviceName].methodStates[method.methodName],
              status: "failed",
              results: [],
            },
          },
        },
      }));
      setError(`Failed to run tests for ${method.methodName}`);
    }
  };

  // Run a single test
  const runSingleTest = async (
    serviceName: string,
    methodName: string,
    testMethodName: string,
    _displayName: string | null,
    declaringTestClassName?: string | null
  ) => {
    // Get the test class name from the service
    try {
      // Start test execution via API for a single test
      const initialStatus = await qaApi.runTests({
        serviceName,
        testNames: [testMethodName],
      })

      // Poll for completion
      const finalStatus = await pollTestExecution(
        initialStatus.executionId,
        serviceName,
        methodName,
        () => {} // No progress updates needed for single test
      );

      // Convert and update state with the result
      const results = convertResults(finalStatus);
      const result =
        results.find((r) => r.testName === testMethodName) || results[0];

      if (result) {
        setServiceTestStates((prev) => {
          const currentResults =
            prev[serviceName]?.methodStates[methodName]?.results ?? [];
          const existingIndex = currentResults.findIndex(
            (r) => r.testName === testMethodName
          );
          const newResults =
            existingIndex >= 0
              ? [
                  ...currentResults.slice(0, existingIndex),
                  result,
                  ...currentResults.slice(existingIndex + 1),
                ]
              : [...currentResults, result];

          const hasFailed = newResults.some((r) => r.status === "failed");

          return {
            ...prev,
            [serviceName]: {
              ...prev[serviceName],
              methodStates: {
                ...prev[serviceName].methodStates,
                [methodName]: {
                  ...prev[serviceName].methodStates[methodName],
                  status: hasFailed ? "failed" : "passed",
                  results: newResults,
                },
              },
            },
          };
        });
      }
    } catch (err) {
      console.error("Error running single test:", err);
      setError(`Failed to run test: ${testMethodName}`);
    }
  };

  // Run all tests for a service
  const runAllServiceTests = async (service: QAServiceResponse) => {
    const totalTests = service.totalTests;

    setServiceTestStates((prev) => ({
      ...prev,
      [service.serviceName]: {
        ...prev[service.serviceName],
        isRunning: true,
        progress: 0,
        totalTests,
        completedTests: 0,
        // Reset all method states to running to indicate they are queued
        methodStates: Object.fromEntries(
          service.methods.map((m) => [
            m.methodName,
            { status: "running" as TestStatus, results: [], expanded: false },
          ])
        ),
      },
    }));

    let completedServiceTests = 0;

    for (const method of service.methods) {
      if (method.testCount === 0) {
          // Update status for empty methods
          setServiceTestStates((prev) => ({
              ...prev,
              [service.serviceName]: {
                  ...prev[service.serviceName],
                  methodStates: {
                      ...prev[service.serviceName].methodStates,
                      [method.methodName]: {
                          status: "passed", // No tests = passed/skipped
                          results: [],
                          expanded: false
                      }
                  }
              }
          }));
          continue;
      }

      try {
        await runMethodTests(service.serviceName, method, "SERVICE");

        completedServiceTests += method.testCount;
        const progress = (completedServiceTests / totalTests) * 100;

        setServiceTestStates((prev) => ({
             ...prev,
             [service.serviceName]: {
                ...prev[service.serviceName],
                completedTests: completedServiceTests,
                progress,
             }
        }));
      } catch (err) {
        console.error(`Error running tests for method ${method.methodName}`, err);
        // Continue with other methods even if one fails
      }
    }

    setServiceTestStates((prev) => ({
      ...prev,
      [service.serviceName]: {
        ...prev[service.serviceName],
        isRunning: false,
        progress: 100,
        completedTests: totalTests
      },
    }));
  };

  // Toggle method results expansion
  const toggleMethodExpanded = (serviceName: string, methodName: string) => {
    setServiceTestStates((prev) => ({
      ...prev,
      [serviceName]: {
        ...prev[serviceName],
        methodStates: {
          ...prev[serviceName].methodStates,
          [methodName]: {
            ...prev[serviceName].methodStates[methodName],
            expanded: !prev[serviceName].methodStates[methodName]?.expanded,
          },
        },
      },
    }));
  };

  // Get status icon for a test
  const getStatusIcon = (status: TestStatus) => {
    switch (status) {
      case "passed":
        return (
          <CheckCircleIcon className={styles["qa-dashboard__icon--passed"]} />
        );
      case "failed":
        return <ErrorIcon className={styles["qa-dashboard__icon--failed"]} />;
      case "running":
        return <CircularProgress size={18} />;
      default:
        return null;
    }
  };

  // Render coverage stats
  const renderCoverageStats = () => {
    if (!coverage) return null;

    return (
      <Box className={styles["qa-dashboard__stats"]}>
        <Paper className={styles["qa-dashboard__stat-card"]}>
          <Typography
            variant="h3"
            className={styles["qa-dashboard__stat-value"]}
          >
            {coverage.totalServices}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Services
          </Typography>
        </Paper>
        <Paper className={styles["qa-dashboard__stat-card"]}>
          <Typography
            variant="h3"
            className={styles["qa-dashboard__stat-value"]}
          >
            {coverage.totalMethods}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Methods
          </Typography>
        </Paper>
        <Paper className={styles["qa-dashboard__stat-card"]}>
          <Typography
            variant="h3"
            className={styles["qa-dashboard__stat-value"]}
          >
            {coverage.totalTests}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Unit Tests
          </Typography>
        </Paper>
        <Paper className={styles["qa-dashboard__stat-card"]}>
          <Typography
            variant="h3"
            className={styles["qa-dashboard__stat-value--coverage"]}
          >
            {coverage.overallCoveragePercentage.toFixed(1)}%
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Coverage
          </Typography>
        </Paper>
      </Box>
    );
  };

  // Render a single test result
  const renderTestResult = (
    result: TestResult,
    serviceName: string,
    methodName: string
  ) => (
    <Box key={result.testName} className={styles["qa-dashboard__test-result"]}>
      <Box className={styles["qa-dashboard__test-result-header"]}>
        {result.status === "passed" ? (
          <CheckCircleIcon
            className={styles["qa-dashboard__icon--passed"]}
            fontSize="small"
          />
        ) : (
          <ErrorIcon
            className={styles["qa-dashboard__icon--failed"]}
            fontSize="small"
          />
        )}
        <Box
          className={styles["qa-dashboard__test-result-info"]}
          sx={{ flex: 1 }}
        >
          <Typography
            variant="body2"
            className={styles["qa-dashboard__test-name"]}
          >
            {result.testName}
          </Typography>
          {result.displayName && (
            <Typography variant="caption" color="textSecondary">
              {result.displayName}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Chip
            size="small"
            label={`${result.duration}ms`}
            className={styles["qa-dashboard__duration-chip"]}
          />
          <Tooltip title="Re-run this test">
            <IconButton
              size="small"
              color="primary"
              onClick={() =>
                runSingleTest(
                  serviceName,
                  methodName,
                  result.testName,
                  result.displayName,
                  resolveDeclaringTestClassName(
                    serviceName,
                    methodName,
                    result.testName
                  )
                )
              }
            >
              <PlayArrowIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      {result.status === "failed" && result.errorMessage && (
        <Alert severity="error" className={styles["qa-dashboard__error-alert"]}>
          <Typography variant="caption" component="div">
            <strong>Error:</strong> {result.errorMessage}
          </Typography>
          {result.stackTrace && (
            <Typography
              variant="caption"
              component="pre"
              className={styles["qa-dashboard__stack-trace"]}
            >
              {result.stackTrace}
            </Typography>
          )}
        </Alert>
      )}
    </Box>
  );

  // Render a method card
  const renderMethodCard = (service: QAServiceResponse, method: MethodInfo) => {
    const serviceState = serviceTestStates[service.serviceName];
    const methodState = serviceState?.methodStates[method.methodName];
    const isRunning = methodState?.status === "running";
    const hasResults = (methodState?.results?.length ?? 0) > 0;

    const runningTotal = methodState?.totalTests ?? method.testCount;
    const runningCompleted =
      methodState?.completedTests ?? methodState?.results?.length ?? 0;
    const runningProgress =
      methodState?.progress ??
      (runningTotal > 0 ? (runningCompleted / runningTotal) * 100 : 0);

    // Calculate passed/failed counts from results
    const passedCount =
      methodState?.results?.filter((r) => r.status === "passed").length ?? 0;
    const failedCount =
      methodState?.results?.filter((r) => r.status === "failed").length ?? 0;

    return (
      <Paper
        key={method.methodName}
        className={styles["qa-dashboard__method-card"]}
      >
        {/* Top Row: Method name + actions */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CodeIcon fontSize="small" color="action" />
              <Typography variant="subtitle1" fontWeight={500}>
                {method.methodName}
              </Typography>
              {methodState?.status &&
                methodState.status !== "idle" &&
                getStatusIcon(methodState.status)}
            </Box>
            <Typography
              variant="caption"
              color="textSecondary"
              sx={{ ml: 3.5 }}
            >
              {method.description}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Tooltip
              title={
                method.testCount > 0 ? "Run all tests" : "No tests available"
              }
            >
              <span>
                <IconButton
                  size="small"
                  color="primary"
                  disabled={method.testCount === 0 || isRunning}
                  onClick={() => runMethodTests(service.serviceName, method)}
                >
                  {isRunning ? (
                    <CircularProgress size={20} />
                  ) : (
                    <PlayArrowIcon />
                  )}
                </IconButton>
              </span>
            </Tooltip>
            {method.testCount > 0 && (
              <IconButton
                size="small"
                onClick={() =>
                  toggleMethodExpanded(service.serviceName, method.methodName)
                }
              >
                {methodState?.expanded ? (
                  <ExpandLessIcon />
                ) : (
                  <ExpandMoreIcon />
                )}
              </IconButton>
            )}
          </Box>
        </Box>

        {/* Bottom Row: Status chips */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mt: 1.5,
          }}
        >
          {/* Left: Test count */}
          <Chip
            size="small"
            icon={<BugReportIcon />}
            label={`${method.testCount} tests`}
            color={method.hasCoverage ? "success" : "default"}
            variant="outlined"
            sx={{ fontWeight: 500 }}
          />
          {/* Right: Run status chips */}
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            {hasResults ? (
              <>
                <Chip
                  size="small"
                  icon={<CheckCircleIcon />}
                  label={`${passedCount} passed`}
                  color="success"
                  variant="filled"
                />
                {failedCount > 0 && (
                  <Chip
                    size="small"
                    icon={<ErrorIcon />}
                    label={`${failedCount} failed`}
                    color="error"
                    variant="filled"
                  />
                )}
              </>
            ) : (
              method.testCount > 0 && (
                <Chip
                  size="small"
                  icon={<HourglassEmptyIcon />}
                  label="Not run"
                  sx={{
                    backgroundColor: "rgba(0, 0, 0, 0.08)",
                    color: "text.secondary",
                  }}
                />
              )
            )}
          </Box>
        </Box>

        {/* Running Progress - Show prominently when tests are running */}
        {isRunning && (
          <Box sx={{ mt: 1.5, mb: 0.5 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 0.5,
              }}
            >
              <Typography variant="caption" color="primary" fontWeight={500}>
                Running tests...
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {runningCompleted} / {runningTotal}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={runningProgress}
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: "rgba(0, 0, 0, 0.08)",
                "& .MuiLinearProgress-bar": {
                  borderRadius: 3,
                },
              }}
            />
            <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
              <Typography variant="caption" sx={{ color: "success.main" }}>
                ✓ {methodState?.passedTests ?? 0} passed
              </Typography>
              <Typography variant="caption" sx={{ color: "error.main" }}>
                ✗ {methodState?.failedTests ?? 0} failed
              </Typography>
            </Box>
          </Box>
        )}

        {/* Test List - Always show when expanded */}
        <Collapse in={methodState?.expanded && method.testCount > 0}>
          <Divider sx={{ mt: 1 }} />
          <Box className={styles["qa-dashboard__test-results"]}>
            {hasResults
              ? // Show actual results after running
                methodState?.results.map((result) =>
                  renderTestResult(
                    result,
                    service.serviceName,
                    method.methodName
                  )
                )
              : // Show test list with last run info or "Never run" status
                method.associatedUnitTests.map((test) => {
                  const hasRun = test.hasBeenRun && test.lastRunStatus;
                  const isPassed =
                    hasRun && test.lastRunStatus?.toUpperCase() === "PASSED";
                  const isFailed =
                    hasRun &&
                    (test.lastRunStatus?.toUpperCase() === "FAILED" ||
                      test.lastRunStatus?.toUpperCase() === "ERROR");

                  return (
                    <Box
                      key={test.testMethodName}
                      className={styles["qa-dashboard__test-result"]}
                    >
                      <Box
                        className={styles["qa-dashboard__test-result-header"]}
                      >
                        {hasRun ? (
                          isPassed ? (
                            <CheckCircleIcon
                              fontSize="small"
                              sx={{ color: "success.main", mr: 1 }}
                            />
                          ) : isFailed ? (
                            <ErrorIcon
                              fontSize="small"
                              sx={{ color: "error.main", mr: 1 }}
                            />
                          ) : (
                            <HourglassEmptyIcon
                              fontSize="small"
                              sx={{ color: "text.disabled", mr: 1 }}
                            />
                          )
                        ) : (
                          <HourglassEmptyIcon
                            fontSize="small"
                            sx={{ color: "text.disabled", mr: 1 }}
                          />
                        )}
                        <Box
                          className={styles["qa-dashboard__test-result-info"]}
                          sx={{ flex: 1 }}
                        >
                          <Typography
                            variant="body2"
                            className={styles["qa-dashboard__test-name"]}
                          >
                            {test.testMethodName}
                          </Typography>
                          {test.displayName && (
                            <Typography variant="caption" color="textSecondary">
                              {test.displayName}
                            </Typography>
                          )}
                          {hasRun && test.lastRunAt && (
                            <Typography
                              variant="caption"
                              color="textSecondary"
                              sx={{ display: "block", mt: 0.5 }}
                            >
                              Last run:{" "}
                              {new Date(test.lastRunAt).toLocaleString()} by{" "}
                              {test.lastRunByUserName}
                              {test.lastRunDurationMs != null &&
                                ` • ${test.lastRunDurationMs}ms`}
                            </Typography>
                          )}
                          {hasRun && isFailed && test.lastRunErrorMessage && (
                            <Typography
                              variant="caption"
                              color="error"
                              sx={{ display: "block", mt: 0.5 }}
                            >
                              Error: {test.lastRunErrorMessage}
                            </Typography>
                          )}
                        </Box>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          {hasRun ? (
                            <Chip
                              size="small"
                              label={test.lastRunStatus}
                              color={
                                isPassed
                                  ? "success"
                                  : isFailed
                                  ? "error"
                                  : "default"
                              }
                              sx={{ fontSize: "0.7rem" }}
                            />
                          ) : (
                            <Chip
                              size="small"
                              label="Never run"
                              sx={{
                                backgroundColor: "rgba(0, 0, 0, 0.08)",
                                color: "text.secondary",
                                fontSize: "0.7rem",
                              }}
                            />
                          )}
                          <Tooltip title="Run this test">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() =>
                                runSingleTest(
                                  service.serviceName,
                                  method.methodName,
                                  test.testMethodName,
                                  test.displayName,
                                  test.declaringTestClassName
                                )
                              }
                            >
                              <PlayArrowIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    </Box>
                  );
                })}
          </Box>
        </Collapse>
      </Paper>
    );
  };

  // Render a service accordion
  const renderServiceAccordion = (service: QAServiceResponse) => {
    const serviceState = serviceTestStates[service.serviceName];
    const isRunning = serviceState?.isRunning ?? false;

    // Calculate passed, failed, and not run counts across all methods
    let passedCount = 0;
    let failedCount = 0;
    if (serviceState?.methodStates) {
      Object.values(serviceState.methodStates).forEach((methodState) => {
        if (methodState.results) {
          passedCount += methodState.results.filter(
            (r) => r.status === "passed"
          ).length;
          failedCount += methodState.results.filter(
            (r) => r.status === "failed"
          ).length;
        }
      });
    }
    const runCount = passedCount + failedCount;
    const notRunCount = service.totalTests - runCount;

    return (
      <Accordion
        key={service.serviceName}
        expanded={expandedService === service.serviceName}
        onChange={(_, isExpanded) =>
          setExpandedService(isExpanded ? service.serviceName : false)
        }
        className={styles["qa-dashboard__service-accordion"]}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          className={styles["qa-dashboard__service-summary"]}
        >
          <Box sx={{ width: "100%" }}>
            {/* Top Row: Service name and controller info */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                mb: 1.5,
              }}
            >
              <Box className={styles["qa-dashboard__service-info"]}>
                <Typography
                  variant="h6"
                  className={styles["qa-dashboard__service-name"]}
                >
                  {service.serviceName.replace("Service", "")}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {service.controllerName} • {service.basePath}
                </Typography>
              </Box>
            </Box>
            {/* Bottom Row: All status chips */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              {/* Left: Summary chips */}
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <Chip
                  size="small"
                  label={`${service.totalMethods} methods`}
                  variant="outlined"
                />
                <Chip
                  size="small"
                  label={`${service.totalTests} tests`}
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  size="small"
                  label={`${service.coveragePercentage.toFixed(0)}% coverage`}
                  color={
                    service.coveragePercentage >= 80
                      ? "success"
                      : service.coveragePercentage >= 50
                      ? "warning"
                      : "error"
                  }
                />
              </Box>
              {/* Right: Test run status chips */}
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                {passedCount > 0 && (
                  <Chip
                    size="small"
                    icon={<CheckCircleIcon />}
                    label={`${passedCount} passed`}
                    color="success"
                    variant="filled"
                  />
                )}
                {failedCount > 0 && (
                  <Chip
                    size="small"
                    icon={<ErrorIcon />}
                    label={`${failedCount} failed`}
                    color="error"
                    variant="filled"
                  />
                )}
                {notRunCount > 0 && (
                  <Chip
                    size="small"
                    icon={<HourglassEmptyIcon />}
                    label={`${notRunCount} not run`}
                    sx={{
                      backgroundColor: "rgba(0, 0, 0, 0.08)",
                      color: "text.secondary",
                    }}
                  />
                )}
              </Box>
            </Box>
          </Box>
        </AccordionSummary>
        <AccordionDetails className={styles["qa-dashboard__service-details"]}>
          {/* Service Progress Bar */}
          {isRunning && (
            <Box className={styles["qa-dashboard__service-progress"]}>
              <Box className={styles["qa-dashboard__progress-header"]}>
                <Typography variant="body2">
                  Running tests: {serviceState.completedTests}/
                  {serviceState.totalTests}
                </Typography>
                <Typography variant="body2" color="primary">
                  {serviceState.progress.toFixed(0)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={serviceState.progress}
                className={styles["qa-dashboard__progress-bar"]}
              />
            </Box>
          )}

          {/* Run All Button */}
          <Box className={styles["qa-dashboard__run-all-container"]}>
            <Button
              variant="contained"
              color="primary"
              startIcon={
                isRunning ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <PlayCircleOutlineIcon />
                )
              }
              onClick={() => runAllServiceTests(service)}
              disabled={isRunning || service.totalTests === 0}
            >
              {isRunning ? "Running..." : `Run All ${service.totalTests} Tests`}
            </Button>
          </Box>

          {/* Methods List */}
          <Box className={styles["qa-dashboard__methods-list"]}>
            {service.methods.map((method) => renderMethodCard(service, method))}
          </Box>
        </AccordionDetails>
      </Accordion>
    );
  };

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box className={styles["qa-dashboard__loading"]}>
          <CircularProgress size={48} />
          <Typography variant="h6" color="textSecondary">
            Loading QA Dashboard...
          </Typography>
        </Box>
      </Container>
    );
  }

  const handleTabChange = (
    _event: React.SyntheticEvent,
    newValue: TabValue
  ) => {
    setCurrentTab(newValue);
  };

  return (
    <Container maxWidth="xl">
      <Box className={styles["qa-dashboard__container"]}>
        {/* Error Alert */}
        {error && (
          <Alert
            severity="error"
            onClose={() => setError(null)}
            className={styles["qa-dashboard__alert"]}
          >
            {error}
          </Alert>
        )}

        {/* Main Card with Integrated Tabs */}
        <Paper className={styles["qa-dashboard__main-card"]} elevation={0}>
          {/* Tab Header */}
          <Box className={styles["qa-dashboard__tab-header"]}>
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              aria-label="QA test type tabs"
              className={styles["qa-dashboard__tabs"]}
            >
              <Tab
                label="Unit Tests"
                value="unit"
                className={styles["qa-dashboard__tab"]}
              />
              <Tab
                label="Automated API Tests"
                value="api"
                className={styles["qa-dashboard__tab"]}
              />
              <Tab
                label="Automated Browser Tests"
                value="browser"
                className={styles["qa-dashboard__tab"]}
              />
            </Tabs>
          </Box>

          {/* Tab Content Area */}
          <Box className={styles["qa-dashboard__tab-body"]}>
            {/* Unit Tests Tab */}
            <TabPanel value={currentTab} index="unit">
              {/* Coverage Stats */}
              {renderCoverageStats()}

              {/* Services List */}
              <Box className={styles["qa-dashboard__services"]}>
                <Typography
                  variant="h6"
                  className={styles["qa-dashboard__section-title"]}
                >
                  Services & Unit Tests
                </Typography>
                {services.map(renderServiceAccordion)}
              </Box>
            </TabPanel>

            {/* Automated API Tests Tab */}
            <TabPanel value={currentTab} index="api">
              <Box className={styles["qa-dashboard__placeholder-content"]}>
                <Box className={styles["qa-dashboard__placeholder-icon"]}>
                  <CodeIcon style={{ fontSize: 64, opacity: 0.3 }} />
                </Box>
                <Typography variant="h6" gutterBottom>
                  Automated API Tests
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  API test execution and results will be displayed here.
                </Typography>
              </Box>
            </TabPanel>

            {/* Automated Browser Tests Tab */}
            <TabPanel value={currentTab} index="browser">
              <Box className={styles["qa-dashboard__placeholder-content"]}>
                <Box className={styles["qa-dashboard__placeholder-icon"]}>
                  <BugReportIcon style={{ fontSize: 64, opacity: 0.3 }} />
                </Box>
                <Typography variant="h6" gutterBottom>
                  Automated Browser Tests
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Browser test execution and results will be displayed here.
                </Typography>
              </Box>
            </TabPanel>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default QADashboard;
