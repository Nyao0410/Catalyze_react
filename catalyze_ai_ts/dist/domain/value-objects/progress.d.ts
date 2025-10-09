/**
 * ドメイン層 - 値オブジェクト
 *
 * 進捗を表す不変の値オブジェクト
 */
export declare class Progress {
    readonly completed: number;
    readonly total: number;
    constructor(completed: number, total: number);
    /**
     * 進捗率 (0.0 ~ 1.0)
     */
    get percentage(): number;
    /**
     * 残り
     */
    get remaining(): number;
    /**
     * 完了したか
     */
    get isComplete(): boolean;
    /**
     * 完了したか（エイリアス）
     */
    get isCompleted(): boolean;
    /**
     * 未着手か
     */
    get isNotStarted(): boolean;
    /**
     * 進行中か
     */
    get isInProgress(): boolean;
    /**
     * 進捗を進める
     */
    advance(amount: number): Progress;
    /**
     * 進捗をリセット
     */
    reset(): Progress;
    /**
     * 総数を変更
     */
    withTotal(newTotal: number): Progress;
    equals(other: Progress): boolean;
    toString(): string;
}
//# sourceMappingURL=progress.d.ts.map