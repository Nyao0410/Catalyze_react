"use strict";
/**
 * ドメイン層 - エンティティ
 *
 * 学習計画エンティティ - ビジネスロジックをカプセル化
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudyPlanEntity = void 0;
const date_range_1 = require("../value-objects/date-range");
const types_1 = require("../types");
const date_fns_1 = require("date-fns");
/**
 * 学習計画エンティティ
 *
 * ドメインモデルとして、ビジネスルールとロジックをカプセル化
 */
class StudyPlanEntity {
    constructor(props) {
        this.id = props.id;
        this.userId = props.userId;
        this.title = props.title;
        this.totalUnits = props.totalUnits;
        this.unit = props.unit ?? '問';
        this.createdAt = props.createdAt;
        this.deadline = props.deadline;
        this.rounds = props.rounds ?? 1;
        this.targetRounds = props.targetRounds ?? 1;
        this.estimatedTimePerUnit = props.estimatedTimePerUnit;
        this.difficulty = props.difficulty ?? types_1.PlanDifficulty.NORMAL;
        this.studyDays = props.studyDays ?? [1, 2, 3, 4, 5];
        this.status = props.status ?? types_1.PlanStatus.ACTIVE;
        this.dailyQuota = props.dailyQuota;
        this.dynamicDeadline = props.dynamicDeadline;
        this.unitRange = props.unitRange;
        if (!this.validate()) {
            throw new Error('Invalid StudyPlanEntity');
        }
    }
    /**
     * 日付範囲を取得
     */
    get period() {
        return new date_range_1.DateRange(this.createdAt, this.deadline);
    }
    /**
     * 有効な周回数（roundsとtargetRoundsの大きい方）
     */
    get effectiveRounds() {
        return Math.max(this.rounds, this.targetRounds);
    }
    /**
     * 指定された曜日が学習日かどうか
     *
     * @param weekday - 曜日（1=月曜, 7=日曜）
     */
    isStudyDay(weekday) {
        return this.studyDays.includes(weekday);
    }
    /**
     * 今日が学習日かどうか
     */
    isTodayStudyDay() {
        const today = new Date();
        // JavaScriptのgetDay()は0=日曜, 6=土曜なので変換
        const weekday = today.getDay() === 0 ? 7 : today.getDay();
        return this.isStudyDay(weekday);
    }
    /**
     * 期限切れかどうか
     */
    isOverdue() {
        const today = (0, date_fns_1.startOfDay)(new Date());
        return (0, date_fns_1.isAfter)(today, (0, date_fns_1.startOfDay)(this.deadline));
    }
    /**
     * アクティブな計画かどうか
     */
    get isActive() {
        return this.status === types_1.PlanStatus.ACTIVE;
    }
    /**
     * 一時停止中かどうか
     */
    get isPaused() {
        return this.status === types_1.PlanStatus.PAUSED;
    }
    /**
     * 完了済みかどうか
     */
    get isCompleted() {
        return this.status === types_1.PlanStatus.COMPLETED;
    }
    /**
     * 本日完了かどうか
     */
    get isCompletedToday() {
        return this.status === types_1.PlanStatus.COMPLETED_TODAY;
    }
    /**
     * 残り日数
     */
    get remainingDays() {
        return this.period.remainingDays;
    }
    /**
     * 経過日数
     */
    get elapsedDays() {
        return this.period.elapsedDays;
    }
    /**
     * 期間の進捗率（日数ベース）
     */
    get timeProgressRatio() {
        return this.period.progressRatio;
    }
    /**
     * 学習計画を一時停止
     */
    pause() {
        return new StudyPlanEntity({
            ...this.toProps(),
            status: types_1.PlanStatus.PAUSED,
        });
    }
    /**
     * 学習計画を再開
     */
    resume() {
        return new StudyPlanEntity({
            ...this.toProps(),
            status: types_1.PlanStatus.ACTIVE,
        });
    }
    /**
     * 学習計画を完了
     */
    complete() {
        return new StudyPlanEntity({
            ...this.toProps(),
            status: types_1.PlanStatus.COMPLETED,
        });
    }
    /**
     * 本日のタスクを完了
     */
    completeToday() {
        return new StudyPlanEntity({
            ...this.toProps(),
            status: types_1.PlanStatus.COMPLETED_TODAY,
        });
    }
    /**
     * 本日完了を学習中に戻す
     */
    resetTodayCompletion() {
        if (this.status === types_1.PlanStatus.COMPLETED_TODAY) {
            return new StudyPlanEntity({
                ...this.toProps(),
                status: types_1.PlanStatus.ACTIVE,
            });
        }
        return this;
    }
    /**
     * 動的締め切りを更新
     */
    updateDynamicDeadline(newDeadline) {
        return new StudyPlanEntity({
            ...this.toProps(),
            dynamicDeadline: newDeadline,
        });
    }
    /**
     * 日次ノルマを更新
     */
    updateDailyQuota(quota) {
        return new StudyPlanEntity({
            ...this.toProps(),
            dailyQuota: quota,
        });
    }
    /**
     * 周回数を増やす
     */
    incrementRounds() {
        return new StudyPlanEntity({
            ...this.toProps(),
            targetRounds: this.targetRounds + 1,
        });
    }
    /**
     * バリデーション
     */
    validate() {
        if (this.totalUnits <= 0)
            return false;
        if ((0, date_fns_1.isAfter)(this.createdAt, this.deadline))
            return false;
        if (this.studyDays.length === 0)
            return false;
        if (this.rounds < 1)
            return false;
        if (this.targetRounds < 1)
            return false;
        return true;
    }
    /**
     * プロパティを取得（copyWith用）
     */
    toProps() {
        return {
            id: this.id,
            userId: this.userId,
            title: this.title,
            totalUnits: this.totalUnits,
            unit: this.unit,
            unitRange: this.unitRange,
            createdAt: this.createdAt,
            deadline: this.deadline,
            rounds: this.rounds,
            targetRounds: this.targetRounds,
            estimatedTimePerUnit: this.estimatedTimePerUnit,
            difficulty: this.difficulty,
            studyDays: Array.from(this.studyDays),
            status: this.status,
            dailyQuota: this.dailyQuota,
            dynamicDeadline: this.dynamicDeadline,
        };
    }
}
exports.StudyPlanEntity = StudyPlanEntity;
//# sourceMappingURL=study-plan-entity.js.map