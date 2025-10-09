/**
 * インフラストラクチャ層 - メモリ実装
 *
 * StudySessionRepositoryのインメモリ実装（テスト・開発用）
 */
import { StudySessionRepository } from '../../domain/repositories/study-session-repository';
import { StudySessionEntity } from '../../domain/entities/study-session-entity';
/**
 * メモリ内StudySessionRepository実装
 */
export declare class InMemoryStudySessionRepository implements StudySessionRepository {
    private sessions;
    create(session: StudySessionEntity): Promise<StudySessionEntity>;
    update(session: StudySessionEntity): Promise<void>;
    findById(sessionId: string): Promise<StudySessionEntity | null>;
    findByPlanId(planId: string): Promise<StudySessionEntity[]>;
    findByPlanIdUntilYesterday(planId: string): Promise<StudySessionEntity[]>;
    findByUserIdAndDateRange(userId: string, startDate: Date, endDate: Date): Promise<StudySessionEntity[]>;
    delete(sessionId: string): Promise<void>;
    /**
     * テスト用: 全データクリア
     */
    clear(): void;
    /**
     * テスト用: 全データ取得
     */
    getAll(): StudySessionEntity[];
}
//# sourceMappingURL=in-memory-study-session-repository.d.ts.map