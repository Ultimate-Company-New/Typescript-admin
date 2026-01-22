import type { TestResult } from "./api-models";

// Test status type

export interface MethodTestState {
  [methodName: string]: {
    status: "passed" | "failed" | "skipped" | "running" | "idle";
    results: TestResult[];
    expanded: boolean;
    /** Real-time progress for this method execution (0-100) */
    progress?: number;
    /** Real-time completed test count (estimated while running) */
    completedTests?: number;
    /** Total expected tests for this method execution */
    totalTests?: number;
    /** Real-time counters from backend (or estimates while RUNNING) */
    passedTests?: number;
    failedTests?: number;
    skippedTests?: number;
  };
}

export interface ServiceTestState {
  [serviceName: string]: {
    isRunning: boolean;
    progress: number;
    totalTests: number;
    completedTests: number;
    methodStates: MethodTestState;
  };
}
