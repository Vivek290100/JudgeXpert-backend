// src/__tests__/UserRepository.test.ts
import UserRepository from '../../src/repositories/UserRepository';

// Mock the User model to prevent Mongoose from creating a real model
jest.mock('../../src/models/UserModel', () => ({
  default: jest.fn().mockImplementation(() => ({
    find: jest.fn(),
    skip: jest.fn(),
    limit: jest.fn(),
    exec: jest.fn(),
    countDocuments: jest.fn(),
  })),
}));

describe('UserRepository', () => {
  it('should find paginated users', async () => {
    const mockModel = {
      find: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([{ _id: '1', userName: 'test' }]),
      countDocuments: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      }),
    };
    const repo = new UserRepository();
    (repo as any).model = mockModel;

    const result = await repo.findPaginated(1, 10);

    expect(mockModel.find).toHaveBeenCalled();
    expect(mockModel.countDocuments).toHaveBeenCalled();
    expect(result).toEqual({ users: [{ _id: '1', userName: 'test' }], total: 1 });
  });

  it('should find user by query', async () => {
    const mockModel = {
      findOne: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({ _id: '1', email: 'test@example.com' }),
    };
    const repo = new UserRepository();
    (repo as any).model = mockModel;

    const query = { email: 'test@example.com' };
    const result = await repo.findByQuery(query);

    expect(mockModel.findOne).toHaveBeenCalledWith(query);
    expect(result).toEqual({ _id: '1', email: 'test@example.com' });
  });

  it('should find leaderboard users', async () => {
    const mockModel = {
      find: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([
        { _id: '1', userName: 'user1', problemsSolved: 10 },
        { _id: '2', userName: 'user2', problemsSolved: 8 },
      ]),
      countDocuments: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(2),
      }),
    };
    const repo = new UserRepository();
    (repo as any).model = mockModel;

    const result = await repo.findLeaderboard(1, 3);

    expect(mockModel.find).toHaveBeenCalledWith({ isBlocked: false, role: { $ne: 'admin' } });
    expect(mockModel.sort).toHaveBeenCalledWith({ problemsSolved: -1 });
    expect(mockModel.skip).toHaveBeenCalledWith(0);
    expect(mockModel.limit).toHaveBeenCalledWith(3);
    expect(mockModel.select).toHaveBeenCalledWith('userName problemsSolved _id');
    expect(result).toEqual({
      users: [
        { rank: 1, username: 'user1', score: 10, _id: '1' },
        { rank: 2, username: 'user2', score: 8, _id: '2' },
      ],
      total: 2,
    });
  });
});