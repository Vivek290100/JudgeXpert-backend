// src/interfaces/IProblemService.ts
import { IProblem } from "./IProblem";
import ProblemRepository from "../repositories/ProblemRepository";
import { FilterQuery } from "mongoose";

export interface IProblemService {
  problemRepository: ProblemRepository;

  createProblemFromFiles(problemDir: string): Promise<IProblem | null>;
  getProblemById(id: string): Promise<IProblem | null>;
  getProblemBySlug(slug: string): Promise<IProblem | null>;
  processSpecificProblem(problemDir: string): Promise<IProblem | null>;
  getProblemsPaginated(
    page: number,
    limit: number,
    query?: FilterQuery<IProblem>
  ): Promise<{ problems: IProblem[]; total: number }>;
  updateProblemStatus(id: string, status: "premium" | "free"): Promise<IProblem | null>;
}