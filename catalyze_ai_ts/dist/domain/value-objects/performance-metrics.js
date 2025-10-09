"use strict";
/**
 * ドメイン層 - 値オブジェクト
 *
 * 学習パフォーマンス指標を表す不変の値オブジェクト
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceMetrics = exports.QualityLevel = void 0;
/**
 * 学習品質レベル
 */
var QualityLevel;
(function (QualityLevel) {
    QualityLevel["EXCELLENT"] = "excellent";
    QualityLevel["GOOD"] = "good";
    QualityLevel["FAIR"] = "fair";
    QualityLevel["POOR"] = "poor";
})(QualityLevel || (exports.QualityLevel = QualityLevel = {}));
class PerformanceMetrics {
    constructor(concentration, difficulty, durationMinutes, unitsCompleted) {
        if (concentration < 0.0 || concentration > 1.0) {
            throw new Error('Concentration must be between 0.0 and 1.0');
        }
        if (difficulty < 1 || difficulty > 5) {
            throw new Error('Difficulty must be between 1 and 5');
        }
        if (durationMinutes < 0) {
            throw new Error('Duration must be non-negative');
        }
        if (unitsCompleted < 0) {
            throw new Error('Units completed must be non-negative');
        }
        this.concentration = concentration;
        this.difficulty = difficulty;
        this.durationMinutes = durationMinutes;
        this.unitsCompleted = unitsCompleted;
    }
    /**
     * パフォーマンス係数を計算 (0.0 ~ 1.0)
     * 高いほど良いパフォーマンス
     * 新仕様 (案 B): difficulty と concentration を乗算して正規化
     * 公式: performanceFactor = (concentration * difficulty) / MAX_DIFFICULTY
     * - difficulty=5, concentration=1.0 → 1.0
     * - difficulty=3, concentration=1.0 → 0.6
     * - difficulty=1, concentration=1.0 → 0.2
     */
    get performanceFactor() {
        const raw = this.concentration * this.difficulty;
        return Math.max(0, Math.min(1, raw / PerformanceMetrics.MAX_DIFFICULTY));
    }
    /**
     * 単元あたりの平均時間（分）
     */
    get averageTimePerUnit() {
        return this.unitsCompleted > 0 ? this.durationMinutes / this.unitsCompleted : 0.0;
    }
    /**
     * 効率スコア (高いほど効率的)
     * パフォーマンス係数 × 完了速度
     */
    get efficiencyScore() {
        if (this.durationMinutes === 0)
            return 0.0;
        const unitsPerHour = (this.unitsCompleted / this.durationMinutes) * 60;
        return this.performanceFactor * unitsPerHour;
    }
    /**
     * 学習品質レベル
     */
    get qualityLevel() {
        if (this.performanceFactor >= PerformanceMetrics.QUALITY_THRESHOLDS.EXCELLENT)
            return QualityLevel.EXCELLENT;
        if (this.performanceFactor >= PerformanceMetrics.QUALITY_THRESHOLDS.GOOD)
            return QualityLevel.GOOD;
        if (this.performanceFactor >= PerformanceMetrics.QUALITY_THRESHOLDS.FAIR)
            return QualityLevel.FAIR;
        return QualityLevel.POOR;
    }
    equals(other) {
        return (this.concentration === other.concentration &&
            this.difficulty === other.difficulty &&
            this.durationMinutes === other.durationMinutes &&
            this.unitsCompleted === other.unitsCompleted);
    }
    toString() {
        return (`PerformanceMetrics(concentration: ${this.concentration}, difficulty: ${this.difficulty}, ` +
            `duration: ${this.durationMinutes}min, units: ${this.unitsCompleted}, ` +
            `factor: ${this.performanceFactor.toFixed(3)})`);
    }
}
exports.PerformanceMetrics = PerformanceMetrics;
// --- Tunable constants ---
// Maximum difficulty value in the system (difficulty is 1..5)
PerformanceMetrics.MAX_DIFFICULTY = 5;
// Quality level thresholds (adjustable)
PerformanceMetrics.QUALITY_THRESHOLDS = {
    EXCELLENT: 0.85,
    GOOD: 0.65,
    FAIR: 0.4,
};
//# sourceMappingURL=performance-metrics.js.map