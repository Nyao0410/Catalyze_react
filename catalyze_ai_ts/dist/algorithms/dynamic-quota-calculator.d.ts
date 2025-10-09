/**
 * DynamicQuotaCalculator
 *
 * レガシーの動的ノルマ調整エンジンをTypeScriptで移植したもの。
 * 目的: 学習記録からパフォーマンス係数を計算し、1単位あたりの所要時間を調整、
 * 残り学習量と締切から仮締切や日次ノルマの提案を行う。
 */
import { StudyPlanEntity } from '../domain/entities/study-plan-entity';
import { StudySessionEntity } from '../domain/entities/study-session-entity';
export interface DynamicQuotaResult {
    adjustedTimePerUnitMs: number;
    provisionalDeadline: Date;
    recommendedDailyQuota: number;
}
export declare class DynamicQuotaCalculator {
    static readonly NEUTRAL_PERFORMANCE_FACTOR = 9;
    /**
     * 計算エントリポイント
     * @param plan
     * @param sessions - 昨日までのセッション
     */
    calculate(plan: StudyPlanEntity, sessions: StudySessionEntity[]): DynamicQuotaResult;
    private _calculateAveragePerformanceFactor;
}
//# sourceMappingURL=dynamic-quota-calculator.d.ts.map