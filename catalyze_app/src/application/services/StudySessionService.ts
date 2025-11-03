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
   * 
   * 戦略:
   * 1. 新規復習アイテム作成時は本日（nextReviewDate = 今日）で生成 → 即座に表示
   * 2. initialQualityが渡されれば、SM-2を適用して復習予定を計算 → 未来の復習予定も表示
   * UIで「今日の復習」と「今後の復習予定」を分けて表示することで、
   * ユーザーが復習スケジュールを把握できる
   */
  async recordSessionWithReviewItems(
    session: StudySessionEntity,
    planId: string,
    startUnit?: number,
    endUnit?: number,
    // Optional initial quality (0..5) to apply to newly created review items for SM-2 scheduling
    initialQuality?: number
  ): Promise<StudySessionEntity> {
    // 永続化（リポジトリに委譲）
    const created = await this.repository.create(session);

    // 復習アイテムの自動生成
    try {
      if (reviewItemService && startUnit !== undefined && endUnit !== undefined) {
        const existing = await reviewItemService.getReviewItemsByPlanId(planId);
        const existingUnits = new Set(existing.map((e: any) => e.unitNumber));
        const now = new Date();
        const groupTs = Date.now();
        const createdItems: any[] = [];
        for (let u = startUnit; u <= endUnit; u++) {
          if (!existingUnits.has(u)) {
            const { ReviewItemEntity } = await import('catalyze-ai');
            // 初期状態: nextReviewDate = 今日
            // これにより、作成直後にfindDueToday()で取得でき、
            // 「今日の復習」セクションに即座に表示される
            const newItem = new ReviewItemEntity({
              id: `review-${planId}-${groupTs}-${u}`,
              userId: session.userId,
              planId,
              unitNumber: u,
              lastReviewDate: now,
              nextReviewDate: now,  // 本日に設定
            } as any);
            await reviewItemService.createReviewItem(newItem);
            createdItems.push(newItem);
          }
        }

        // If an initial quality was provided, apply SM-2 to calculate review schedule
        // This updates nextReviewDate to the computed interval, making the review item
        // appear in "upcoming reviews" sections
        if (typeof initialQuality === 'number' && createdItems.length > 0) {
          try {
            for (const item of createdItems) {
              await reviewItemService.recordReview(item.id, initialQuality);
            }
          } catch (e) {
            console.error('Failed to apply initial SM-2 quality to created review items:', e);
          }
        }
      }
    } catch (e) {
      console.error('Failed to create review items in service:', e);
      // 復習アイテム生成失敗でもセッションは保存済み。必要ならロールバックや例外を投げる。
    }

    // ポイント付与は RecordSessionScreen で処理されるため、ここでは不要

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
