/**
 * インフラストラクチャ層 - Firestore実装
 * 
 * StudySessionRepositoryのFirestore実装
 */

import { startOfDay, endOfDay, subDays } from 'date-fns';
import { StudySessionRepository } from '../../domain/repositories/study-session-repository';
import { StudySessionEntity } from '../../domain/entities/study-session-entity';

/**
 * Firestore用のStudySessionRepository実装
 */
export class FirestoreStudySessionRepository implements StudySessionRepository {
  private collectionName = 'study_sessions';

  constructor(private firestore?: any) {
    // firestore: Firebase Firestore instance
  }

  async create(session: StudySessionEntity): Promise<StudySessionEntity> {
    if (!this.firestore) {
      throw new Error('Firestore not initialized');
    }

    const doc = this._toFirestoreDoc(session);
    await this.firestore.collection(this.collectionName).doc(session.id).set(doc);
    return session;
  }

  async update(session: StudySessionEntity): Promise<void> {
    if (!this.firestore) {
      throw new Error('Firestore not initialized');
    }

    const doc = this._toFirestoreDoc(session);
    await this.firestore.collection(this.collectionName).doc(session.id).update(doc);
  }

  async findById(sessionId: string): Promise<StudySessionEntity | null> {
    if (!this.firestore) {
      throw new Error('Firestore not initialized');
    }

    const snapshot = await this.firestore.collection(this.collectionName).doc(sessionId).get();

    if (!snapshot.exists) {
      return null;
    }

    return this._fromFirestoreDoc(snapshot.id, snapshot.data());
  }

  async findByPlanId(planId: string): Promise<StudySessionEntity[]> {
    if (!this.firestore) {
      throw new Error('Firestore not initialized');
    }

    const snapshot = await this.firestore
      .collection(this.collectionName)
      .where('planId', '==', planId)
      .orderBy('date', 'desc')
      .get();

    return snapshot.docs.map((doc: any) => this._fromFirestoreDoc(doc.id, doc.data()));
  }

  async findByPlanIdUntilYesterday(planId: string): Promise<StudySessionEntity[]> {
    if (!this.firestore) {
      throw new Error('Firestore not initialized');
    }

    const yesterday = endOfDay(subDays(new Date(), 1));

    const snapshot = await this.firestore
      .collection(this.collectionName)
      .where('planId', '==', planId)
      .where('date', '<=', yesterday)
      .orderBy('date', 'desc')
      .get();

    return snapshot.docs.map((doc: any) => this._fromFirestoreDoc(doc.id, doc.data()));
  }

  async findByUserIdAndDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<StudySessionEntity[]> {
    if (!this.firestore) {
      throw new Error('Firestore not initialized');
    }

    const start = startOfDay(startDate);
    const end = endOfDay(endDate);

    const snapshot = await this.firestore
      .collection(this.collectionName)
      .where('userId', '==', userId)
      .where('date', '>=', start)
      .where('date', '<=', end)
      .orderBy('date', 'desc')
      .get();

    return snapshot.docs.map((doc: any) => this._fromFirestoreDoc(doc.id, doc.data()));
  }

  async delete(sessionId: string): Promise<void> {
    if (!this.firestore) {
      throw new Error('Firestore not initialized');
    }

    await this.firestore.collection(this.collectionName).doc(sessionId).delete();
  }

  private _toFirestoreDoc(session: StudySessionEntity): any {
    return {
      userId: session.userId,
      planId: session.planId,
      date: session.date,
      unitsCompleted: session.unitsCompleted,
      startUnit: session.startUnit,
      endUnit: session.endUnit,
      durationMinutes: session.durationMinutes,
      concentration: session.concentration,
      difficulty: session.difficulty,
      round: session.round,
    };
  }

  private _fromFirestoreDoc(id: string, data: any): StudySessionEntity {
    return new StudySessionEntity({
      id,
      userId: data.userId,
      planId: data.planId,
      date: data.date.toDate ? data.date.toDate() : new Date(data.date),
      unitsCompleted: data.unitsCompleted,
      startUnit: data.startUnit,
      endUnit: data.endUnit,
      durationMinutes: data.durationMinutes,
      concentration: data.concentration,
      difficulty: data.difficulty,
      round: data.round,
    });
  }
}

