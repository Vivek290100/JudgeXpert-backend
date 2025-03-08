// C:\Users\vivek_laxvnt1\Desktop\JudgeXpert\Backend\src\interfaces\IBaseRepositories.ts

import { Document, Types } from "mongoose";

export interface IBaseRepository<T extends Document> {
  create(data: Partial<T>): Promise<T>;
  findAll(): Promise<T[]>;
  findById(id: string | Types.ObjectId): Promise<T | null>;
  update(id: string | Types.ObjectId, data: Partial<T>): Promise<T | null>;
  delete(id: string | Types.ObjectId): Promise<T | null>;
}
  