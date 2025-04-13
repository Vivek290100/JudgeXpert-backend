// Backend\src\utils\errors.ts

import { StatusCode } from "./statusCode";

export const ErrorMessages = {
  // Generic
  INVALID_INPUT: (field: string) => `Invalid ${field} value`,
  MISSING_REQUIRED_FIELD: (field: string) => `${field} is required`,
  UNAUTHORIZED_ACCESS: "Unauthorized: No user ID found",
  INTERNAL_SERVER_ERROR: (context: string) => `Internal server error: ${context}`,
  
  // User
  USER_NOT_FOUND: "User not found",
  USER_ID_REQUIRED: "User ID is required",
  INVALID_CREDENTIALS: "Invalid credentials",
  GOOGLE_CREDENTIAL_REQUIRED: "Google credential is required",
  ALL_FIELDS_REQUIRED: "All fields are required",
  INVALID_REQUEST_PAYLOAD: (fields: string) => `Invalid request payload: ${fields} are required`,
  USER_EXISTS: "User with this email or username already exists",
  OTP_EXPIRED: "OTP expired. Please request a new one.",
  INVALID_OTP: "Invalid OTP. Please enter the correct OTP.",
  SIGNUP_SESSION_EXPIRED: "Sign up session expired. Please try again.",
  USER_BLOCKED: "You are not allowed to sign in. Your account has been blocked.",
  NO_REFRESH_TOKEN: "No valid refresh token found. Please log in again.",
  INVALID_REFRESH_TOKEN: "Refresh token is invalid or expired. Please log in again.",
  GOOGLE_AUTH_PASSWORD: "Please use Google to manage your password",
  OTP_NOT_VERIFIED: "OTP not verified. Please verify OTP first.",
  GOOGLE_LOGIN_FAILED: (error: string) => `Google login failed: ${error}`,
  INVALID_PAGINATION_PARAMS: "invalid pagination params",
  CONTEST_NOT_FOUND: "Contest not found",

  
  // Problem
  PROBLEM_NOT_FOUND: "Problem not found",
  PROBLEM_ID_REQUIRED: "Problem ID is required",
  PROBLEM_DIR_REQUIRED: "problemDir is required and must be a string",
  INVALID_DIFFICULTY: "Invalid difficulty value",
  INVALID_STATUS: "Invalid status value; must be 'premium' or 'free'",
  INVALID_SLUG: "Invalid slug",
  INVALID_PAGE_OR_LIMIT: "Invalid page or limit parameters",
  EXECUTION_FIELDS_REQUIRED: "problemId, language, and code are required",
  FAILED_TO_PROCESS_PROBLEM: "Failed to process problem: no document returned",
  INVALID_PROBLEM_DIR_STRUCTURE: (dir: string) => `Invalid problem directory structure: ${dir}`,
  TEST_CASE_MISMATCH: "Mismatch between input and output test case files",
  UNSUPPORTED_LANGUAGE: (lang: string) => `Unsupported language: ${lang}`,
  NO_ACTIVE_TEST_CASES: "No active test cases found",

  DISCUSSION_NOT_FOUND: "discussions not found",
  USER_ALREADY_REGISTERED: "user already registered",
  CONTEST_ALREADY_STARTED: "contest alresdy started",


};

// Error Classes
export class AppError extends Error {
  constructor(
    public statusCode: StatusCode,
    public message: string,
    public isOperational: boolean = true,
    public details?: any
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = ErrorMessages.ALL_FIELDS_REQUIRED, details?: any) {
    super(StatusCode.BAD_REQUEST, message, true, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = ErrorMessages.UNAUTHORIZED_ACCESS, details?: any) {
    super(StatusCode.UNAUTHORIZED, message, true, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden", details?: any) {
    super(StatusCode.FORBIDDEN, message, true, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = ErrorMessages.USER_NOT_FOUND, details?: any) {
    super(StatusCode.NOT_FOUND, message, true, details);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = ErrorMessages.INTERNAL_SERVER_ERROR("Unknown"), details?: any) {
    super(StatusCode.INTERNAL_SERVER_ERROR, message, false, details);
  }
}