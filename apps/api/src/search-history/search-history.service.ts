import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserSearchHistory } from './entities/user-search-history.entity';
import { normalizeSearchQuery } from '../common/persian-search.util';
import {
  PublicSearchHistoryItem,
  toPublicSearchHistoryItem,
} from './search-history.public';

const MAX_STORED_PER_USER = 20;

@Injectable()
export class SearchHistoryService {
  constructor(
    @InjectRepository(UserSearchHistory)
    private readonly historyRepo: Repository<UserSearchHistory>,
  ) {}

  async recordSearch(
    userId: string,
    rawQuery: string,
  ): Promise<PublicSearchHistoryItem> {
    const query = rawQuery.trim();
    if (!query) {
      throw new BadRequestException('عبارت جستجو نمی‌تواند خالی باشد');
    }
    const normalizedQuery = normalizeSearchQuery(query);

    const existing = await this.historyRepo.findOne({
      where: { userId, normalizedQuery },
    });
    let saved: UserSearchHistory;
    if (existing) {
      existing.query = query;
      existing.searchedAt = new Date();
      saved = await this.historyRepo.save(existing);
    } else {
      saved = await this.historyRepo.save(
        this.historyRepo.create({
          userId,
          query,
          normalizedQuery,
          searchedAt: new Date(),
        }),
      );
    }

    await this.trimToMax(userId);
    return toPublicSearchHistoryItem(saved);
  }

  async findRecentForUser(
    userId: string,
    limit: number,
  ): Promise<PublicSearchHistoryItem[]> {
    const entries = await this.historyRepo.find({
      where: { userId },
      order: { searchedAt: 'DESC' },
      take: limit,
    });
    return entries.map(toPublicSearchHistoryItem);
  }

  async removeOne(userId: string, id: string): Promise<void> {
    const result = await this.historyRepo.delete({ id, userId });
    if (result.affected === 0) {
      throw new NotFoundException('این مورد در تاریخچه جستجوی شما یافت نشد');
    }
  }

  async clearForUser(userId: string): Promise<void> {
    await this.historyRepo.delete({ userId });
  }

  private async trimToMax(userId: string): Promise<void> {
    const excess = await this.historyRepo
      .createQueryBuilder('h')
      .select('h.id', 'id')
      .where('h.userId = :userId', { userId })
      .orderBy('h.searchedAt', 'DESC')
      .skip(MAX_STORED_PER_USER)
      .getRawMany<{ id: string }>();

    if (excess.length > 0) {
      await this.historyRepo.delete(excess.map((row) => row.id));
    }
  }
}
