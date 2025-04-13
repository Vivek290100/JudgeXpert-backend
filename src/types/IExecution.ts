// Backend\src\types\IExecution.ts
export interface ExecutionResult {
    run: {
      stdout: string;
      stderr: string;
      code: number;
      time: number;
    };
  }

