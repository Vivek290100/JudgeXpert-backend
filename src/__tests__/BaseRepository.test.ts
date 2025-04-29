// src/__tests__/BaseRepository.test.ts
import BaseRepository from '../../src/repositories/BaseRepository';
import { Document } from 'mongoose';

interface TestDocument extends Document {
  _id: string;
  name: string;
}

describe('BaseRepository', () => {
  const mockModel = {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn().mockReturnValue({
      exec: jest.fn(),
    }),
    findByIdAndDelete: jest.fn(), // Remove the exec chain since BaseRepository doesn't use it
  };

  const repo = new BaseRepository<TestDocument>(mockModel as any);

  it('should create a document', async () => {
    const data = { name: 'test' };
    const createdDoc = { _id: '1', name: 'test' };
    (mockModel.create as jest.Mock).mockResolvedValue(createdDoc);

    const result = await repo.create(data);

    expect(mockModel.create).toHaveBeenCalledWith(data);
    expect(result).toEqual(createdDoc);
  });

  it('should find all documents', async () => {
    const docs = [{ _id: '1', name: 'test' }];
    (mockModel.find as jest.Mock).mockResolvedValue(docs);

    const result = await repo.findAll();

    expect(mockModel.find).toHaveBeenCalled();
    expect(result).toEqual(docs);
  });

  it('should find document by ID', async () => {
    const doc = { _id: '1', name: 'test' };
    (mockModel.findById as jest.Mock).mockResolvedValue(doc);

    const result = await repo.findById('1');

    expect(mockModel.findById).toHaveBeenCalledWith('1');
    expect(result).toEqual(doc);
  });

  it('should update a document', async () => {
    const updatedDoc = { _id: '1', name: 'updated' };
    (mockModel.findByIdAndUpdate().exec as jest.Mock).mockResolvedValue(updatedDoc);

    const result = await repo.update('1', { name: 'updated' });

    expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith('1', { name: 'updated' }, { new: true });
    expect(result).toEqual(updatedDoc);
  });

  it('should delete a document', async () => {
    const deletedDoc = { _id: '1', name: 'test' };
    (mockModel.findByIdAndDelete as jest.Mock).mockResolvedValue(deletedDoc); // Directly resolve to deletedDoc

    const result = await repo.delete('1');

    expect(mockModel.findByIdAndDelete).toHaveBeenCalledWith('1');
    expect(result).toEqual(deletedDoc);
  });
});