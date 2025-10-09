/**
 * AsyncStorage-backed StudySessionRepository
 */
import { StudySessionRepository } from '../../domain/repositories/study-session-repository';
import { StudySessionEntity } from '../../domain/entities/study-session-entity';
export declare class AsyncStorageStudySessionRepository implements StudySessionRepository {
    private _loadAll;
    private _saveAll;
    create(session: StudySessionEntity): Promise<StudySessionEntity>;
    update(session: StudySessionEntity): Promise<void>;
    findById(sessionId: string): Promise<StudySessionEntity | null>;
    findByPlanId(planId: string): Promise<StudySessionEntity[]>;
    findByPlanIdUntilYesterday(planId: string): Promise<StudySessionEntity[]>;
    findByUserIdAndDateRange(userId: string, startDate: Date, endDate: Date): Promise<StudySessionEntity[]>;
    delete(sessionId: string): Promise<void>;
    clear(): Promise<void>;
}
//# sourceMappingURL=async-storage-study-session-repository.d.ts.map