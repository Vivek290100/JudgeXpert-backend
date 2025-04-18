import { IDiscussion } from "../../types/IDiscussion";

export interface IDiscussionService {
  createDiscussion(
    problemId: string,
    userId: string,
    message: string
  ): Promise<IDiscussion>;

  getDiscussionsByProblemId(
    problemId: string,
    page: number,
    limit: number
  ): Promise<{ discussions: IDiscussion[]; total: number }>;

  addReply(
    discussionId: string,
    userId: string,
    message: string
  ): Promise<IDiscussion>;

  upvoteDiscussion(
    discussionId: string,
    userId: string
  ): Promise<IDiscussion>;

  upvoteReply(
    discussionId: string,
    replyIndex: number,
    userId: string
  ): Promise<IDiscussion>;
}