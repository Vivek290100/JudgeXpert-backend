import { Document, FilterQuery } from "mongoose";
import { IBaseRepository } from "../baseRepositoryInterface/IBaseRepositories";
import { IUser } from "../../types/IUser";
import { ILeaderboardUser } from "../../types/ILeaderboardUser";

export interface IUserRepository extends IBaseRepository<IUser & Document> {
  findByQuery(query: FilterQuery<IUser>): Promise<IUser | null>;
  findPaginated(page: number, limit: number, query?: FilterQuery<IUser>): Promise<{ users: IUser[]; total: number }>;
  findLeaderboard(page: number, limit: number): Promise<{ users: ILeaderboardUser[]; total: number }>;
}