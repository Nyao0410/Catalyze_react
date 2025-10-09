"use strict";
/**
 * インフラストラクチャ層 - Firestore実装
 *
 * StudySessionRepositoryのFirestore実装
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirestoreStudySessionRepository = void 0;
const date_fns_1 = require("date-fns");
const study_session_entity_1 = require("../../domain/entities/study-session-entity");
/**
 * Firestore用のStudySessionRepository実装
 */
class FirestoreStudySessionRepository {
    constructor(firestore) {
        this.firestore = firestore;
        this.collectionName = 'study_sessions';
        // firestore: Firebase Firestore instance
    }
    async create(session) {
        if (!this.firestore) {
            throw new Error('Firestore not initialized');
        }
        const doc = this._toFirestoreDoc(session);
        await this.firestore.collection(this.collectionName).doc(session.id).set(doc);
        return session;
    }
    async update(session) {
        if (!this.firestore) {
            throw new Error('Firestore not initialized');
        }
        const doc = this._toFirestoreDoc(session);
        await this.firestore.collection(this.collectionName).doc(session.id).update(doc);
    }
    async findById(sessionId) {
        if (!this.firestore) {
            throw new Error('Firestore not initialized');
        }
        const snapshot = await this.firestore.collection(this.collectionName).doc(sessionId).get();
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
            .orderBy('date', 'desc')
            .get();
        return snapshot.docs.map((doc) => this._fromFirestoreDoc(doc.id, doc.data()));
    }
    async findByPlanIdUntilYesterday(planId) {
        if (!this.firestore) {
            throw new Error('Firestore not initialized');
        }
        const yesterday = (0, date_fns_1.endOfDay)((0, date_fns_1.subDays)(new Date(), 1));
        const snapshot = await this.firestore
            .collection(this.collectionName)
            .where('planId', '==', planId)
            .where('date', '<=', yesterday)
            .orderBy('date', 'desc')
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
            .where('date', '>=', start)
            .where('date', '<=', end)
            .orderBy('date', 'desc')
            .get();
        return snapshot.docs.map((doc) => this._fromFirestoreDoc(doc.id, doc.data()));
    }
    async delete(sessionId) {
        if (!this.firestore) {
            throw new Error('Firestore not initialized');
        }
        await this.firestore.collection(this.collectionName).doc(sessionId).delete();
    }
    _toFirestoreDoc(session) {
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
    _fromFirestoreDoc(id, data) {
        return new study_session_entity_1.StudySessionEntity({
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
exports.FirestoreStudySessionRepository = FirestoreStudySessionRepository;
//# sourceMappingURL=firestore-study-session-repository.js.map