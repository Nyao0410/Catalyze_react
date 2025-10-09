/**
 * ドメイン層 - 値オブジェクト
 *
 * 日付範囲を表す不変の値オブジェクト
 */
export declare class DateRange {
    readonly start: Date;
    readonly end: Date;
    constructor(start: Date, end: Date);
    /**
     * 期間の日数を取得
     */
    get daysCount(): number;
    /**
     * 今日が範囲内かどうか
     */
    containsToday(): boolean;
    /**
     * 指定された日付が範囲内かどうか
     */
    contains(date: Date): boolean;
    /**
     * 残り日数を取得
     */
    get remainingDays(): number;
    /**
     * 経過日数を取得
     */
    get elapsedDays(): number;
    /**
     * 進捗率を取得 (0.0 ~ 1.0)
     */
    get progressRatio(): number;
    equals(other: DateRange): boolean;
    toString(): string;
}
//# sourceMappingURL=date-range.d.ts.map