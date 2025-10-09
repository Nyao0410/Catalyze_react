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
    concentration: number;
    difficulty: number;
    round?: number;
}
/**
 * 学習セッションエンティティ
 *
 * ユーザーの1回の学習記録を表すドメインモデル
 */
export declare class StudySessionEntity {
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
    constructor(props: StudySessionEntityProps);
    /**
     * パフォーマンス指標を取得
     */
    get performanceMetrics(): PerformanceMetrics;
    /**
     * 単元あたりの平均時間（分）
     */
    get averageTimePerUnit(): number;
    /**
     * パフォーマンス係数
     */
    get performanceFactor(): number;
    /**
     * 効率スコア
     */
    get efficiencyScore(): number;
    /**
     * 学習品質レベル
     */
    get qualityLevel(): QualityLevel;
    /**
     * 高品質な学習だったか
     */
    get isHighQuality(): boolean;
    /**
     * 改善が必要な学習だったか
     */
    get needsImprovement(): boolean;
    /**
     * セッションが有効かどうか
     */
    validate(): boolean;
}
//# sourceMappingURL=study-session-entity.d.ts.map