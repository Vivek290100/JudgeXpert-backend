import { Document, FilterQuery } from "mongoose";
import { IBaseRepository } from "../baseRepositoryInterface/IBaseRepositories";
import { IDiscussion } from "../../types/IDiscussion";

export interface IDiscussionRepository extends IBaseRepository<IDiscussion & Document> {
  findPaginated(
    page: number,
    limit: number,
    query: FilterQuery<IDiscussion>
  ): Promise<{ discussions: IDiscussion[]; total: number }>;
}