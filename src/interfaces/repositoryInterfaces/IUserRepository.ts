import { Document, FilterQuery } from "mongoose";
import { IBaseRepository } from "../baseRepositoryInterface/IBaseRepositories";
import { IUser } from "../../types/IUser";

export interface IUserRepository extends IBaseRepository<IUser & Document> {
  findByQuery(query: FilterQuery<IUser>): Promise<IUser | null>;
  findPaginated(page: number, limit: number, query?: FilterQuery<IUser>): Promise<{ users: IUser[]; total: number }>;
}