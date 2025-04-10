import { Document, FilterQuery } from "mongoose";
import { IBaseRepository } from "../baseRepositoryInterface/IBaseRepositories";

export interface IContestRepository extends IBaseRepository<Document> {
  findPaginated(page: number, limit: number, query?: FilterQuery<any>): Promise<{ contests: any[]; total: number }>;
  addParticipant(contestId: string, userId: string): Promise<any>;
  countDocuments(query: FilterQuery<any>): Promise<number>;
  findByIdAndUpdate(contestId: string, update: Partial<any>, options?: { new: boolean }): Promise<any>;
  findById(contestId: string): Promise<any>;
  create(data: any): Promise<any>;
}