/**
 * ドメイン層 - エンティティ
 *
 * 学習計画エンティティ - ビジネスロジックをカプセル化
 */
import { DateRange } from '../value-objects/date-range';
import { PlanDifficulty, PlanStatus } from '../types';
export interface StudyPlanEntityProps {
    id: string;
    userId: string;
    title: string;
    totalUnits: number;
    unit?: string;
    unitRange?: {
        start: number;
        end: number;
    };
    createdAt: Date;
    deadline: Date;
    rounds?: number;
    targetRounds?: number;
    estimatedTimePerUnit: number;
    difficulty?: PlanDifficulty;
    studyDays?: number[];
    status?: PlanStatus;
    dailyQuota?: number;
    dynamicDeadline?: Date;
}
/**
 * 学習計画エンティティ
 *
 * ドメインモデルとして、ビジネスルールとロジックをカプセル化
 */
export declare class StudyPlanEntity {
    readonly id: string;
    readonly userId: string;
    readonly title: string;
    readonly totalUnits: number;
    readonly unit: string;
    readonly createdAt: Date;
    readonly deadline: Date;
    readonly rounds: number;
    readonly targetRounds: number;
    readonly estimatedTimePerUnit: number;
    readonly difficulty: PlanDifficulty;
    readonly studyDays: readonly number[];
    readonly status: PlanStatus;
    readonly dailyQuota?: number;
    readonly dynamicDeadline?: Date;
    readonly unitRange?: {
        start: number;
        end: number;
    };
    constructor(props: StudyPlanEntityProps);
    /**
     * 日付範囲を取得
     */
    get period(): DateRange;
    /**
     * 有効な周回数（roundsとtargetRoundsの大きい方）
     */
    get effectiveRounds(): number;
    /**
     * 指定された曜日が学習日かどうか
     *
     * @param weekday - 曜日（1=月曜, 7=日曜）
     */
    isStudyDay(weekday: number): boolean;
    /**
     * 今日が学習日かどうか
     */
    isTodayStudyDay(): boolean;
    /**
     * 期限切れかどうか
     */
    isOverdue(): boolean;
    /**
     * アクティブな計画かどうか
     */
    get isActive(): boolean;
    /**
     * 一時停止中かどうか
     */
    get isPaused(): boolean;
    /**
     * 完了済みかどうか
     */
    get isCompleted(): boolean;
    /**
     * 本日完了かどうか
     */
    get isCompletedToday(): boolean;
    /**
     * 残り日数
     */
    get remainingDays(): number;
    /**
     * 経過日数
     */
    get elapsedDays(): number;
    /**
     * 期間の進捗率（日数ベース）
     */
    get timeProgressRatio(): number;
    /**
     * 学習計画を一時停止
     */
    pause(): StudyPlanEntity;
    /**
     * 学習計画を再開
     */
    resume(): StudyPlanEntity;
    /**
     * 学習計画を完了
     */
    complete(): StudyPlanEntity;
    /**
     * 本日のタスクを完了
     */
    completeToday(): StudyPlanEntity;
    /**
     * 本日完了を学習中に戻す
     */
    resetTodayCompletion(): StudyPlanEntity;
    /**
     * 動的締め切りを更新
     */
    updateDynamicDeadline(newDeadline: Date): StudyPlanEntity;
    /**
     * 日次ノルマを更新
     */
    updateDailyQuota(quota: number): StudyPlanEntity;
    /**
     * 周回数を増やす
     */
    incrementRounds(): StudyPlanEntity;
    /**
     * バリデーション
     */
    validate(): boolean;
    /**
     * プロパティを取得（copyWith用）
     */
    private toProps;
}
//# sourceMappingURL=study-plan-entity.d.ts.map