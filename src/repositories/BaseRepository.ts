// C:\Users\vivek_laxvnt1\Desktop\JudgeXpert\Backend\src\repositories\BaseRepository.ts
import { Model, Document, FilterQuery } from "mongoose";
import {IBaseRepository} from "../interfaces/baseRepositoryInterface/IBaseRepositories"

class BaseRepository<T extends Document> implements IBaseRepository<T> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async create(data: Partial<T>): Promise<T> {
    return await this.model.create(data);
  }

  async findAll(): Promise<T[]> {
    return await this.model.find()
  }

  async findById(id: string): Promise<T | null> {
    return await this.model.findById(id) 
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    return await this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string): Promise<T | null> {
    return await this.model.findByIdAndDelete(id);
  }

  async countDocuments(query: FilterQuery<T>): Promise<number> {
    return this.model.countDocuments(query).exec();
  }
  
}

export default BaseRepository;