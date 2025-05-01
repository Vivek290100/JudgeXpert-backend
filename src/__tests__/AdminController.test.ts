// src/__tests__/AdminController.test.ts
import { Request, Response } from 'express';
import AdminController from '../../src/controllers/AdminController';
import { IAdminService } from '../../src/interfaces/serviceInterfaces/IAdminService';
import { sendResponse, handleError } from '../../src/utils/responseUtils';
import { BadRequestError, ErrorMessages, NotFoundError } from '../../src/utils/errors';
import { StatusCode } from '../../src/utils/statusCode';
import { SuccessMessages } from '../../src/utils/messages';

// Mock the utility functions
jest.mock('../../src/utils/responseUtils', () => ({
  sendResponse: jest.fn(),
  handleError: jest.fn(),
}));

// Mock the IAdminService
const mockAdminService: IAdminService = {
  getAllUsers: jest.fn(),
  getUserById: jest.fn(),
  blockUser: jest.fn(),
  unblockUser: jest.fn(),
  toggleBlockStatus: jest.fn(),
  getDashboardStats: jest.fn(),
};

// Create an instance of AdminController with the mock service
const adminController = new AdminController(mockAdminService);

// Mock Request and Response
const mockRequest = (query: any = {}, params: any = {}, body: any = {}) =>
  ({ query, params, body } as Request);
const mockResponse = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

// Mock StatusCode.SUCCESS to ensure consistency
jest.mock('../../src/utils/statusCode', () => ({
  StatusCode: {
    SUCCESS: 200,
    BAD_REQUEST: 400,
  },
}));

