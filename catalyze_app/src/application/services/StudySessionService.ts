/**
 * StudyNext - Application Service for Study Sessions
 * 学習セッションのアプリケーションサービス
 */

import {
  StudySessionEntity,
  InMemoryStudySessionRepository,
  type StudySessionRepository,
} from 'catalyze-ai';

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
