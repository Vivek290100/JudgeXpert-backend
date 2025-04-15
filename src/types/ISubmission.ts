// Backend\src\types\ISubmission.ts
import { Types } from "mongoose";
import { TestCaseResult } from "./ITestCaseResult";

export interface PopulatedUser {
  _id: Types.ObjectId;
  userName: string;
}

export interface PopulatedContest {
  _id: Types.ObjectId;
  title: string;
}

export interface ISubmission {
  _id?: Types.ObjectId;
  userId: Types.ObjectId | PopulatedUser; 
   problemId: Types.ObjectId;
  language: string;
  code: string;
  results: TestCaseResult[];
  passed: boolean;
  submittedAt: Date;
  isRunOnly: boolean;
  executionTime: number;
  createdAt?: Date;
  updatedAt?: Date;
  contestId?: Types.ObjectId | PopulatedContest | null;
}