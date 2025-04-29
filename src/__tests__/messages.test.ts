// src/__tests__/messages.test.ts
import { SuccessMessages } from '../../src/utils/messages';

describe('Messages', () => {
  it('should have correct success messages', () => {
    expect(SuccessMessages.USERS_FETCHED).toBe('Users fetched successfully');
    expect(SuccessMessages.USER_FETCHED).toBe('User fetched successfully');
    expect(SuccessMessages.USER_BLOCKED).toBe('User blocked successfully');
    expect(SuccessMessages.USER_UNBLOCKED).toBe('User unblocked successfully');
    expect(SuccessMessages.PROBLEM_CREATED).toBe('Problem created successfully'); // Covers line 34
    expect(SuccessMessages.OPERATION_SUCCESS).toBe('Operation completed successfully');
    expect(SuccessMessages.LOGIN_SUCCESS).toBe('Login successful');
    expect(SuccessMessages.PROBLEMS_FETCHED).toBe('Problems fetched successfully');
  });
});