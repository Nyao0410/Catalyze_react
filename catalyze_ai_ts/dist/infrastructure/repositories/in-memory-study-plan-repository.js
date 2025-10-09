"use strict";
/**
 * インフラストラクチャ層 - メモリ実装
 *
 * StudyPlanRepositoryのインメモリ実装（テスト・開発用）
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryStudyPlanRepository = void 0;
const types_1 = require("../../domain/types");
/**
 * メモリ内StudyPlanRepository実装
 *
 * テストや開発環境用のシンプルな実装
 */
class InMemoryStudyPlanRepository {
    constructor() {
        this.plans = new Map();
    }
    async create(plan) {
        this.plans.set(plan.id, plan);
        return plan;
    }
    async update(plan) {
        if (!this.plans.has(plan.id)) {
            throw new Error(`Plan with id ${plan.id} not found`);
        }
        this.plans.set(plan.id, plan);
    }
    async findById(planId) {
        return this.plans.get(planId) ?? null;
    }
    async findByUserId(userId) {
        return Array.from(this.plans.values()).filter((plan) => plan.userId === userId);
    }
    async findActiveByUserId(userId) {
        return Array.from(this.plans.values()).filter((plan) => plan.userId === userId && plan.status === types_1.PlanStatus.ACTIVE);
    }
    async delete(planId) {
        this.plans.delete(planId);
    }
    /**
     * テスト用: 全データクリア
     */
    clear() {
        this.plans.clear();
    }
    /**
     * テスト用: 全データ取得
     */
    getAll() {
        return Array.from(this.plans.values());
    }
}
exports.InMemoryStudyPlanRepository = InMemoryStudyPlanRepository;
//# sourceMappingURL=in-memory-study-plan-repository.js.map