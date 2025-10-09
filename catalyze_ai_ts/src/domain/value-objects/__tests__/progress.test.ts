/**
 * Progress 値オブジェクトのテスト
 */

import { Progress } from '../progress';

describe('Progress', () => {
  describe('constructor', () => {
    it('正常な値で作成できる', () => {
      const progress = new Progress(50, 100);
      expect(progress.completed).toBe(50);
      expect(progress.total).toBe(100);
    });

    it('completedが負の場合はエラー', () => {
      expect(() => new Progress(-1, 100)).toThrow('Completed must be non-negative');
    });

    it('totalが0以下の場合はエラー', () => {
      expect(() => new Progress(0, 0)).toThrow('Total must be positive');
    });

    it('completedがtotalを超える場合はエラー', () => {
      expect(() => new Progress(101, 100)).toThrow('Completed cannot exceed total');
    });
  });

  describe('percentage', () => {
    it('進捗率を正しく計算する', () => {
      const progress = new Progress(50, 100);
      expect(progress.percentage).toBe(0.5);
    });

    it('完了時は1.0を返す', () => {
      const progress = new Progress(100, 100);
      expect(progress.percentage).toBe(1.0);
    });

    it('未着手時は0.0を返す', () => {
      const progress = new Progress(0, 100);
      expect(progress.percentage).toBe(0.0);
    });
  });

  describe('isComplete', () => {
    it('完了している場合はtrue', () => {
      const progress = new Progress(100, 100);
      expect(progress.isComplete).toBe(true);
    });

    it('未完了の場合はfalse', () => {
      const progress = new Progress(50, 100);
      expect(progress.isComplete).toBe(false);
    });
  });

  describe('advance', () => {
    it('進捗を進めることができる', () => {
      const progress = new Progress(50, 100);
      const newProgress = progress.advance(10);
      expect(newProgress.completed).toBe(60);
      expect(newProgress.total).toBe(100);
    });

    it('totalを超える場合はclampされる', () => {
      const progress = new Progress(90, 100);
      const newProgress = progress.advance(20);
      expect(newProgress.completed).toBe(100);
    });

    it('負の値の場合は減少する', () => {
      const progress = new Progress(50, 100);
      const newProgress = progress.advance(-10);
      expect(newProgress.completed).toBe(40);
    });
  });

  describe('reset', () => {
    it('進捗をリセットできる', () => {
      const progress = new Progress(50, 100);
      const resetProgress = progress.reset();
      expect(resetProgress.completed).toBe(0);
      expect(resetProgress.total).toBe(100);
    });
  });

  describe('withTotal', () => {
    it('総数を変更できる', () => {
      const progress = new Progress(50, 100);
      const newProgress = progress.withTotal(200);
      expect(newProgress.completed).toBe(50);
      expect(newProgress.total).toBe(200);
    });

    it('completedが新しいtotalを超える場合はclampされる', () => {
      const progress = new Progress(50, 100);
      const newProgress = progress.withTotal(30);
      expect(newProgress.completed).toBe(30);
      expect(newProgress.total).toBe(30);
    });
  });
});
