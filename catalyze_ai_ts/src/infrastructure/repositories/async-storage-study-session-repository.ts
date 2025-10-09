/**
 * AsyncStorage-backed StudySessionRepository
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { StudySessionRepository } from '../../domain/repositories/study-session-repository';
import { StudySessionEntity } from '../../domain/entities/study-session-entity';
import { startOfDay, endOfDay } from 'date-fns';

const STORAGE_KEY = '@catalyze:studySessions';

export class AsyncStorageStudySessionRepository implements StudySessionRepository {
  private async _loadAll(): Promise<StudySessionEntity[]> {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data) as any[];
    return parsed.map((s) => ({ ...s, date: new Date(s.date) })) as StudySessionEntity[];
  }

  private async _saveAll(sessions: StudySessionEntity[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }

  async create(session: StudySessionEntity): Promise<StudySessionEntity> {
    const sessions = await this._loadAll();
    sessions.push(session);
    await this._saveAll(sessions);
    return session;
  }

  async update(session: StudySessionEntity): Promise<void> {
    const sessions = await this._loadAll();
    const idx = sessions.findIndex((s) => s.id === session.id);
    if (idx === -1) throw new Error(`Session with id ${session.id} not found`);
    sessions[idx] = session;
    await this._saveAll(sessions);
  }

  async findById(sessionId: string): Promise<StudySessionEntity | null> {
    const sessions = await this._loadAll();
    return sessions.find((s) => s.id === sessionId) ?? null;
  }

  async findByPlanId(planId: string): Promise<StudySessionEntity[]> {
    const sessions = await this._loadAll();
    return sessions.filter((s) => s.planId === planId).sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async findByPlanIdUntilYesterday(planId: string): Promise<StudySessionEntity[]> {
    const sessions = await this._loadAll();
    const yesterday = endOfDay(new Date(Date.now() - 24 * 60 * 60 * 1000));
    return sessions.filter((s) => s.planId === planId && s.date <= yesterday).sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async findByUserIdAndDateRange(userId: string, startDate: Date, endDate: Date): Promise<StudySessionEntity[]> {
    const sessions = await this._loadAll();
    const start = startOfDay(startDate);
    const end = endOfDay(endDate);
    return sessions.filter((s) => s.userId === userId && s.date >= start && s.date <= end).sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async delete(sessionId: string): Promise<void> {
    const sessions = await this._loadAll();
    const updated = sessions.filter((s) => s.id !== sessionId);
    await this._saveAll(updated);
  }

  // test helper
  async clear(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEY);
  }
}
