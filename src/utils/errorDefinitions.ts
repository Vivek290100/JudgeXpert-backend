// Backend\src\utils\errorDefinitions.ts
import { BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError, InternalServerError } from "./errors";

export const Errors = {
  // Generic Errors
  INVALID_INPUT: (field: string) => new BadRequestError(`Invalid ${field} value`),
  REQUIRED_FIELD_MISSING: (field: string) => new BadRequestError(`${field} is required`),
  SESSION_EXPIRED: () => new BadRequestError("Session expired. Please try again."),
  OTP_EXPIRED: () => new BadRequestError("OTP expired. Please request a new one."),
  INVALID_OTP: () => new BadRequestError("Invalid OTP. Please enter the correct OTP."),
  UNAUTHORIZED: () => new UnauthorizedError("Unauthorized action"),
  INTERNAL_SERVER_ERROR: (message: string) => new InternalServerError(message),

  // User-Related Errors
  USER_NOT_FOUND: () => new NotFoundError("User not found"),
  USER_ALREADY_EXISTS: () => new BadRequestError("User with this email or username already exists"),
  USER_BLOCKED: () => new ForbiddenError("This account is blocked. Please contact support."),
  USER_LOGIN_BLOCKED: () => new ForbiddenError("You are not allowed to sign in. Your account has been blocked."),
  INVALID_PASSWORD: () => new BadRequestError("Invalid password"),
  GOOGLE_CREDENTIAL_MISSING: () => new BadRequestError("Google credential is required"),
  NO_USER_ID: () => new UnauthorizedError("Unauthorized: No user ID found"),
  FAILED_TO_UPDATE_USER: (action: string) => new InternalServerError(`Failed to ${action} user`),
  INVALID_REFRESH_TOKEN: () => new UnauthorizedError("No valid refresh token found. Please log in again."),
  EXPIRED_REFRESH_TOKEN: () => new UnauthorizedError("Refresh token is invalid or expired. Please log in again."),
  GOOGLE_AUTH_ONLY: () => new BadRequestError("Please use Google to manage your password"),

  // Problem-Related Errors
  PROBLEM_NOT_FOUND: () => new NotFoundError("Problem not found"),
  INVALID_PROBLEM_DIR: (dir: string) => new BadRequestError(`Invalid problem directory structure: ${dir}`),
  TEST_CASE_MISMATCH: () => new BadRequestError("Mismatch between input and output test case files"),
  UNSUPPORTED_LANGUAGE: (lang: string) => new BadRequestError(`Unsupported language: ${lang}`),
  NO_TEST_CASES: () => new NotFoundError("No active test cases found"),
  INVALID_STATUS: (status: string) => new BadRequestError(`Invalid status value: ${status}. Must be "premium" or "free".`),
  FAILED_TO_PROCESS_PROBLEM: () => new NotFoundError("Failed to create or update problem: no document returned"),
};