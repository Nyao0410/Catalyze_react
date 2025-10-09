/**
 * インフラストラクチャ層 - Firestore実装
 * 
 * ReviewItemRepositoryのFirestore実装
 */

import { startOfDay, endOfDay } from 'date-fns';
import { ReviewItemRepository } from '../../domain/repositories/review-item-repository';
import { ReviewItemEntity } from '../../domain/entities/review-item-entity';

/**
 * Firestore用のReviewItemRepository実装
 */
export class FirestoreReviewItemRepository implements ReviewItemRepository {
  private collectionName = 'review_items';

  constructor(private firestore?: any) {
    // firestore: Firebase Firestore instance
  }

  async create(reviewItem: ReviewItemEntity): Promise<ReviewItemEntity> {
    if (!this.firestore) {
      throw new Error('Firestore not initialized');
    }

    const doc = this._toFirestoreDoc(reviewItem);
    await this.firestore.collection(this.collectionName).doc(reviewItem.id).set(doc);
    return reviewItem;
  }

  async update(reviewItem: ReviewItemEntity): Promise<void> {
    if (!this.firestore) {
      throw new Error('Firestore not initialized');
    }

    const doc = this._toFirestoreDoc(reviewItem);
    await this.firestore.collection(this.collectionName).doc(reviewItem.id).update(doc);
  }

  async findById(reviewItemId: string): Promise<ReviewItemEntity | null> {
    if (!this.firestore) {
      throw new Error('Firestore not initialized');
    }

    const snapshot = await this.firestore.collection(this.collectionName).doc(reviewItemId).get();

    if (!snapshot.exists) {
      return null;
    }

    return this._fromFirestoreDoc(snapshot.id, snapshot.data());
  }

  async findByPlanId(planId: string): Promise<ReviewItemEntity[]> {
    if (!this.firestore) {
      throw new Error('Firestore not initialized');
    }

    const snapshot = await this.firestore
      .collection(this.collectionName)
      .where('planId', '==', planId)
      .orderBy('nextReviewDate', 'asc')
      .get();

    return snapshot.docs.map((doc: any) => this._fromFirestoreDoc(doc.id, doc.data()));
  }

  async findDueToday(userId: string): Promise<ReviewItemEntity[]> {
    if (!this.firestore) {
      throw new Error('Firestore not initialized');
    }

    const today = endOfDay(new Date());

    const snapshot = await this.firestore
      .collection(this.collectionName)
      .where('userId', '==', userId)
      .where('nextReviewDate', '<=', today)
      .orderBy('nextReviewDate', 'asc')
      .get();

    return snapshot.docs.map((doc: any) => this._fromFirestoreDoc(doc.id, doc.data()));
  }

  async findByUserIdAndDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ReviewItemEntity[]> {
    if (!this.firestore) {
      throw new Error('Firestore not initialized');
    }

    const start = startOfDay(startDate);
    const end = endOfDay(endDate);

    const snapshot = await this.firestore
      .collection(this.collectionName)
      .where('userId', '==', userId)
      .where('nextReviewDate', '>=', start)
      .where('nextReviewDate', '<=', end)
      .orderBy('nextReviewDate', 'asc')
      .get();

    return snapshot.docs.map((doc: any) => this._fromFirestoreDoc(doc.id, doc.data()));
  }

  async delete(reviewItemId: string): Promise<void> {
    if (!this.firestore) {
      throw new Error('Firestore not initialized');
    }

    await this.firestore.collection(this.collectionName).doc(reviewItemId).delete();
  }

  async deleteByPlanId(planId: string): Promise<void> {
    if (!this.firestore) {
      throw new Error('Firestore not initialized');
    }

    const snapshot = await this.firestore
      .collection(this.collectionName)
      .where('planId', '==', planId)
      .get();

    const batch = this.firestore.batch();
    snapshot.docs.forEach((doc: any) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  }

  private _toFirestoreDoc(reviewItem: ReviewItemEntity): any {
    return {
      userId: reviewItem.userId,
      planId: reviewItem.planId,
      unitNumber: reviewItem.unitNumber,
      easeFactor: reviewItem.easeFactor,
      intervalDays: reviewItem.intervalDays,
      repetitions: reviewItem.repetitions,
      nextReviewDate: reviewItem.nextReviewDate,
      lastReviewDate: reviewItem.lastReviewDate,
    };
  }

  private _fromFirestoreDoc(id: string, data: any): ReviewItemEntity {
    return new ReviewItemEntity({
      id,
      userId: data.userId,
      planId: data.planId,
      unitNumber: data.unitNumber,
      easeFactor: data.easeFactor,
      intervalDays: data.intervalDays,
      repetitions: data.repetitions,
      nextReviewDate: data.nextReviewDate.toDate
        ? data.nextReviewDate.toDate()
        : new Date(data.nextReviewDate),
      lastReviewDate: data.lastReviewDate.toDate
        ? data.lastReviewDate.toDate()
        : new Date(data.lastReviewDate),
    });
  }
}

