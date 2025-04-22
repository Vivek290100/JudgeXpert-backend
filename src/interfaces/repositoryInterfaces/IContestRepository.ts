// Backend\src\interfaces\repositoryInterfaces\IContestRepository.ts
import { Document, FilterQuery } from "mongoose";
import { IBaseRepository } from "../baseRepositoryInterface/IBaseRepositories";

export interface IContestRepository extends IBaseRepository<Document> {
  findPaginated(page: number, limit: number, query?: FilterQuery<any>): Promise<{ contests: any[]; total: number }>;
  addParticipant(contestId: string, userId: string): Promise<any>;
  countDocuments(query: FilterQuery<any>): Promise<number>;
  findByIdAndUpdate(contestId: string, update: Partial<any>, options?: { new: boolean }): Promise<any>;
  findById(contestId: string): Promise<any>;
  create(data: any): Promise<any>;
  findTopSubmissions(problemId: string, contestId: string, limit?: number): Promise<any[]>;
  findLatestSubmissions(problemId: string, contestId: string, userIds?: string[]): Promise<any[]>;

  findByStartTimeRange(start: Date, end: Date): Promise<any[]>;
}