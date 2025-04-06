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
}
