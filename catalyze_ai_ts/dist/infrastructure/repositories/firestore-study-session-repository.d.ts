/**
 * インフラストラクチャ層 - Firestore実装
 *
 * StudySessionRepositoryのFirestore実装
 */
import { StudySessionRepository } from '../../domain/repositories/study-session-repository';
import { StudySessionEntity } from '../../domain/entities/study-session-entity';
/**
 * Firestore用のStudySessionRepository実装
 */
export declare class FirestoreStudySessionRepository implements StudySessionRepository {
    private firestore?;
    private collectionName;
    constructor(firestore?: any | undefined);
    create(session: StudySessionEntity): Promise<StudySessionEntity>;
    update(session: StudySessionEntity): Promise<void>;
    findById(sessionId: string): Promise<StudySessionEntity | null>;
    findByPlanId(planId: string): Promise<StudySessionEntity[]>;
    findByPlanIdUntilYesterday(planId: string): Promise<StudySessionEntity[]>;
    findByUserIdAndDateRange(userId: string, startDate: Date, endDate: Date): Promise<StudySessionEntity[]>;
    delete(sessionId: string): Promise<void>;
    private _toFirestoreDoc;
    private _fromFirestoreDoc;
}
//# sourceMappingURL=firestore-study-session-repository.d.ts.map