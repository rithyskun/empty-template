import { FileCoreService } from './file-core.service';
import { FileAttachmentRepository } from '../repositories/file-attachment.repository';
import { FileAttachment } from '../entities/file-attachment.entity';

type RepoMock = {
  create: jest.Mock;
  findByEntity: jest.Mock;
  findById: jest.Mock;
  delete: jest.Mock;
};

const makeRepo = (): RepoMock => ({
  create: jest.fn(),
  findByEntity: jest.fn().mockResolvedValue([]),
  findById: jest.fn().mockResolvedValue(null),
  delete: jest.fn().mockResolvedValue(undefined),
});

describe('FileCoreService', () => {
  let repoMock: RepoMock;
  let service: FileCoreService;

  beforeEach(() => {
    repoMock = makeRepo();
    service = new FileCoreService(
      repoMock as unknown as FileAttachmentRepository,
    );
  });

  describe('create', () => {
    it('creates a file attachment and returns response dto', async () => {
      const dto = {
        entityType: 'advance_request',
        entityId: 'req-1',
        fileName: 'file.txt',
        originalName: 'file.txt',
        mimeType: 'text/plain',
        size: 100,
        storagePath: '/uploads/file.txt',
      };
      const saved = {
        id: 'a1',
        ...dto,
        storageProvider: 'TUS',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      } as FileAttachment;
      repoMock.create.mockResolvedValue(saved);

      const result = await service.create(dto);

      expect(repoMock.create).toHaveBeenCalledWith(dto);
      expect(result.id).toBe('a1');
      expect(result.entityType).toBe('advance_request');
      expect(result.fileName).toBe('file.txt');
    });
  });

  describe('findByEntity', () => {
    it('returns mapped response dtos', async () => {
      const items = [
        {
          id: 'a1',
          entityType: 'advance_request',
          entityId: 'req-1',
          fileName: 'f1.txt',
          originalName: 'f1.txt',
          mimeType: 'text/plain',
          size: 10,
          storagePath: '/a',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'a2',
          entityType: 'advance_request',
          entityId: 'req-1',
          fileName: 'f2.txt',
          originalName: 'f2.txt',
          mimeType: 'text/plain',
          size: 20,
          storagePath: '/b',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as FileAttachment[];
      repoMock.findByEntity.mockResolvedValue(items);

      const result = await service.findByEntity('advance_request', 'req-1');

      expect(repoMock.findByEntity).toHaveBeenCalledWith(
        'advance_request',
        'req-1',
      );
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('a1');
      expect(result[1].id).toBe('a2');
    });
  });

  describe('findOne', () => {
    it('returns a response dto when found', async () => {
      const entity = {
        id: 'a1',
        entityType: 'advance_request',
        entityId: 'req-1',
        fileName: 'f1.txt',
        originalName: 'f1.txt',
        mimeType: 'text/plain',
        size: 10,
        storagePath: '/a',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as FileAttachment;
      repoMock.findById.mockResolvedValue(entity);

      const result = await service.findOne('a1');

      expect(repoMock.findById).toHaveBeenCalledWith('a1');
      expect(result).not.toBeNull();
      expect(result && result.id).toBe('a1');
    });

    it('returns null when not found', async () => {
      repoMock.findById.mockResolvedValue(null);

      const result = await service.findOne('missing');

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('delegates to repository delete', async () => {
      await service.delete('a1');
      expect(repoMock.delete).toHaveBeenCalledWith('a1');
    });
  });
});
