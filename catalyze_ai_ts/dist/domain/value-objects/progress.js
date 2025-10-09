"use strict";
/**
 * ドメイン層 - 値オブジェクト
 *
 * 進捗を表す不変の値オブジェクト
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Progress = void 0;
class Progress {
    constructor(completed, total) {
        if (completed < 0) {
            throw new Error('Completed must be non-negative');
        }
        if (total <= 0) {
            throw new Error('Total must be positive');
        }
        if (completed > total) {
            throw new Error('Completed cannot exceed total');
        }
        this.completed = completed;
        this.total = total;
    }
    /**
     * 進捗率 (0.0 ~ 1.0)
     */
    get percentage() {
        return this.total > 0 ? this.completed / this.total : 0.0;
    }
    /**
     * 残り
     */
    get remaining() {
        return this.total - this.completed;
    }
    /**
     * 完了したか
     */
    get isComplete() {
        return this.completed >= this.total;
    }
    /**
     * 完了したか（エイリアス）
     */
    get isCompleted() {
        return this.isComplete;
    }
    /**
     * 未着手か
     */
    get isNotStarted() {
        return this.completed === 0;
    }
    /**
     * 進行中か
     */
    get isInProgress() {
        return this.completed > 0 && this.completed < this.total;
    }
    /**
     * 進捗を進める
     */
    advance(amount) {
        const newCompleted = Math.max(0, Math.min(this.total, this.completed + amount));
        return new Progress(newCompleted, this.total);
    }
    /**
     * 進捗をリセット
     */
    reset() {
        return new Progress(0, this.total);
    }
    /**
     * 総数を変更
     */
    withTotal(newTotal) {
        const newCompleted = Math.max(0, Math.min(newTotal, this.completed));
        return new Progress(newCompleted, newTotal);
    }
    equals(other) {
        return this.completed === other.completed && this.total === other.total;
    }
    toString() {
        return `Progress(${this.completed}/${this.total} = ${(this.percentage * 100).toFixed(1)}%)`;
    }
}
exports.Progress = Progress;
//# sourceMappingURL=progress.js.map