// C:\Users\vivek_laxvnt1\Desktop\JudgeXpert\Backend\src\repositories\BaseRepository.ts
import { Model, Document, FilterQuery } from "mongoose";
import {IBaseRepository} from "../interfaces/IBaseRepositories"

class BaseRepository<T extends Document> implements IBaseRepository<T> {
  private model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async create(data: Partial<T>): Promise<T> {
    return await this.model.create(data);
  }
  async findByQuery(query: FilterQuery<T>): Promise<T | null> {
    return await this.model.findOne(query)
  }

  async findAll(): Promise<T[]> {
    return await this.model.find()
  }

  async findById(id: string): Promise<T | null> {
    return await this.model.findById(id) 
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    return await this.model.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id: string): Promise<T | null> {
    return await this.model.findByIdAndDelete(id);
  }
}

export default BaseRepository;
