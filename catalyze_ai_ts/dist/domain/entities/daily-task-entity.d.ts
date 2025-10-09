/**
 * ドメイン層 - エンティティ
 *
 * 日次タスクエンティティ
 */
export interface DailyTaskEntityProps {
    id: string;
    planId: string;
    date: Date;
    startUnit: number;
    endUnit: number;
    units: number;
    estimatedDuration: number;
    round?: number;
    advice?: string;
}
/**
 * 日次タスクエンティティ
 *
 * その日に実施すべき学習タスクを表すドメインモデル
 */
export declare class DailyTaskEntity {
    readonly id: string;
    readonly planId: string;
    readonly date: Date;
    readonly startUnit: number;
    readonly endUnit: number;
    readonly units: number;
    readonly estimatedDuration: number;
    readonly round?: number;
    readonly advice?: string;
    constructor(props: DailyTaskEntityProps);
    /**
     * タスクのタイトルを生成
     */
    generateTitle(planTitle: string): string;
    /**
     * 今日のタスクかどうか
     */
    isToday(): boolean;
    /**
     * 過去のタスクかどうか
     */
    isPast(): boolean;
    /**
     * 未来のタスクかどうか
     */
    isFuture(): boolean;
    /**
     * 推定時間（分）
     */
    get estimatedMinutes(): number;
    /**
     * 推定時間（時間）
     */
    get estimatedHours(): number;
    /**
     * タスクが有効かどうか
     */
    validate(): boolean;
}
//# sourceMappingURL=daily-task-entity.d.ts.map