import { IContestRepository } from "../interfaces/repositoryInterfaces/IContestRepository";
import { IContestService } from "../interfaces/serviceInterfaces/IContestService";
import { BadRequestError, ErrorMessages } from "../utils/errors";
import { FilterQuery } from "mongoose";

class ContestService implements IContestService {
  constructor(private contestRepository: IContestRepository) {}

  async createContest(data: any): Promise<any> {
    if (new Date(data.startTime) >= new Date(data.endTime)) {
      throw new BadRequestError("Start time must be before end time");
    }
    return this.contestRepository.create(data);
  }

  async getContests(page: number, limit: number, query: FilterQuery<any> = {}): Promise<{
    contests: any[];
    totalPages: number;
    currentPage: number;
    totalContests: number;
    activeContests: number;
    upcomingContests: number;
    endedContests: number;
  }> {
    const { contests, total } = await this.contestRepository.findPaginated(page, limit, query);
    const now = new Date();

    const [activeCount, upcomingCount, endedCount] = await Promise.all([
      this.contestRepository.countDocuments({ ...query, startTime: { $lte: now }, endTime: { $gte: now } }),
      this.contestRepository.countDocuments({ ...query, startTime: { $gt: now } }),
      this.contestRepository.countDocuments({ ...query, endTime: { $lt: now } }),
    ]);

    return {
      contests,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalContests: total,
      activeContests: activeCount,
      upcomingContests: upcomingCount,
      endedContests: endedCount,
    };
  }

  async registerForContest(id: string, userId: string): Promise<{ message: string }> {
    const contest = await this.contestRepository.findById(id);
    if (!contest) throw new BadRequestError(ErrorMessages.CONTEST_NOT_FOUND);
    await this.contestRepository.addParticipant(id, userId);
    return { message: "Registered successfully" };
  }

  async updateContestStatus(contestId: string, isBlocked: boolean): Promise<any> {
    const contest = await this.contestRepository.findByIdAndUpdate(
      contestId,
      { isBlocked },
      { new: true }
    );
    if (!contest) throw new BadRequestError(ErrorMessages.CONTEST_NOT_FOUND);
    return contest;
  }
}

export default ContestService;