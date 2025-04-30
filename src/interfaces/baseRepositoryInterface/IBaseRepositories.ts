//Backend\src\interfaces\baseRepositoryInterface\IBaseRepositories.ts
import { FilterQuery, UpdateQuery } from "mongoose";
import { Document } from "mongoose";

export interface IBaseRepository<T extends Document> {
  create(data: Partial<T>): Promise<T>;
  findAll(): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  update(id: string, data: UpdateQuery<T>): Promise<T | null>;
  delete(id: string): Promise<T | null>;
  countDocuments(query: FilterQuery<T>): Promise<number>;
}