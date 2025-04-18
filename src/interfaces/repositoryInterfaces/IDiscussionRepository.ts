import { Document, FilterQuery, Types } from "mongoose";
import { IBaseRepository } from "../baseRepositoryInterface/IBaseRepositories";
import { IDiscussion } from "../../types/IDiscussion";

export interface IDiscussionRepository extends IBaseRepository<IDiscussion & Document> {
  findPaginated(
    page: number,
    limit: number,
    query: FilterQuery<IDiscussion>
  ): Promise<{ discussions: IDiscussion[]; total: number }>;

  createAndPopulate(
    data: Partial<IDiscussion>
  ): Promise<IDiscussion>;

  addReplyAndPopulate(
    discussionId: string,
    userId: Types.ObjectId | string,
    message: string
  ): Promise<IDiscussion>;

  upvoteDiscussion(
    discussionId: string,
    userId: Types.ObjectId | string
  ): Promise<IDiscussion>;

  upvoteReply(
    discussionId: string,
    replyIndex: number,
    userId: Types.ObjectId | string
  ): Promise<IDiscussion>;
}