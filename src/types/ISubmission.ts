// Backend\src\types\ISubmission.ts
import { Types } from "mongoose";
import { TestCaseResult } from "./ITestCaseResult";

export interface ISubmission {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;
  problemId: Types.ObjectId;
  language: string;
  code: string;
  results: TestCaseResult[];
  passed: boolean;
  submittedAt: Date;
  isRunOnly: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}