"use strict";
/**
 * ドメイン層 - エンティティ
 *
 * 日次タスクエンティティ
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DailyTaskEntity = void 0;
const date_fns_1 = require("date-fns");
/**
 * 日次タスクエンティティ
 *
 * その日に実施すべき学習タスクを表すドメインモデル
 */
class DailyTaskEntity {
    constructor(props) {
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
    generateTitle(planTitle) {
        if (this.round && this.round > 1) {
            return `${planTitle} (R${this.round}) U${this.startUnit}-${this.endUnit}`;
        }
        return `${planTitle} U${this.startUnit}-${this.endUnit}`;
    }
    /**
     * 今日のタスクかどうか
     */
    isToday() {
        const today = (0, date_fns_1.startOfDay)(new Date());
        const taskDate = (0, date_fns_1.startOfDay)(this.date);
        return (0, date_fns_1.isSameDay)(today, taskDate);
    }
    /**
     * 過去のタスクかどうか
     */
    isPast() {
        const today = (0, date_fns_1.startOfDay)(new Date());
        const taskDate = (0, date_fns_1.startOfDay)(this.date);
        return (0, date_fns_1.isBefore)(taskDate, today);
    }
    /**
     * 未来のタスクかどうか
     */
    isFuture() {
        const today = (0, date_fns_1.startOfDay)(new Date());
        const taskDate = (0, date_fns_1.startOfDay)(this.date);
        return (0, date_fns_1.isAfter)(taskDate, today);
    }
    /**
     * 推定時間（分）
     */
    get estimatedMinutes() {
        return Math.floor(this.estimatedDuration / (1000 * 60));
    }
    /**
     * 推定時間（時間）
     */
    get estimatedHours() {
        return this.estimatedMinutes / 60.0;
    }
    /**
     * タスクが有効かどうか
     */
    validate() {
        if (this.units <= 0)
            return false;
        if (this.startUnit <= 0)
            return false;
        if (this.endUnit < this.startUnit)
            return false;
        if (this.endUnit - this.startUnit + 1 !== this.units)
            return false;
        if (this.estimatedDuration < 0)
            return false;
        return true;
    }
}
exports.DailyTaskEntity = DailyTaskEntity;
//# sourceMappingURL=daily-task-entity.js.map