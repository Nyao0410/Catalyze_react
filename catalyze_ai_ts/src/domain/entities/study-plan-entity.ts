/**
 * ドメイン層 - エンティティ
 * 
 * 学習計画エンティティ - ビジネスロジックをカプセル化
 */

import { DateRange } from '../value-objects/date-range';
import { PlanDifficulty, PlanStatus } from '../types';
import { startOfDay, isAfter } from 'date-fns';

export interface StudyPlanEntityProps {
  id: string;
  userId: string;
  title: string;
  totalUnits: number;
  unit?: string;
  unitRange?: { start: number; end: number };
  createdAt: Date;
  deadline: Date;
  rounds?: number;
  targetRounds?: number;
  estimatedTimePerUnit: number; // milliseconds
  difficulty?: PlanDifficulty;
  studyDays?: number[]; // 1=Monday, 7=Sunday
  status?: PlanStatus;
  dailyQuota?: number;
  dynamicDeadline?: Date;
}

/**
 * 学習計画エンティティ
 * 
 * ドメインモデルとして、ビジネスルールとロジックをカプセル化
 */
export class StudyPlanEntity {
  readonly id: string;
  readonly userId: string;
  readonly title: string;
  readonly totalUnits: number;
  readonly unit: string;
  readonly createdAt: Date;
  readonly deadline: Date;
  readonly rounds: number;
  readonly targetRounds: number;
  readonly estimatedTimePerUnit: number; // milliseconds
  readonly difficulty: PlanDifficulty;
  readonly studyDays: readonly number[];
  readonly status: PlanStatus;
  readonly dailyQuota?: number;
  readonly dynamicDeadline?: Date;
  readonly unitRange?: { start: number; end: number };

  constructor(props: StudyPlanEntityProps) {
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
    this.difficulty = props.difficulty ?? PlanDifficulty.NORMAL;
    this.studyDays = props.studyDays ?? [1, 2, 3, 4, 5];
    this.status = props.status ?? PlanStatus.ACTIVE;
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
  get period(): DateRange {
    return new DateRange(this.createdAt, this.deadline);
  }

  /**
   * 有効な周回数（roundsとtargetRoundsの大きい方）
   */
  get effectiveRounds(): number {
    return Math.max(this.rounds, this.targetRounds);
  }

  /**
   * 指定された曜日が学習日かどうか
   * 
   * @param weekday - 曜日（1=月曜, 7=日曜）
   */
  isStudyDay(weekday: number): boolean {
    return this.studyDays.includes(weekday);
  }

  /**
   * 今日が学習日かどうか
   */
  isTodayStudyDay(): boolean {
    const today = new Date();
    // JavaScriptのgetDay()は0=日曜, 6=土曜なので変換
    const weekday = today.getDay() === 0 ? 7 : today.getDay();
    return this.isStudyDay(weekday);
  }

  /**
   * 期限切れかどうか
   */
  isOverdue(): boolean {
    const today = startOfDay(new Date());
    return isAfter(today, startOfDay(this.deadline));
  }

  /**
   * アクティブな計画かどうか
   */
  get isActive(): boolean {
    return this.status === PlanStatus.ACTIVE;
  }

  /**
   * 一時停止中かどうか
   */
  get isPaused(): boolean {
    return this.status === PlanStatus.PAUSED;
  }

  /**
   * 完了済みかどうか
   */
  get isCompleted(): boolean {
    return this.status === PlanStatus.COMPLETED;
  }

  /**
   * 本日完了かどうか
   */
  get isCompletedToday(): boolean {
    return this.status === PlanStatus.COMPLETED_TODAY;
  }

  /**
   * 残り日数
   */
  get remainingDays(): number {
    return this.period.remainingDays;
  }

  /**
   * 経過日数
   */
  get elapsedDays(): number {
    return this.period.elapsedDays;
  }

  /**
   * 期間の進捗率（日数ベース）
   */
  get timeProgressRatio(): number {
    return this.period.progressRatio;
  }

  /**
   * 学習計画を一時停止
   */
  pause(): StudyPlanEntity {
    return new StudyPlanEntity({
      ...this.toProps(),
      status: PlanStatus.PAUSED,
    });
  }

  /**
   * 学習計画を再開
   */
  resume(): StudyPlanEntity {
    return new StudyPlanEntity({
      ...this.toProps(),
      status: PlanStatus.ACTIVE,
    });
  }

  /**
   * 学習計画を完了
   */
  complete(): StudyPlanEntity {
    return new StudyPlanEntity({
      ...this.toProps(),
      status: PlanStatus.COMPLETED,
    });
  }

  /**
   * 本日のタスクを完了
   */
  completeToday(): StudyPlanEntity {
    return new StudyPlanEntity({
      ...this.toProps(),
      status: PlanStatus.COMPLETED_TODAY,
    });
  }

  /**
   * 本日完了を学習中に戻す
   */
  resetTodayCompletion(): StudyPlanEntity {
    if (this.status === PlanStatus.COMPLETED_TODAY) {
      return new StudyPlanEntity({
        ...this.toProps(),
        status: PlanStatus.ACTIVE,
      });
    }
    return this;
  }

  /**
   * 動的締め切りを更新
   */
  updateDynamicDeadline(newDeadline: Date): StudyPlanEntity {
    return new StudyPlanEntity({
      ...this.toProps(),
      dynamicDeadline: newDeadline,
    });
  }

  /**
   * 日次ノルマを更新
   */
  updateDailyQuota(quota: number): StudyPlanEntity {
    return new StudyPlanEntity({
      ...this.toProps(),
      dailyQuota: quota,
    });
  }

  /**
   * 周回数を増やす
   */
  incrementRounds(): StudyPlanEntity {
    return new StudyPlanEntity({
      ...this.toProps(),
      targetRounds: this.targetRounds + 1,
    });
  }

  /**
   * バリデーション
   */
  validate(): boolean {
    if (this.totalUnits <= 0) return false;
    if (isAfter(this.createdAt, this.deadline)) return false;
    if (this.studyDays.length === 0) return false;
    if (this.rounds < 1) return false;
    if (this.targetRounds < 1) return false;
    return true;
  }

  /**
   * プロパティを取得（copyWith用）
   */
  private toProps(): StudyPlanEntityProps {
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
