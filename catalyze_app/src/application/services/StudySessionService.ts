/**
 * StudyNext - Application Service for Study Sessions
 * 学習セッションのアプリケーションサービス
 */

import {
  StudySessionEntity,
  InMemoryStudySessionRepository,
  type StudySessionRepository,
} from 'catalyze-ai';
import { reviewItemService } from './ReviewItemService';
import { SocialService } from './SocialService';

export class StudySessionService {
  private repository: StudySessionRepository;

  constructor(repository?: StudySessionRepository) {
    this.repository = repository || new InMemoryStudySessionRepository();
  }

  async getSessionsByPlanId(planId: string): Promise<StudySessionEntity[]> {
    return await this.repository.findByPlanId(planId);
  }

  async getSessionsByUserId(userId: string, startDate?: Date, endDate?: Date): Promise<StudySessionEntity[]> {
    const start = startDate || new Date(0);
    const end = endDate || new Date();
    return await this.repository.findByUserIdAndDateRange(userId, start, end);
  }

  async getSessionById(sessionId: string): Promise<StudySessionEntity | null> {
    return await this.repository.findById(sessionId);
  }

  async createSession(session: StudySessionEntity): Promise<StudySessionEntity> {
    return await this.repository.create(session);
  }

  /**
   * セッションを保存し、関連する復習アイテムの生成とポイント付与を一括で行う
   * startUnit/endUnit が渡されればその範囲をもとに復習アイテムを作成する
   */
  async recordSessionWithReviewItems(
    session: StudySessionEntity,
    planId: string,
    startUnit?: number,
    endUnit?: number
  ): Promise<StudySessionEntity> {
    // 永続化（リポジトリに委譲）
    const created = await this.repository.create(session);

    // 復習アイテムの自動生成
    try {
      if (reviewItemService && startUnit !== undefined && endUnit !== undefined) {
        const existing = await reviewItemService.getReviewItemsByPlanId(planId);
        const existingUnits = new Set(existing.map((e: any) => e.unitNumber));
        const now = new Date();
        const nextDay = new Date(now);
        nextDay.setDate(now.getDate() + 1);
        const groupTs = Date.now();
        for (let u = startUnit; u <= endUnit; u++) {
          if (!existingUnits.has(u)) {
            const { ReviewItemEntity } = await import('catalyze-ai');
            const newItem = new ReviewItemEntity({
              id: `review-${planId}-${groupTs}-${u}`,
              userId: session.userId,
              planId,
              unitNumber: u,
              lastReviewDate: now,
              nextReviewDate: nextDay,
            } as any);
            await reviewItemService.createReviewItem(newItem);
          }
        }
      }
    } catch (e) {
      console.error('Failed to create review items in service:', e);
      // 復習アイテム生成失敗でもセッションは保存済み。必要ならロールバックや例外を投げる。
    }

    // ポイント付与
    try {
      const performanceFactor = session.performanceFactor ?? 1;
      const basePoints = Math.floor((session.durationMinutes || 0) * performanceFactor * 10);
      const points = Math.max(1, basePoints);
      await SocialService.addPoints(session.userId, points);
    } catch (e) {
      console.error('Failed to add points in service:', e);
    }

    return created;
  }

  async updateSession(session: StudySessionEntity): Promise<void> {
    await this.repository.update(session);
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.repository.delete(sessionId);
  }

  async getRecentSessions(userId: string, days: number): Promise<StudySessionEntity[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const endDate = new Date();
    
    return await this.repository.findByUserIdAndDateRange(userId, startDate, endDate);
  }
}

// シングルトンインスタンス
export const studySessionService = new StudySessionService();
