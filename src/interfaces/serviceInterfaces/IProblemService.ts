import { IProblem } from "../../types/IProblem";
import { FilterQuery, UpdateQuery } from "mongoose";
import { ISubmission } from "../../types/ISubmission";
import { TestCaseResult } from "../../types/ITestCaseResult";

export interface IProblemService {
  createProblemFromFiles(problemDir: string): Promise<IProblem | null>;
  getProblemById(id: string): Promise<IProblem | null>;
  getProblemBySlug(slug: string): Promise<IProblem | null>;
  processSpecificProblem(problemDir: string): Promise<IProblem | null>;
  getProblemsPaginated(page: number, limit: number, query?: FilterQuery<IProblem>): Promise<{ problems: IProblem[]; total: number }>;
  updateProblemStatus(id: string, status: "premium" | "free"): Promise<IProblem | null>;
  updateProblem(id: string, updates: UpdateQuery<IProblem>): Promise<IProblem | null>;
  blockProblem(id: string): Promise<IProblem | null>;
  unblockProblem(id: string): Promise<IProblem | null>;
  executeCode(
    problemId: string,
    language: string,
    code: string,
    userId: string,
    isRunOnly: boolean,
    contestId?: string
  ): Promise<{
    results: TestCaseResult[];
    passed: boolean;
    executionTime: number;   
  }>;  countProblems(query?: FilterQuery<IProblem>): Promise<number>;
  getUserSubmissions(userId: string, problemSlug?: string): Promise<ISubmission[]>;
}