/**
 * ドメイン層 - 値オブジェクト
 *
 * 学習パフォーマンス指標を表す不変の値オブジェクト
 */
/**
 * 学習品質レベル
 */
export declare enum QualityLevel {
    EXCELLENT = "excellent",// 優秀
    GOOD = "good",// 良好
    FAIR = "fair",// 普通
    POOR = "poor"
}
export declare class PerformanceMetrics {
    static readonly MAX_DIFFICULTY = 5;
    static readonly QUALITY_THRESHOLDS: {
        readonly EXCELLENT: 0.85;
        readonly GOOD: 0.65;
        readonly FAIR: 0.4;
    };
    /** 集中度 (0.0 ~ 1.0) */
    readonly concentration: number;
    /** 難易度 (1 ~ 5) */
    readonly difficulty: number;
    /** 学習時間（分） */
    readonly durationMinutes: number;
    /** 完了単元数 */
    readonly unitsCompleted: number;
    constructor(concentration: number, difficulty: number, durationMinutes: number, unitsCompleted: number);
    /**
     * パフォーマンス係数を計算 (0.0 ~ 1.0)
     * 高いほど良いパフォーマンス
     * 新仕様 (案 B): difficulty と concentration を乗算して正規化
     * 公式: performanceFactor = (concentration * difficulty) / MAX_DIFFICULTY
     * - difficulty=5, concentration=1.0 → 1.0
     * - difficulty=3, concentration=1.0 → 0.6
     * - difficulty=1, concentration=1.0 → 0.2
     */
    get performanceFactor(): number;
    /**
     * 単元あたりの平均時間（分）
     */
    get averageTimePerUnit(): number;
    /**
     * 効率スコア (高いほど効率的)
     * パフォーマンス係数 × 完了速度
     */
    get efficiencyScore(): number;
    /**
     * 学習品質レベル
     */
    get qualityLevel(): QualityLevel;
    equals(other: PerformanceMetrics): boolean;
    toString(): string;
}
//# sourceMappingURL=performance-metrics.d.ts.map