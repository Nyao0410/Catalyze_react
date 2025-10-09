"use strict";
/**
 * インフラストラクチャ層 - Firestore実装
 *
 * StudyPlanRepositoryのFirestore実装
 * 注: 実際のFirebaseアクセスは設定が必要です
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirestoreStudyPlanRepository = void 0;
const study_plan_entity_1 = require("../../domain/entities/study-plan-entity");
/**
 * Firestore用のStudyPlanRepository実装
 *
 * このクラスは参考実装です。実際の使用にはFirebase SDKの設定が必要です。
 */
class FirestoreStudyPlanRepository {
    constructor(firestore) {
        this.firestore = firestore;
        this.collectionName = 'study_plans';
        // firestore: Firebase Firestore instance
        // 実際の実装では、Firebase Admin SDKまたはクライアントSDKを使用
    }
    async create(plan) {
        if (!this.firestore) {
            throw new Error('Firestore not initialized');
        }
        const doc = this._toFirestoreDoc(plan);
        await this.firestore.collection(this.collectionName).doc(plan.id).set(doc);
        return plan;
    }
    async update(plan) {
        if (!this.firestore) {
            throw new Error('Firestore not initialized');
        }
        const doc = this._toFirestoreDoc(plan);
        await this.firestore.collection(this.collectionName).doc(plan.id).update(doc);
    }
    async findById(planId) {
        if (!this.firestore) {
            throw new Error('Firestore not initialized');
        }
        const snapshot = await this.firestore.collection(this.collectionName).doc(planId).get();
        if (!snapshot.exists) {
            return null;
        }
        return this._fromFirestoreDoc(snapshot.id, snapshot.data());
    }
    async findByUserId(userId) {
        if (!this.firestore) {
            throw new Error('Firestore not initialized');
        }
        const snapshot = await this.firestore
            .collection(this.collectionName)
            .where('userId', '==', userId)
            .get();
        return snapshot.docs.map((doc) => this._fromFirestoreDoc(doc.id, doc.data()));
    }
    async findActiveByUserId(userId) {
        if (!this.firestore) {
            throw new Error('Firestore not initialized');
        }
        const snapshot = await this.firestore
            .collection(this.collectionName)
            .where('userId', '==', userId)
            .where('status', '==', 'active')
            .get();
        return snapshot.docs.map((doc) => this._fromFirestoreDoc(doc.id, doc.data()));
    }
    async delete(planId) {
        if (!this.firestore) {
            throw new Error('Firestore not initialized');
        }
        await this.firestore.collection(this.collectionName).doc(planId).delete();
    }
    // Firestore文書への変換
    _toFirestoreDoc(plan) {
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
    _fromFirestoreDoc(id, data) {
        return new study_plan_entity_1.StudyPlanEntity({
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
exports.FirestoreStudyPlanRepository = FirestoreStudyPlanRepository;
//# sourceMappingURL=firestore-study-plan-repository.js.map