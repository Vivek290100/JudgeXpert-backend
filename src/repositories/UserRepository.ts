// Backend\src\repositories\UserRepository.ts
import { FilterQuery } from "mongoose";
import { IUser } from "../types/IUser";
import User from "../models/UserModel";
import BaseRepository from "./BaseRepository";
import { IUserRepository } from "../interfaces/repositoryInterfaces/IUserRepository";

class UserRepository extends BaseRepository<IUser> implements IUserRepository {
  constructor() {
    super(User);
  }

  async findByQuery(query: FilterQuery<IUser>): Promise<IUser | null> {
    return this.model.findOne(query).exec();
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
