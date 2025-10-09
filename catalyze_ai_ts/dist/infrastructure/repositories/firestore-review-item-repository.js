"use strict";
/**
 * インフラストラクチャ層 - Firestore実装
 *
 * ReviewItemRepositoryのFirestore実装
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirestoreReviewItemRepository = void 0;
const date_fns_1 = require("date-fns");
const review_item_entity_1 = require("../../domain/entities/review-item-entity");
/**
 * Firestore用のReviewItemRepository実装
 */
class FirestoreReviewItemRepository {
    constructor(firestore) {
        this.firestore = firestore;
        this.collectionName = 'review_items';
        // firestore: Firebase Firestore instance
    }
    async create(reviewItem) {
        if (!this.firestore) {
            throw new Error('Firestore not initialized');
        }
        const doc = this._toFirestoreDoc(reviewItem);
        await this.firestore.collection(this.collectionName).doc(reviewItem.id).set(doc);
        return reviewItem;
    }
    async update(reviewItem) {
        if (!this.firestore) {
            throw new Error('Firestore not initialized');
        }
        const doc = this._toFirestoreDoc(reviewItem);
        await this.firestore.collection(this.collectionName).doc(reviewItem.id).update(doc);
    }
    async findById(reviewItemId) {
        if (!this.firestore) {
            throw new Error('Firestore not initialized');
        }
        const snapshot = await this.firestore.collection(this.collectionName).doc(reviewItemId).get();
        if (!snapshot.exists) {
            return null;
        }
        return this._fromFirestoreDoc(snapshot.id, snapshot.data());
    }
    async findByPlanId(planId) {
        if (!this.firestore) {
            throw new Error('Firestore not initialized');
        }
        const snapshot = await this.firestore
            .collection(this.collectionName)
            .where('planId', '==', planId)
            .orderBy('nextReviewDate', 'asc')
            .get();
        return snapshot.docs.map((doc) => this._fromFirestoreDoc(doc.id, doc.data()));
    }
    async findDueToday(userId) {
        if (!this.firestore) {
            throw new Error('Firestore not initialized');
        }
        const today = (0, date_fns_1.endOfDay)(new Date());
        const snapshot = await this.firestore
            .collection(this.collectionName)
            .where('userId', '==', userId)
            .where('nextReviewDate', '<=', today)
            .orderBy('nextReviewDate', 'asc')
            .get();
        return snapshot.docs.map((doc) => this._fromFirestoreDoc(doc.id, doc.data()));
    }
    async findByUserIdAndDateRange(userId, startDate, endDate) {
        if (!this.firestore) {
            throw new Error('Firestore not initialized');
        }
        const start = (0, date_fns_1.startOfDay)(startDate);
        const end = (0, date_fns_1.endOfDay)(endDate);
        const snapshot = await this.firestore
            .collection(this.collectionName)
            .where('userId', '==', userId)
            .where('nextReviewDate', '>=', start)
            .where('nextReviewDate', '<=', end)
            .orderBy('nextReviewDate', 'asc')
            .get();
        return snapshot.docs.map((doc) => this._fromFirestoreDoc(doc.id, doc.data()));
    }
    async delete(reviewItemId) {
        if (!this.firestore) {
            throw new Error('Firestore not initialized');
        }
        await this.firestore.collection(this.collectionName).doc(reviewItemId).delete();
    }
    async deleteByPlanId(planId) {
        if (!this.firestore) {
            throw new Error('Firestore not initialized');
        }
        const snapshot = await this.firestore
            .collection(this.collectionName)
            .where('planId', '==', planId)
            .get();
        const batch = this.firestore.batch();
        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        await batch.commit();
    }
    _toFirestoreDoc(reviewItem) {
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
    _fromFirestoreDoc(id, data) {
        return new review_item_entity_1.ReviewItemEntity({
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
exports.FirestoreReviewItemRepository = FirestoreReviewItemRepository;
//# sourceMappingURL=firestore-review-item-repository.js.map