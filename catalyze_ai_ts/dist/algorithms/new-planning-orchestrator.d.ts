import { StudyPlanEntity } from '../domain/entities/study-plan-entity';
import { StudySessionEntity } from '../domain/entities/study-session-entity';
import { ReviewItemEntity } from '../domain/entities/review-item-entity';
import { RoundTask } from './multi-round-planner';
import { DailyTaskEntity } from '../domain/entities/daily-task-entity';
export interface OrchestratorResult {
    dailyTasks: DailyTaskEntity[];
    roundTasks: RoundTask[];
    dailyQuota: number;
    provisionalDeadline: Date;
}
/**
 * NewPlanningOrchestrator
 * より明確で堅牢な日次割当ロジックを提供するオーケストレータ
 */
export declare class NewPlanningOrchestrator {
    private quotaCalc;
    private planner;
    generatePlan(plan: StudyPlanEntity, sessions: StudySessionEntity[], _reviewItems?: ReviewItemEntity[], dailyQuotaOverride?: number): OrchestratorResult;
    private _generateRoundTasks;
    private _allocate;
}
//# sourceMappingURL=new-planning-orchestrator.d.ts.map