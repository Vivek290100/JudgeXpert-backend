export interface TestCaseResult {
    testCaseIndex: number;
    input: string;
    expectedOutput: string;
    actualOutput: string;
    stderr: string;
    passed: boolean;
  }