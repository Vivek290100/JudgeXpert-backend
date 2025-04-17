// Backend\src\interfaces\serviceInterfaces\IContestService.ts
import { FilterQuery } from "mongoose";

export interface IContestService {
  createContest(data: any): Promise<any>;
  getContests(
    page: number,
    limit: number,
    query?: FilterQuery<any>
  ): Promise<{
    contests: any[];
    totalPages: number;
    currentPage: number;
    totalContests: number;
    activeContests: number;
    upcomingContests: number;
    endedContests: number;
  }>;
  getContestById(contestId: string): Promise<any>;
  registerForContest(id: string, userId: string): Promise<{ message: string }>;
  updateContestStatus(contestId: string, isBlocked: boolean): Promise<any>;
  getRegisteredContests(userId: string): Promise<string[]>;
  getProblemResultsForContest(contestId: string, problemId: string): Promise<any[]>;
}