//\Backend\src\interfaces\repositoryInterfaces\IProblemRepository.ts
import { Document, FilterQuery, UpdateQuery } from "mongoose";
import { IBaseRepository } from "../baseRepositoryInterface/IBaseRepositories";
import { IProblem } from "../../types/IProblem";

export interface IProblemRepository extends IBaseRepository<IProblem & Document> {
  findBySlug(slug: string): Promise<IProblem | null>;
  findPaginated(page: number, limit: number, query?: FilterQuery<IProblem>): Promise<{ problems: IProblem[]; total: number }>;
  incrementSolvedCount(problemId: string): Promise<IProblem | null>;
  upsertProblem(query: FilterQuery<IProblem>, update: UpdateQuery<IProblem>, options?: any): Promise<IProblem | null>;
  find(query: FilterQuery<IProblem>): Promise<IProblem[]>;
  countDocuments(query: FilterQuery<IProblem>): Promise<number>;
}