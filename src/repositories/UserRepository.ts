import { FilterQuery } from "mongoose";
import { IUser } from "../types/IUser";
import User from "../models/UserModel";
import BaseRepository from "./BaseRepository";
import { IUserRepository } from "../interfaces/repositoryInterfaces/IUserRepository";
import { ILeaderboardUser } from "../types/ILeaderboardUser";

class UserRepository extends BaseRepository<IUser> implements IUserRepository {
  constructor() {
    super(User);
  }

  async findByQuery(query: FilterQuery<IUser>): Promise<IUser | null> {
    return this.model.findOne(query).exec();
  }

  async findPaginated(page: number, limit: number, query: FilterQuery<IUser> = {}): Promise<{ users: IUser[]; total: number }> {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.model.find(query).skip(skip).limit(limit).exec(),
      this.model.countDocuments(query).exec(),
    ]);
    return { users, total };
  }

  async findLeaderboard(page: number, limit: number): Promise<{ users: ILeaderboardUser[]; total: number }> {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.model
        .find({
          isBlocked: false,
          role: { $ne: "admin" }
        })
        .sort({ problemsSolved: -1 })
        .skip(skip)
        .limit(limit)
        .select("userName problemsSolved _id")
        .exec(),
      this.model.countDocuments({ isBlocked: false }).exec(),
    ]);

    const rankedUsers: ILeaderboardUser[] = users.map((user, index) => ({
      rank: skip + index + 1,
      username: user.userName,
      score: user.problemsSolved,
      _id: user._id.toString(),
    }));

    return { users: rankedUsers, total };
  }
}

export default UserRepository;