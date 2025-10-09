"use strict";
/**
 * インフラストラクチャ層 - メモリ実装
 *
 * ReviewItemRepositoryのインメモリ実装（テスト・開発用）
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryReviewItemRepository = void 0;
const date_fns_1 = require("date-fns");
/**
 * メモリ内ReviewItemRepository実装
 */
class InMemoryReviewItemRepository {
    constructor() {
        this.items = new Map();
    }
    async create(item) {
        this.items.set(item.id, item);
        return item;
    }
    async update(item) {
        if (!this.items.has(item.id)) {
            throw new Error(`ReviewItem with id ${item.id} not found`);
        }
        this.items.set(item.id, item);
    }
    async findById(itemId) {
        return this.items.get(itemId) ?? null;
    }
    async findByPlanId(planId) {
        return Array.from(this.items.values())
            .filter((item) => item.planId === planId)
            .sort((a, b) => a.nextReviewDate.getTime() - b.nextReviewDate.getTime());
    }
    async findDueToday(userId) {
        const today = (0, date_fns_1.endOfDay)(new Date());
        return Array.from(this.items.values())
            .filter((item) => item.userId === userId && item.nextReviewDate <= today)
            .sort((a, b) => a.nextReviewDate.getTime() - b.nextReviewDate.getTime());
    }
    async findByUserIdAndDateRange(userId, startDate, endDate) {
        const start = (0, date_fns_1.startOfDay)(startDate);
        const end = (0, date_fns_1.endOfDay)(endDate);
        return Array.from(this.items.values())
            .filter((item) => item.userId === userId &&
            item.nextReviewDate >= start &&
            item.nextReviewDate <= end)
            .sort((a, b) => a.nextReviewDate.getTime() - b.nextReviewDate.getTime());
    }
    async delete(itemId) {
        this.items.delete(itemId);
    }
    async deleteByPlanId(planId) {
        const itemsToDelete = Array.from(this.items.values()).filter((item) => item.planId === planId);
        itemsToDelete.forEach((item) => this.items.delete(item.id));
    }
    /**
     * テスト用: 全データクリア
     */
    clear() {
        this.items.clear();
    }
    /**
     * テスト用: 全データ取得
     */
    getAll() {
        return Array.from(this.items.values());
    }
}
exports.InMemoryReviewItemRepository = InMemoryReviewItemRepository;
//# sourceMappingURL=in-memory-review-item-repository.js.map