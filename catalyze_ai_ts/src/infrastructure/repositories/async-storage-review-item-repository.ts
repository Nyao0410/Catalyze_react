/**
 * AsyncStorage-backed ReviewItemRepository
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReviewItemRepository } from '../../domain/repositories/review-item-repository';
import { ReviewItemEntity } from '../../domain/entities/review-item-entity';
import { startOfDay, endOfDay } from 'date-fns';

const STORAGE_KEY = '@catalyze:reviewItems';

export class AsyncStorageReviewItemRepository implements ReviewItemRepository {
  private async _loadAll(): Promise<ReviewItemEntity[]> {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data) as any[];
    return parsed.map((r) => ({ ...r, lastReviewDate: r.lastReviewDate ? new Date(r.lastReviewDate) : undefined, nextReviewDate: r.nextReviewDate ? new Date(r.nextReviewDate) : new Date(r.nextReviewDate) })) as ReviewItemEntity[];
  }

  private async _saveAll(items: ReviewItemEntity[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  async create(item: ReviewItemEntity): Promise<ReviewItemEntity> {
    const items = await this._loadAll();
    const idx = items.findIndex((i) => i.id === item.id);
    if (idx === -1) {
      items.push(item);
    } else {
      items[idx] = item; // upsert
    }
    await this._saveAll(items);
    return item;
  }

  async update(item: ReviewItemEntity): Promise<void> {
    const items = await this._loadAll();
    const idx = items.findIndex((i) => i.id === item.id);
    if (idx === -1) throw new Error(`ReviewItem with id ${item.id} not found`);
    items[idx] = item;
    await this._saveAll(items);
  }

  async findById(itemId: string): Promise<ReviewItemEntity | null> {
    const items = await this._loadAll();
    return items.find((i) => i.id === itemId) ?? null;
  }

  async findByPlanId(planId: string): Promise<ReviewItemEntity[]> {
    const items = await this._loadAll();
    return items.filter((i) => i.planId === planId).sort((a, b) => a.nextReviewDate.getTime() - b.nextReviewDate.getTime());
  }

  async findDueToday(userId: string): Promise<ReviewItemEntity[]> {
    const items = await this._loadAll();
    const today = endOfDay(new Date());
    return items.filter((i) => i.userId === userId && i.nextReviewDate <= today).sort((a, b) => a.nextReviewDate.getTime() - b.nextReviewDate.getTime());
  }

  async findByUserIdAndDateRange(userId: string, startDate: Date, endDate: Date): Promise<ReviewItemEntity[]> {
    const items = await this._loadAll();
    const start = startOfDay(startDate);
    const end = endOfDay(endDate);
    return items.filter((i) => i.userId === userId && i.nextReviewDate >= start && i.nextReviewDate <= end).sort((a, b) => a.nextReviewDate.getTime() - b.nextReviewDate.getTime());
  }

  async delete(itemId: string): Promise<void> {
    const items = await this._loadAll();
    const updated = items.filter((i) => i.id !== itemId);
    await this._saveAll(updated);
  }

  async deleteByPlanId(planId: string): Promise<void> {
    const items = await this._loadAll();
    const updated = items.filter((i) => i.planId !== planId);
    await this._saveAll(updated);
  }

  // test helper
  async clear(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEY);
  }
}
