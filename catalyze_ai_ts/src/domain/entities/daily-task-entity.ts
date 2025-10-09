/**
 * ドメイン層 - エンティティ
 * 
 * 日次タスクエンティティ
 */

import { startOfDay, isAfter, isBefore, isSameDay } from 'date-fns';

export interface DailyTaskEntityProps {
  id: string;
  planId: string;
  date: Date;
  startUnit: number;
  endUnit: number;
  units: number;
  estimatedDuration: number; // milliseconds
  round?: number;
  advice?: string;
}

/**
 * 日次タスクエンティティ
 * 
 * その日に実施すべき学習タスクを表すドメインモデル
 */
export class DailyTaskEntity {
  readonly id: string;
  readonly planId: string;
  readonly date: Date;
  readonly startUnit: number;
  readonly endUnit: number;
  readonly units: number;
  readonly estimatedDuration: number; // milliseconds
  readonly round?: number;
  readonly advice?: string;

  constructor(props: DailyTaskEntityProps) {
    this.id = props.id;
    this.planId = props.planId;
    this.date = props.date;
    this.startUnit = props.startUnit;
    this.endUnit = props.endUnit;
    this.units = props.units;
    this.estimatedDuration = props.estimatedDuration;
    this.round = props.round;
    this.advice = props.advice;

    if (!this.validate()) {
      throw new Error('Invalid DailyTaskEntity');
    }
  }

  /**
   * タスクのタイトルを生成
   */
  generateTitle(planTitle: string): string {
    if (this.round && this.round > 1) {
      return `${planTitle} (R${this.round}) U${this.startUnit}-${this.endUnit}`;
    }
    return `${planTitle} U${this.startUnit}-${this.endUnit}`;
  }

  /**
   * 今日のタスクかどうか
   */
  isToday(): boolean {
    const today = startOfDay(new Date());
    const taskDate = startOfDay(this.date);
    return isSameDay(today, taskDate);
  }

  /**
   * 過去のタスクかどうか
   */
  isPast(): boolean {
    const today = startOfDay(new Date());
    const taskDate = startOfDay(this.date);
    return isBefore(taskDate, today);
  }

  /**
   * 未来のタスクかどうか
   */
  isFuture(): boolean {
    const today = startOfDay(new Date());
    const taskDate = startOfDay(this.date);
    return isAfter(taskDate, today);
  }

  /**
   * 推定時間（分）
   */
  get estimatedMinutes(): number {
    return Math.floor(this.estimatedDuration / (1000 * 60));
  }

  /**
   * 推定時間（時間）
   */
  get estimatedHours(): number {
    return this.estimatedMinutes / 60.0;
  }

  /**
   * タスクが有効かどうか
   */
  validate(): boolean {
    if (this.units <= 0) return false;
    if (this.startUnit <= 0) return false;
    if (this.endUnit < this.startUnit) return false;
    if (this.endUnit - this.startUnit + 1 !== this.units) return false;
    if (this.estimatedDuration < 0) return false;
    return true;
  }
}
