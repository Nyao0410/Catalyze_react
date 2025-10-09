/**
 * インフラストラクチャ層 - Firestore実装
 * 
 * StudyPlanRepositoryのFirestore実装
 * 注: 実際のFirebaseアクセスは設定が必要です
 */

import { StudyPlanRepository } from '../../domain/repositories/study-plan-repository';
import { StudyPlanEntity } from '../../domain/entities/study-plan-entity';

/**
 * Firestore用のStudyPlanRepository実装
 * 
 * このクラスは参考実装です。実際の使用にはFirebase SDKの設定が必要です。
 */
export class FirestoreStudyPlanRepository implements StudyPlanRepository {
  private collectionName = 'study_plans';

  constructor(private firestore?: any) {
    // firestore: Firebase Firestore instance
    // 実際の実装では、Firebase Admin SDKまたはクライアントSDKを使用
  }

  async create(plan: StudyPlanEntity): Promise<StudyPlanEntity> {
    if (!this.firestore) {
      throw new Error('Firestore not initialized');
    }

    const doc = this._toFirestoreDoc(plan);
    await this.firestore.collection(this.collectionName).doc(plan.id).set(doc);
    return plan;
  }

  async update(plan: StudyPlanEntity): Promise<void> {
    if (!this.firestore) {
      throw new Error('Firestore not initialized');
    }

    const doc = this._toFirestoreDoc(plan);
    await this.firestore.collection(this.collectionName).doc(plan.id).update(doc);
  }

  async findById(planId: string): Promise<StudyPlanEntity | null> {
    if (!this.firestore) {
      throw new Error('Firestore not initialized');
    }

    const snapshot = await this.firestore.collection(this.collectionName).doc(planId).get();

    if (!snapshot.exists) {
      return null;
    }

    return this._fromFirestoreDoc(snapshot.id, snapshot.data());
  }

  async findByUserId(userId: string): Promise<StudyPlanEntity[]> {
    if (!this.firestore) {
      throw new Error('Firestore not initialized');
    }

    const snapshot = await this.firestore
      .collection(this.collectionName)
      .where('userId', '==', userId)
      .get();

    return snapshot.docs.map((doc: any) => this._fromFirestoreDoc(doc.id, doc.data()));
  }

  async findActiveByUserId(userId: string): Promise<StudyPlanEntity[]> {
    if (!this.firestore) {
      throw new Error('Firestore not initialized');
    }

    const snapshot = await this.firestore
      .collection(this.collectionName)
      .where('userId', '==', userId)
      .where('status', '==', 'active')
      .get();

    return snapshot.docs.map((doc: any) => this._fromFirestoreDoc(doc.id, doc.data()));
  }

  async delete(planId: string): Promise<void> {
    if (!this.firestore) {
      throw new Error('Firestore not initialized');
    }

    await this.firestore.collection(this.collectionName).doc(planId).delete();
  }

  // Firestore文書への変換
  private _toFirestoreDoc(plan: StudyPlanEntity): any {
    return {
      userId: plan.userId,
      title: plan.title,
      totalUnits: plan.totalUnits,
      unit: plan.unit,
      unitRange: plan.unitRange,
      createdAt: plan.createdAt,
      deadline: plan.deadline,
      rounds: plan.rounds,
      targetRounds: plan.targetRounds,
      estimatedTimePerUnit: plan.estimatedTimePerUnit,
      difficulty: plan.difficulty,
      studyDays: plan.studyDays,
      status: plan.status,
      dailyQuota: plan.dailyQuota,
      dynamicDeadline: plan.dynamicDeadline,
    };
  }

  // Firestore文書からの変換
  private _fromFirestoreDoc(id: string, data: any): StudyPlanEntity {
    return new StudyPlanEntity({
      id,
      userId: data.userId,
      title: data.title,
      totalUnits: data.totalUnits,
      unit: data.unit,
  unitRange: data.unitRange,
      createdAt: data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
      deadline: data.deadline.toDate ? data.deadline.toDate() : new Date(data.deadline),
      rounds: data.rounds,
      targetRounds: data.targetRounds,
      estimatedTimePerUnit: data.estimatedTimePerUnit,
      difficulty: data.difficulty,
      studyDays: data.studyDays,
      status: data.status,
      dailyQuota: data.dailyQuota,
      dynamicDeadline: data.dynamicDeadline
        ? data.dynamicDeadline.toDate
          ? data.dynamicDeadline.toDate()
          : new Date(data.dynamicDeadline)
        : undefined,
    });
  }
}
