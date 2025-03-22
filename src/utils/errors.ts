//src/utils/errors.ts

export enum StatusCode {
    SUCCESS = 200,
    CREATED = 201,
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    INTERNAL_SERVER_ERROR = 500,
  }
  
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
    constructor(message: string = "Bad Request", details?: any) {
      super(StatusCode.BAD_REQUEST, message, true, details);
    }
  }
  
  export class UnauthorizedError extends AppError {
    constructor(message: string = "Unauthorized", details?: any) {
      super(StatusCode.UNAUTHORIZED, message, true, details);
    }
  }
  
  export class ForbiddenError extends AppError {
    constructor(message: string = "Forbidden", details?: any) {
      super(StatusCode.FORBIDDEN, message, true, details);
    }
  }
  
  export class NotFoundError extends AppError {
    constructor(message: string = "Not Found", details?: any) {
      super(StatusCode.NOT_FOUND, message, true, details);
    }
  }
  
  export class InternalServerError extends AppError {
    constructor(message: string = "Internal Server Error", details?: any) {
      super(StatusCode.INTERNAL_SERVER_ERROR, message, false, details);
    }
  }
  
  export const CommonErrors = {
    // Generic
    INVALID_INPUT: (field: string) => new BadRequestError(`Invalid ${field} value`),
    MISSING_REQUIRED_FIELD: (field: string) => new BadRequestError(`${field} is required`),
    UNAUTHORIZED_ACCESS: () => new UnauthorizedError("Unauthorized: No user ID found"),
    INTERNAL_SERVER_ERROR: (context: string) => new InternalServerError(`Internal server error: ${context}`),
  
    // user errs
    USER_NOT_FOUND: () => new NotFoundError("User not found"),
    USER_ID_REQUIRED: () => new BadRequestError("User ID is required"),
    INVALID_CREDENTIALS: () => new BadRequestError("Invalid credentials"),
    GOOGLE_CREDENTIAL_REQUIRED: () => new BadRequestError("Google credential is required"),
    ALL_FIELDS_REQUIRED: () => new BadRequestError("All fields are required"),
    INVALID_REQUEST_PAYLOAD: (fields: string) => new BadRequestError(`Invalid request payload: ${fields} are required`),
  
    // problem errs
    PROBLEM_NOT_FOUND: () => new NotFoundError("Problem not found"),
    PROBLEM_ID_REQUIRED: () => new BadRequestError("Problem ID is required"),
    PROBLEM_DIR_REQUIRED: () => new BadRequestError("problemDir is required and must be a string"),
    INVALID_DIFFICULTY: () => new BadRequestError("Invalid difficulty value"),
    INVALID_STATUS: () => new BadRequestError("Invalid status value; must be 'premium' or 'free'"),
    INVALID_SLUG: () => new BadRequestError("Invalid slug"),
    INVALID_PAGE_OR_LIMIT: () => new BadRequestError("Invalid page or limit parameters"),
    EXECUTION_FIELDS_REQUIRED: () => new BadRequestError("problemId, language, and code are required"),
    FAILED_TO_PROCESS_PROBLEM: () => new NotFoundError("Failed to process problem: no document returned"),
  };