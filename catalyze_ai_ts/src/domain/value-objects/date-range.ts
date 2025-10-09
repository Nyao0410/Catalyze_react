/**
 * ドメイン層 - 値オブジェクト
 * 
 * 日付範囲を表す不変の値オブジェクト
 */

import { startOfDay, differenceInDays, isAfter, isBefore, isSameDay } from 'date-fns';

export class DateRange {
  readonly start: Date;
  readonly end: Date;

  constructor(start: Date, end: Date) {
    this.start = startOfDay(start);
    this.end = startOfDay(end);

    if (isAfter(this.start, this.end)) {
      throw new Error('Start date must be before or equal to end date');
    }
  }

  /**
   * 期間の日数を取得
   */
  get daysCount(): number {
    return differenceInDays(this.end, this.start) + 1;
  }

  /**
   * 今日が範囲内かどうか
   */
  containsToday(): boolean {
    const today = startOfDay(new Date());
    return this.contains(today);
  }

  /**
   * 指定された日付が範囲内かどうか
   */
  contains(date: Date): boolean {
    const dateOnly = startOfDay(date);
    return (
      (isSameDay(dateOnly, this.start) || isAfter(dateOnly, this.start)) &&
      (isSameDay(dateOnly, this.end) || isBefore(dateOnly, this.end))
    );
  }

  /**
   * 残り日数を取得
   */
  get remainingDays(): number {
    const today = startOfDay(new Date());
    if (isAfter(today, this.end)) return 0;
    return differenceInDays(this.end, today) + 1;
  }

  /**
   * 経過日数を取得
   */
  get elapsedDays(): number {
    const today = startOfDay(new Date());
    if (isBefore(today, this.start)) return 0;
    if (isAfter(today, this.end)) return this.daysCount;
    return differenceInDays(today, this.start) + 1;
  }

  /**
   * 進捗率を取得 (0.0 ~ 1.0)
   */
  get progressRatio(): number {
    if (this.daysCount === 0) return 1.0;
    return this.elapsedDays / this.daysCount;
  }

  equals(other: DateRange): boolean {
    return isSameDay(this.start, other.start) && isSameDay(this.end, other.end);
  }

  toString(): string {
    return `DateRange(start: ${this.start.toISOString()}, end: ${this.end.toISOString()})`;
  }
}
