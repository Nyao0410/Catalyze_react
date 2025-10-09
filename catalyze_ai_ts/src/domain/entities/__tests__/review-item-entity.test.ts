/**
 * ReviewItemEntity のテスト（SM-2アルゴリズム）
 */

import { ReviewItemEntity } from '../review-item-entity';

describe('ReviewItemEntity', () => {
  const baseProps = {
    id: 'review-001',
    userId: 'user-001',
    planId: 'plan-001',
    unitNumber: 10,
    lastReviewDate: new Date('2025-01-01'),
    nextReviewDate: new Date('2025-01-02'),
  };

  describe('constructor', () => {
    it('正常に作成できる', () => {
      const item = new ReviewItemEntity(baseProps);
      expect(item.id).toBe('review-001');
      expect(item.easeFactor).toBe(2.5); // デフォルト値
      expect(item.repetitions).toBe(0); // デフォルト値
      expect(item.intervalDays).toBe(1); // デフォルト値
    });

    it('無効な値ではエラー', () => {
      expect(() => new ReviewItemEntity({ ...baseProps, unitNumber: 0 })).toThrow();
    });
  });

  describe('recordReview - SM-2 アルゴリズム', () => {
    it('品質3以上の場合は成功として扱う', () => {
      const item = new ReviewItemEntity(baseProps);
      const updated = item.recordReview(4);

      expect(updated.repetitions).toBe(1);
      expect(updated.intervalDays).toBe(1); // 1回目は1日
      expect(updated.easeFactor).toBeGreaterThan(2.5); // 品質4なので容易度上昇
    });

    it('品質3未満の場合は失敗として扱う', () => {
      const item = new ReviewItemEntity(baseProps);
      const updated = item.recordReview(2);

      expect(updated.repetitions).toBe(0); // リセット
      expect(updated.intervalDays).toBe(1); // 1日後に再復習
    });

    it('2回目の成功は6日後', () => {
      let item = new ReviewItemEntity(baseProps);
      item = item.recordReview(4); // 1回目
      item = item.recordReview(4); // 2回目

      expect(item.repetitions).toBe(2);
      expect(item.intervalDays).toBe(6);
    });

    it('3回目以降は容易度係数に基づく', () => {
      let item = new ReviewItemEntity(baseProps);
      item = item.recordReview(4); // 1回目: 1日
      item = item.recordReview(4); // 2回目: 6日
      const thirdReview = item.recordReview(4); // 3回目

      expect(thirdReview.repetitions).toBe(3);
      expect(thirdReview.intervalDays).toBeGreaterThan(6); // 6 * easeFactor
    });

    it('容易度係数は最小1.3を維持', () => {
      let item = new ReviewItemEntity(baseProps);
      // 品質0で何度も失敗させる
      for (let i = 0; i < 10; i++) {
        item = item.recordReview(0);
        item = new ReviewItemEntity({
          ...item,
          lastReviewDate: new Date(),
          nextReviewDate: new Date(),
          repetitions: 0,
          intervalDays: 1,
        });
      }
      const finalReview = item.recordReview(3);
      expect(finalReview.easeFactor).toBeGreaterThanOrEqual(1.3);
    });
  });

  describe('isDueToday', () => {
    it('今日が復習日の場合はtrue', () => {
      const today = new Date();
      const item = new ReviewItemEntity({
        ...baseProps,
        nextReviewDate: today,
      });
      expect(item.isDueToday).toBe(true);
    });

    it('過去の復習日の場合もtrue', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const item = new ReviewItemEntity({
        ...baseProps,
        nextReviewDate: yesterday,
      });
      expect(item.isDueToday).toBe(true);
    });

    it('未来の復習日の場合はfalse', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const item = new ReviewItemEntity({
        ...baseProps,
        nextReviewDate: tomorrow,
      });
      expect(item.isDueToday).toBe(false);
    });
  });

  describe('reset', () => {
    it('復習をリセットできる', () => {
      let item = new ReviewItemEntity(baseProps);
      item = item.recordReview(4);
      item = item.recordReview(4);

      const reset = item.reset();
      expect(reset.repetitions).toBe(0);
      expect(reset.intervalDays).toBe(1);
      expect(reset.easeFactor).toBe(2.5);
    });
  });
});
