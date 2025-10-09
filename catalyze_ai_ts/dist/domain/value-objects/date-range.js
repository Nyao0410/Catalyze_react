"use strict";
/**
 * ドメイン層 - 値オブジェクト
 *
 * 日付範囲を表す不変の値オブジェクト
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateRange = void 0;
const date_fns_1 = require("date-fns");
class DateRange {
    constructor(start, end) {
        this.start = (0, date_fns_1.startOfDay)(start);
        this.end = (0, date_fns_1.startOfDay)(end);
        if ((0, date_fns_1.isAfter)(this.start, this.end)) {
            throw new Error('Start date must be before or equal to end date');
        }
    }
    /**
     * 期間の日数を取得
     */
    get daysCount() {
        return (0, date_fns_1.differenceInDays)(this.end, this.start) + 1;
    }
    /**
     * 今日が範囲内かどうか
     */
    containsToday() {
        const today = (0, date_fns_1.startOfDay)(new Date());
        return this.contains(today);
    }
    /**
     * 指定された日付が範囲内かどうか
     */
    contains(date) {
        const dateOnly = (0, date_fns_1.startOfDay)(date);
        return (((0, date_fns_1.isSameDay)(dateOnly, this.start) || (0, date_fns_1.isAfter)(dateOnly, this.start)) &&
            ((0, date_fns_1.isSameDay)(dateOnly, this.end) || (0, date_fns_1.isBefore)(dateOnly, this.end)));
    }
    /**
     * 残り日数を取得
     */
    get remainingDays() {
        const today = (0, date_fns_1.startOfDay)(new Date());
        if ((0, date_fns_1.isAfter)(today, this.end))
            return 0;
        return (0, date_fns_1.differenceInDays)(this.end, today) + 1;
    }
    /**
     * 経過日数を取得
     */
    get elapsedDays() {
        const today = (0, date_fns_1.startOfDay)(new Date());
        if ((0, date_fns_1.isBefore)(today, this.start))
            return 0;
        if ((0, date_fns_1.isAfter)(today, this.end))
            return this.daysCount;
        return (0, date_fns_1.differenceInDays)(today, this.start) + 1;
    }
    /**
     * 進捗率を取得 (0.0 ~ 1.0)
     */
    get progressRatio() {
        if (this.daysCount === 0)
            return 1.0;
        return this.elapsedDays / this.daysCount;
    }
    equals(other) {
        return (0, date_fns_1.isSameDay)(this.start, other.start) && (0, date_fns_1.isSameDay)(this.end, other.end);
    }
    toString() {
        return `DateRange(start: ${this.start.toISOString()}, end: ${this.end.toISOString()})`;
    }
}
exports.DateRange = DateRange;
//# sourceMappingURL=date-range.js.map