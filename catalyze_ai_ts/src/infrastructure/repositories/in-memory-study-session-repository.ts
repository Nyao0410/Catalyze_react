/**
 * インフラストラクチャ層 - メモリ実装
 * 
 * StudySessionRepositoryのインメモリ実装（テスト・開発用）
 */

import { startOfDay, endOfDay, subDays } from 'date-fns';
import { StudySessionRepository } from '../../domain/repositories/study-session-repository';
import { StudySessionEntity } from '../../domain/entities/study-session-entity';

/**
 * メモリ内StudySessionRepository実装
 */
export class InMemoryStudySessionRepository implements StudySessionRepository {
  private sessions: Map<string, StudySessionEntity> = new Map();

  async create(session: StudySessionEntity): Promise<StudySessionEntity> {
    this.sessions.set(session.id, session);
    return session;
  }

  async update(session: StudySessionEntity): Promise<void> {
    if (!this.sessions.has(session.id)) {
      throw new Error(`Session with id ${session.id} not found`);
    }
    this.sessions.set(session.id, session);
  }

  async findById(sessionId: string): Promise<StudySessionEntity | null> {
    return this.sessions.get(sessionId) ?? null;
  }

  async findByPlanId(planId: string): Promise<StudySessionEntity[]> {
    return Array.from(this.sessions.values())
      .filter((session) => session.planId === planId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async findByPlanIdUntilYesterday(planId: string): Promise<StudySessionEntity[]> {
    const yesterday = endOfDay(subDays(new Date(), 1));
    return Array.from(this.sessions.values())
      .filter((session) => session.planId === planId && session.date <= yesterday)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async findByUserIdAndDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<StudySessionEntity[]> {
    const start = startOfDay(startDate);
    const end = endOfDay(endDate);

    return Array.from(this.sessions.values())
      .filter(
        (session) =>
          session.userId === userId && session.date >= start && session.date <= end
      )
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async delete(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }

  /**
   * テスト用: 全データクリア
   */
  clear(): void {
    this.sessions.clear();
  }

  /**
   * テスト用: 全データ取得
   */
  getAll(): StudySessionEntity[] {
    return Array.from(this.sessions.values());
  }
}
