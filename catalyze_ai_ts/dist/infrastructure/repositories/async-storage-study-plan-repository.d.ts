/**
 * AsyncStorage-backed StudyPlanRepository
 */
import { StudyPlanRepository } from '../../domain/repositories/study-plan-repository';
import { StudyPlanEntity } from '../../domain/entities/study-plan-entity';
export declare class AsyncStorageStudyPlanRepository implements StudyPlanRepository {
    private _loadAll;
    private _saveAll;
    create(plan: StudyPlanEntity): Promise<StudyPlanEntity>;
    update(plan: StudyPlanEntity): Promise<void>;
    findById(planId: string): Promise<StudyPlanEntity | null>;
    findByUserId(userId: string): Promise<StudyPlanEntity[]>;
    findActiveByUserId(userId: string): Promise<StudyPlanEntity[]>;
    delete(planId: string): Promise<void>;
    clear(): Promise<void>;
}
//# sourceMappingURL=async-storage-study-plan-repository.d.ts.map