/**
 * ドメイン層 - エンティティ
 * 
 * 学習セッションエンティティ - 1回の学習記録
 */

import { PerformanceMetrics, QualityLevel } from '../value-objects/performance-metrics';

export interface StudySessionEntityProps {
  id: string;
  userId: string;
  planId: string;
  date: Date;
  unitsCompleted: number;
  startUnit?: number;
  endUnit?: number;
  durationMinutes: number;
  concentration: number; // 0.0 ~ 1.0
  difficulty: number; // 1 ~ 5
  round?: number;
}

/**
 * 学習セッションエンティティ
 * 
 * ユーザーの1回の学習記録を表すドメインモデル
 */
export class StudySessionEntity {
  readonly id: string;
  readonly userId: string;
  readonly planId: string;
  readonly date: Date;
  readonly unitsCompleted: number;
  readonly startUnit?: number;
  readonly endUnit?: number;
  readonly durationMinutes: number;
  readonly concentration: number;
  readonly difficulty: number;
  readonly round: number;

  constructor(props: StudySessionEntityProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.planId = props.planId;
    this.date = props.date;
    // If a concrete range is provided, prefer the range length as the authoritative
    // units completed (progress calculations also prioritize range).
    this.startUnit = props.startUnit;
    this.endUnit = props.endUnit;
    if (typeof this.startUnit === 'number' && typeof this.endUnit === 'number') {
      // normalize to non-negative count
      this.unitsCompleted = Math.max(0, this.endUnit - this.startUnit + 1);
    } else {
      this.unitsCompleted = props.unitsCompleted;
    }
    this.durationMinutes = props.durationMinutes;
    this.concentration = props.concentration;
    this.difficulty = props.difficulty;
    this.round = props.round ?? 1;

    if (!this.validate()) {
      throw new Error('Invalid StudySessionEntity');
    }
  }

  /**
   * パフォーマンス指標を取得
   */
  get performanceMetrics(): PerformanceMetrics {
    return new PerformanceMetrics(
      this.concentration,
      this.difficulty,
      this.durationMinutes,
      this.unitsCompleted
    );
  }

  /**
   * 単元あたりの平均時間（分）
   */
  get averageTimePerUnit(): number {
    return this.performanceMetrics.averageTimePerUnit;
  }

  /**
   * パフォーマンス係数
   */
  get performanceFactor(): number {
    return this.performanceMetrics.performanceFactor;
  }

  /**
   * 効率スコア
   */
  get efficiencyScore(): number {
    return this.performanceMetrics.efficiencyScore;
  }

  /**
   * 学習品質レベル
   */
  get qualityLevel(): QualityLevel {
    return this.performanceMetrics.qualityLevel;
  }

  /**
   * 高品質な学習だったか
   */
  get isHighQuality(): boolean {
    return (
      this.qualityLevel === QualityLevel.EXCELLENT || this.qualityLevel === QualityLevel.GOOD
    );
  }

  /**
   * 改善が必要な学習だったか
   */
  get needsImprovement(): boolean {
    return this.qualityLevel === QualityLevel.POOR;
  }

  /**
   * セッションが有効かどうか
   */
  validate(): boolean {
    if (this.unitsCompleted <= 0) return false;
    // If range is provided, validate its consistency
    if (typeof this.startUnit === 'number' && typeof this.endUnit === 'number') {
      if (this.startUnit <= 0) return false;
      if (this.endUnit < this.startUnit) return false;
      // unitsCompleted should match the range length (constructor normalizes it)
      if (this.endUnit - this.startUnit + 1 !== this.unitsCompleted) return false;
    }
    if (this.durationMinutes < 0) return false;
    if (this.concentration < 0 || this.concentration > 1.0) return false;
    if (this.difficulty < 1 || this.difficulty > 5) return false;
    if (this.round < 1) return false;
    return true;
  }
}
