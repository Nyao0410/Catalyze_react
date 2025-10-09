/**
 * ドメイン層 - リポジトリインターフェース
 * 
 * 学習セッションリポジトリ
 */

import { StudySessionEntity } from '../entities/study-session-entity';

/**
 * 学習セッションリポジトリインターフェース
 */
export interface StudySessionRepository {
  /**
   * 学習セッションを作成
   */
  create(session: StudySessionEntity): Promise<StudySessionEntity>;

  /**
   * 学習セッションを更新
   */
  update(session: StudySessionEntity): Promise<void>;

  /**
   * IDで学習セッションを検索
   */
  findById(sessionId: string): Promise<StudySessionEntity | null>;

  /**
   * 計画IDで学習セッションを検索
   */
  findByPlanId(planId: string): Promise<StudySessionEntity[]>;

  /**
   * 計画IDで昨日までの学習セッションを検索
   */
  findByPlanIdUntilYesterday(planId: string): Promise<StudySessionEntity[]>;

  /**
   * ユーザーIDと日付範囲で学習セッションを検索
   */
  findByUserIdAndDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<StudySessionEntity[]>;

  /**
   * 学習セッションを削除
   */
  delete(sessionId: string): Promise<void>;
}
