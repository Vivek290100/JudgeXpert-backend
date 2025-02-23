// C:\Users\vivek_laxvnt1\Desktop\JudgeXpert\Backend\src\repositories\UserRepository.ts
import { FilterQuery } from "mongoose";
import { IUser } from "../interfaces/IUser";
import User from "../models/UserModel";
import BaseRepository from "./BaseRepository";

class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super(User);
  }

  async findPaginated(page: number, limit: number, query: FilterQuery<IUser> = {}): Promise<{ users: IUser[], total: number }> {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.model.find(query).skip(skip).limit(limit).exec(),
      this.model.countDocuments(query).exec(),
    ]);
    return { users, total };
  }
}

export default UserRepository