describe('AdminController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllUsers', () => {
    it('should fetch all users successfully', async () => {
      const req = mockRequest({ page: '1', limit: '10', search: 'test' });
      const res = mockResponse();

      const mockUsers: any[] = [
        {
          _id: '1',
          userName: 'testuser',
          email: 'test@example.com',
          fullName: undefined,
          role: 'user',
          profileImage: '',
          joinedDate: new Date(),
          problemsSolved: 0,
          solvedProblems: [],
          rank: 1,
          isBlocked: false,
          isPremium: false,
          isGoogleAuth: false,
        },
      ];
      const mockTotal = 1;
      (mockAdminService.getAllUsers as jest.Mock).mockResolvedValue({ users: mockUsers, total: mockTotal });

      await adminController.getAllUsers(req, res);

      expect(mockAdminService.getAllUsers).toHaveBeenCalledWith(1, 10, 'test');
      expect(sendResponse).toHaveBeenCalledWith(res, {
        success: true,
        status: StatusCode.SUCCESS,
        message: SuccessMessages.USERS_FETCHED,
        data: {
          users: [
            {
              id: '1',
              email: 'test@example.com',
              userName: 'testuser',
              fullName: undefined,
              role: 'user',
              isBlocked: false,
              joinedDate: mockUsers[0].joinedDate.toISOString(),
              isPremium: false,
            },
          ],
          total: 1,
          totalPages: 1,
          currentPage: 1,
        },
      });
    });

    it('should handle errors', async () => {
      const req = mockRequest();
      const res = mockResponse();

      const error = new Error('Database error');
      (mockAdminService.getAllUsers as jest.Mock).mockRejectedValue(error);

      await adminController.getAllUsers(req, res);

      expect(handleError).toHaveBeenCalledWith(res, error);
    });

    it('should call the service with raw pagination parameters', async () => {
      const req = mockRequest({ page: '-1', limit: '0' });
      const res = mockResponse();

      const mockUsers: any[] = [];
      const mockTotal = 0;
      (mockAdminService.getAllUsers as jest.Mock).mockResolvedValue({ users: mockUsers, total: mockTotal });

      await adminController.getAllUsers(req, res);

      expect(mockAdminService.getAllUsers).toHaveBeenCalledWith(-1, 10, '');
      expect(sendResponse).toHaveBeenCalledWith(res, {
        success: true,
        status: StatusCode.SUCCESS,
        message: SuccessMessages.USERS_FETCHED,
        data: {
          users: [],
          total: 0,
          totalPages: 0,
          currentPage: -1,
        },
      });
    });

    it('should handle service errors with invalid pagination parameters', async () => {
      const req = mockRequest({ page: '-1', limit: '10' });
      const res = mockResponse();

      const error = new BadRequestError(ErrorMessages.INVALID_PAGINATION_PARAMS);
      (mockAdminService.getAllUsers as jest.Mock).mockRejectedValue(error);

      await adminController.getAllUsers(req, res);

      expect(mockAdminService.getAllUsers).toHaveBeenCalledWith(-1, 10, '');
      expect(handleError).toHaveBeenCalledWith(res, expect.any(BadRequestError));
      expect(handleError).toHaveBeenCalledWith(res, expect.objectContaining({
        message: ErrorMessages.INVALID_PAGINATION_PARAMS,
      }));
    });
  });

  describe('getUserById', () => {
    it('should fetch user by ID successfully', async () => {
      const req = mockRequest({}, { id: '1' });
      const res = mockResponse();

      const mockUser: any = {
        _id: '1',
        userName: 'testuser',
        email: 'test@example.com',
        fullName: undefined,
        role: 'user',
        profileImage: '',
        joinedDate: new Date(),
        problemsSolved: 0,
        solvedProblems: [],
        rank: 1,
        isBlocked: false,
        isPremium: false,
        isGoogleAuth: false,
      };
      (mockAdminService.getUserById as jest.Mock).mockResolvedValue(mockUser);

      await adminController.getUserById(req, res);

      expect(mockAdminService.getUserById).toHaveBeenCalledWith('1');
      expect(sendResponse).toHaveBeenCalledWith(res, {
        success: true,
        status: StatusCode.SUCCESS,
        message: SuccessMessages.USER_FETCHED,
        data: {
          user: {
            id: '1',
            email: 'test@example.com',
            userName: 'testuser',
            fullName: undefined,
            role: 'user',
            isBlocked: false,
            joinedDate: mockUser.joinedDate.toISOString(),
          },
        },
      });
    });

    it('should handle BadRequestError for missing ID', async () => {
      const req = mockRequest({}, {});
      const res = mockResponse();

      await adminController.getUserById(req, res);

      expect(handleError).toHaveBeenCalledWith(res, expect.any(BadRequestError));
    });

    it('should handle NotFoundError for non-existent user', async () => {
      const req = mockRequest({}, { id: '1' });
      const res = mockResponse();

      (mockAdminService.getUserById as jest.Mock).mockResolvedValue(null);

      await adminController.getUserById(req, res);

      expect(handleError).toHaveBeenCalledWith(res, expect.any(NotFoundError));
    });

    it('should handle invalid ID format', async () => {
      const req = mockRequest({}, { id: 'invalid-id' });
      const res = mockResponse();

      const error = new Error('Invalid ID');
      (mockAdminService.getUserById as jest.Mock).mockRejectedValue(error);

      await adminController.getUserById(req, res);

      expect(mockAdminService.getUserById).toHaveBeenCalledWith('invalid-id');
      expect(handleError).toHaveBeenCalledWith(res, error);
    });
  });

  describe('blockUser', () => {
    it('should block user successfully', async () => {
      const req = mockRequest({}, { id: '1' });
      const res = mockResponse();

      const mockUser: any = {
        _id: '1',
        userName: 'testuser',
        email: 'test@example.com',
        fullName: undefined,
        role: 'user',
        profileImage: '',
        joinedDate: new Date(),
        problemsSolved: 0,
        solvedProblems: [],
        rank: 1,
        isBlocked: true,
        isPremium: false,
        isGoogleAuth: false,
      };
      (mockAdminService.blockUser as jest.Mock).mockResolvedValue(mockUser);

      await adminController.blockUser(req, res);

      expect(mockAdminService.blockUser).toHaveBeenCalledWith('1');
      expect(sendResponse).toHaveBeenCalledWith(res, {
        success: true,
        status: StatusCode.SUCCESS,
        message: SuccessMessages.USER_BLOCKED,
        data: {
          user: {
            id: '1',
            email: 'test@example.com',
            userName: 'testuser',
            fullName: undefined,
            role: 'user',
            isBlocked: true,
            joinedDate: mockUser.joinedDate.toISOString(),
          },
        },
      });
    });

    it('should handle BadRequestError for missing ID', async () => {
      const req = mockRequest({}, {});
      const res = mockResponse();

      await adminController.blockUser(req, res);

      expect(handleError).toHaveBeenCalledWith(res, expect.any(BadRequestError));
    });

    it('should handle invalid ID format', async () => {
      const req = mockRequest({}, { id: 'invalid-id' });
      const res = mockResponse();

      const error = new Error('Invalid ID');
      (mockAdminService.blockUser as jest.Mock).mockRejectedValue(error);

      await adminController.blockUser(req, res);

      expect(mockAdminService.blockUser).toHaveBeenCalledWith('invalid-id');
      expect(handleError).toHaveBeenCalledWith(res, error);
    });
  });

  describe('unblockUser', () => {
    it('should unblock user successfully', async () => {
      const req = mockRequest({}, { id: '1' });
      const res = mockResponse();

      const mockUser: any = {
        _id: '1',
        userName: 'testuser',
        email: 'test@example.com',
        fullName: undefined,
        role: 'user',
        profileImage: '',
        joinedDate: new Date(),
        problemsSolved: 0,
        solvedProblems: [],
        rank: 1,
        isBlocked: false,
        isPremium: false,
        isGoogleAuth: false,
      };
      (mockAdminService.unblockUser as jest.Mock).mockResolvedValue(mockUser);

      await adminController.unblockUser(req, res);

      expect(mockAdminService.unblockUser).toHaveBeenCalledWith('1');
      expect(sendResponse).toHaveBeenCalledWith(res, {
        success: true,
        status: StatusCode.SUCCESS,
        message: SuccessMessages.USER_UNBLOCKED,
        data: {
          user: {
            id: '1',
            email: 'test@example.com',
            userName: 'testuser',
            fullName: undefined,
            role: 'user',
            isBlocked: false,
            joinedDate: mockUser.joinedDate.toISOString(),
          },
        },
      });
    });

    it('should handle BadRequestError for missing ID', async () => {
      const req = mockRequest({}, {});
      const res = mockResponse();

      await adminController.unblockUser(req, res);

      expect(handleError).toHaveBeenCalledWith(res, expect.any(BadRequestError));
    });

    it('should handle invalid ID format', async () => {
      const req = mockRequest({}, { id: 'invalid-id' });
      const res = mockResponse();

      const error = new Error('Invalid ID');
      (mockAdminService.unblockUser as jest.Mock).mockRejectedValue(error);

      await adminController.unblockUser(req, res);

      expect(mockAdminService.unblockUser).toHaveBeenCalledWith('invalid-id');
      expect(handleError).toHaveBeenCalledWith(res, error);
    });
  });

  describe('toggleBlockUser', () => {
    it('should block user when isBlocked is true', async () => {
      const req = mockRequest({}, {}, { userId: '1', isBlocked: true });
      const res = mockResponse();

      const mockUser: any = {
        _id: '1',
        userName: 'testuser',
        email: 'test@example.com',
        fullName: undefined,
        role: 'user',
        profileImage: '',
        joinedDate: new Date(),
        problemsSolved: 0,
        solvedProblems: [],
        rank: 1,
        isBlocked: true,
        isPremium: false,
        isGoogleAuth: false,
      };
      (mockAdminService.blockUser as jest.Mock).mockResolvedValue(mockUser);

      await adminController.toggleBlockUser(req, res);

      expect(mockAdminService.blockUser).toHaveBeenCalledWith('1');
      expect(sendResponse).toHaveBeenCalledWith(res, {
        success: true,
        status: StatusCode.SUCCESS,
        message: SuccessMessages.USER_BLOCKED,
        data: {
          user: {
            id: '1',
            email: 'test@example.com',
            userName: 'testuser',
            fullName: undefined,
            role: 'user',
            isBlocked: true,
            joinedDate: mockUser.joinedDate.toISOString(),
          },
        },
      });
    });

    it('should unblock user when isBlocked is false', async () => {
      const req = mockRequest({}, {}, { userId: '1', isBlocked: false });
      const res = mockResponse();

      const mockUser: any = {
        _id: '1',
        userName: 'testuser',
        email: 'test@example.com',
        fullName: undefined,
        role: 'user',
        profileImage: '',
        joinedDate: new Date(),
        problemsSolved: 0,
        solvedProblems: [],
        rank: 1,
        isBlocked: false,
        isPremium: false,
        isGoogleAuth: false,
      };
      (mockAdminService.unblockUser as jest.Mock).mockResolvedValue(mockUser);

      await adminController.toggleBlockUser(req, res);

      expect(mockAdminService.unblockUser).toHaveBeenCalledWith('1');
      expect(sendResponse).toHaveBeenCalledWith(res, {
        success: true,
        status: StatusCode.SUCCESS,
        message: SuccessMessages.USER_UNBLOCKED,
        data: {
          user: {
            id: '1',
            email: 'test@example.com',
            userName: 'testuser',
            fullName: undefined,
            role: 'user',
            isBlocked: false,
            joinedDate: mockUser.joinedDate.toISOString(),
          },
        },
      });
    });

    it('should handle BadRequestError for invalid payload', async () => {
      const req = mockRequest({}, {}, { userId: undefined, isBlocked: undefined });
      const res = mockResponse();

      await adminController.toggleBlockUser(req, res);

      expect(handleError).toHaveBeenCalledWith(res, expect.any(BadRequestError));
    });

    it('should handle invalid userId format when blocking', async () => {
      const req = mockRequest({}, {}, { userId: 'invalid-id', isBlocked: true });
      const res = mockResponse();

      const error = new Error('Invalid ID');
      (mockAdminService.blockUser as jest.Mock).mockRejectedValue(error);

      await adminController.toggleBlockUser(req, res);

      expect(mockAdminService.blockUser).toHaveBeenCalledWith('invalid-id');
      expect(handleError).toHaveBeenCalledWith(res, error);
    });

    it('should handle invalid userId format when unblocking', async () => {
      const req = mockRequest({}, {}, { userId: 'invalid-id', isBlocked: false });
      const res = mockResponse();

      const error = new Error('Invalid ID');
      (mockAdminService.unblockUser as jest.Mock).mockRejectedValue(error);

      await adminController.toggleBlockUser(req, res);

      expect(mockAdminService.unblockUser).toHaveBeenCalledWith('invalid-id');
      expect(handleError).toHaveBeenCalledWith(res, error);
    });
  });
});