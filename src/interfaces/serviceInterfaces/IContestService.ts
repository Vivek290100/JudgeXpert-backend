import { FilterQuery } from "mongoose";

export interface IContestService {
  createContest(data: any): Promise<any>;
  getContests(page: number, limit: number, query?: FilterQuery<any>): Promise<{
    contests: any[];
    totalPages: number;
    currentPage: number;
    totalContests: number;
    activeContests: number;
    upcomingContests: number;
    endedContests: number;
  }>;
  registerForContest(id: string, userId: string): Promise<{ message: string }>;
  updateContestStatus(contestId: string, isBlocked: boolean): Promise<any>;
}