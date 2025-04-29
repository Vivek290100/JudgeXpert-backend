// src/__tests__/errors.test.ts
import { BadRequestError, NotFoundError, InternalServerError, UnauthorizedError, ForbiddenError, ErrorMessages, AppError } from '../../src/utils/errors';
import { StatusCode } from '../../src/utils/statusCode';

describe('Errors', () => {
  it('should create an AppError with stack trace', () => {
    const error = new AppError(StatusCode.INTERNAL_SERVER_ERROR, 'Test error', false, { detail: 'test' });
    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(StatusCode.INTERNAL_SERVER_ERROR);
    expect(error.isOperational).toBe(false);
    expect(error.details).toEqual({ detail: 'test' });
    expect(error.stack).toBeDefined();
  });

  it('should create a BadRequestError', () => {
    const error = new BadRequestError(ErrorMessages.ALL_FIELDS_REQUIRED, { field: 'test' });
    expect(error.message).toBe(ErrorMessages.ALL_FIELDS_REQUIRED);
    expect(error.statusCode).toBe(StatusCode.BAD_REQUEST);
    expect(error.details).toEqual({ field: 'test' });
  });

  it('should create a NotFoundError', () => {
    const error = new NotFoundError(ErrorMessages.USER_NOT_FOUND, { id: '1' });
    expect(error.message).toBe(ErrorMessages.USER_NOT_FOUND);
    expect(error.statusCode).toBe(StatusCode.NOT_FOUND);
    expect(error.details).toEqual({ id: '1' });
  });

  it('should create an UnauthorizedError', () => {
    const error = new UnauthorizedError(ErrorMessages.UNAUTHORIZED_ACCESS, { user: 'test' });
    expect(error.message).toBe(ErrorMessages.UNAUTHORIZED_ACCESS);
    expect(error.statusCode).toBe(StatusCode.UNAUTHORIZED);
    expect(error.details).toEqual({ user: 'test' });
  });

  it('should create a ForbiddenError', () => {
    const error = new ForbiddenError('Forbidden access', { resource: 'test' });
    expect(error.message).toBe('Forbidden access');
    expect(error.statusCode).toBe(StatusCode.FORBIDDEN);
    expect(error.details).toEqual({ resource: 'test' });
  });

  it('should create an InternalServerError with default message', () => {
    const error = new InternalServerError();
    expect(error.message).toBe(ErrorMessages.INTERNAL_SERVER_ERROR('Unknown'));
    expect(error.statusCode).toBe(StatusCode.INTERNAL_SERVER_ERROR);
  });

  it('should create an InternalServerError with custom message', () => {
    const error = new InternalServerError('Custom error', { cause: 'test' });
    expect(error.message).toBe('Custom error');
    expect(error.statusCode).toBe(StatusCode.INTERNAL_SERVER_ERROR);
    expect(error.details).toEqual({ cause: 'test' });
  });
});