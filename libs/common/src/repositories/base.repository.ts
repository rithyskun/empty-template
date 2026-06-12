import {
  Repository,
  FindOptionsWhere,
  FindOptionsOrder,
  EntityManager,
  DeepPartial,
} from 'typeorm';
import type { PaginatedResult } from '../dto/pagination.dto';

export abstract class BaseRepository<T extends object> {
  protected constructor(protected readonly repo: Repository<T>) {}

  async create(dto: DeepPartial<T>): Promise<T> {
    const entity = this.repo.create(dto);
    return this.repo.save(entity);
  }

  async createWithTransaction(
    dto: DeepPartial<T>,
    manager: EntityManager,
  ): Promise<T> {
    const repo = manager.getRepository(this.repo.target);
    const entity = repo.create(dto);
    return repo.save(entity);
  }

  async saveManyWithTransaction(
    dtos: DeepPartial<T>[],
    manager: EntityManager,
    batchSize = 500,
  ): Promise<T[]> {
    const repo = manager.getRepository(this.repo.target);
    const entities = dtos.map((dto) => repo.create(dto));
    return repo.save(entities, { chunk: batchSize });
  }

  async bulkInsert(dtos: DeepPartial<T>[], batchSize = 1000): Promise<void> {
    const entities = dtos.map((dto) => this.repo.create(dto));
    for (let i = 0; i < entities.length; i += batchSize) {
      const chunk = entities.slice(i, i + batchSize);
      await this.repo
        .createQueryBuilder()
        .insert()
        .values(chunk as object[])
        .execute();
    }
  }

  async bulkInsertWithTransaction(
    dtos: DeepPartial<T>[],
    manager: EntityManager,
    batchSize = 1000,
  ): Promise<void> {
    const repo = manager.getRepository(this.repo.target);
    const entities = dtos.map((dto) => repo.create(dto));
    for (let i = 0; i < entities.length; i += batchSize) {
      const chunk = entities.slice(i, i + batchSize);
      await repo
        .createQueryBuilder()
        .insert()
        .values(chunk as object[])
        .execute();
    }
  }

  async updateWithTransaction(
    id: string,
    dto: DeepPartial<T>,
    manager: EntityManager,
  ): Promise<T> {
    const repo = manager.getRepository(this.repo.target);
    const entity = await repo.findOne({
      where: { id } as unknown as FindOptionsWhere<T>,
    });
    if (!entity) throw new Error(`Entity not found: ${id}`);
    Object.assign(entity, dto);
    return repo.save(entity);
  }

  async deleteWithTransaction(
    id: string,
    manager: EntityManager,
  ): Promise<void> {
    const repo = manager.getRepository(this.repo.target);
    await repo.delete(id);
  }

  async runInTransaction<R>(
    callback: (manager: EntityManager) => Promise<R>,
  ): Promise<R> {
    return this.repo.manager.transaction(callback);
  }

  async findById(id: string): Promise<T | null> {
    return this.repo.findOne({
      where: { id } as unknown as FindOptionsWhere<T>,
    });
  }

  async findMany(
    where: FindOptionsWhere<T>,
    order?: FindOptionsOrder<T>,
  ): Promise<T[]> {
    return this.repo.find({ where, order });
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }

  async count(where: FindOptionsWhere<T>): Promise<number> {
    return this.repo.count({ where });
  }

  async paginate(
    where: FindOptionsWhere<T>,
    page: number,
    limit: number,
    order?: FindOptionsOrder<T>,
  ): Promise<PaginatedResult<T>> {
    const skip = (page - 1) * limit;
    const [data, total] = await this.repo.findAndCount({
      where,
      skip,
      take: limit,
      order,
    });
    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
