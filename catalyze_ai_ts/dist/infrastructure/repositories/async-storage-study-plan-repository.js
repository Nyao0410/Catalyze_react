"use strict";
/**
 * AsyncStorage-backed StudyPlanRepository
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsyncStorageStudyPlanRepository = void 0;
const async_storage_1 = __importDefault(require("@react-native-async-storage/async-storage"));
const types_1 = require("../../domain/types");
const STORAGE_KEY = '@catalyze:studyPlans';
class AsyncStorageStudyPlanRepository {
    async _loadAll() {
        const data = await async_storage_1.default.getItem(STORAGE_KEY);
        if (!data)
            return [];
        const parsed = JSON.parse(data);
        return parsed.map((p) => ({
            ...p,
            createdAt: new Date(p.createdAt),
            updatedAt: new Date(p.updatedAt),
            deadline: p.deadline ? new Date(p.deadline) : undefined,
        }));
    }
    async _saveAll(plans) {
        await async_storage_1.default.setItem(STORAGE_KEY, JSON.stringify(plans));
    }
    async create(plan) {
        const plans = await this._loadAll();
        plans.push(plan);
        await this._saveAll(plans);
        return plan;
    }
    async update(plan) {
        const plans = await this._loadAll();
        const idx = plans.findIndex((p) => p.id === plan.id);
        if (idx === -1)
            throw new Error(`Plan with id ${plan.id} not found`);
        plans[idx] = plan;
        await this._saveAll(plans);
    }
    async findById(planId) {
        const plans = await this._loadAll();
        return plans.find((p) => p.id === planId) ?? null;
    }
    async findByUserId(userId) {
        const plans = await this._loadAll();
        return plans.filter((p) => p.userId === userId);
    }
    async findActiveByUserId(userId) {
        const plans = await this._loadAll();
        return plans.filter((p) => p.userId === userId && p.status === types_1.PlanStatus.ACTIVE);
    }
    async delete(planId) {
        const plans = await this._loadAll();
        const updated = plans.filter((p) => p.id !== planId);
        await this._saveAll(updated);
    }
    // test helper
    async clear() {
        await async_storage_1.default.removeItem(STORAGE_KEY);
    }
}
exports.AsyncStorageStudyPlanRepository = AsyncStorageStudyPlanRepository;
//# sourceMappingURL=async-storage-study-plan-repository.js.map