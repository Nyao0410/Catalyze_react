/**
 * ドメイン層 - エンティティ
 *
 * 復習項目エンティティ - SM-2アルゴリズムに基づく復習スケジュール管理
 */
export interface ReviewItemEntityProps {
    id: string;
    userId: string;
    planId: string;
    unitNumber: number;
    lastReviewDate: Date;
    nextReviewDate: Date;
    easeFactor?: number;
    repetitions?: number;
    intervalDays?: number;
}
/**
 * 復習項目エンティティ
 *
 * SM-2アルゴリズムに基づく復習スケジュール管理
 */
export declare class ReviewItemEntity {
    readonly id: string;
    readonly userId: string;
    readonly planId: string;
    readonly unitNumber: number;
    readonly lastReviewDate: Date;
    readonly nextReviewDate: Date;
    readonly easeFactor: number;
    readonly repetitions: number;
    readonly intervalDays: number;
    constructor(props: ReviewItemEntityProps);
    /**
     * 次回復習までの日数
     */
    get daysUntilNextReview(): number;
    /**
     * 復習期限が過ぎているか
     */
    get isOverdue(): boolean;
    /**
     * 今日復習すべきか
     */
    get isDueToday(): boolean;
    /**
     * 復習実施後の更新（SM-2アルゴリズム）
     *
     * @param quality - 回答品質（0-5、3以上で成功）
     */
    recordReview(quality: number): ReviewItemEntity;
    /**
     * 新しい容易度係数を計算（SM-2アルゴリズム）
     */
    private calculateNewEaseFactor;
    /**
     * 新しい間隔を計算（SM-2アルゴリズム）
     */
    private calculateNewInterval;
    /**
     * 復習をリセット（最初からやり直し）
     */
    reset(): ReviewItemEntity;
    /**
     * バリデーション
     */
    validate(): boolean;
    /**
     * プロパティを取得
     */
    private toProps;
}
//# sourceMappingURL=review-item-entity.d.ts.map