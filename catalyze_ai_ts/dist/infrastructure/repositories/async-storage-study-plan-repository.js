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
const study_plan_entity_1 = require("../../domain/entities/study-plan-entity");
const types_1 = require("../../domain/types");
const STORAGE_KEY = '@catalyze:studyPlans';
class AsyncStorageStudyPlanRepository {
    async _loadAll() {
        const data = await async_storage_1.default.getItem(STORAGE_KEY);
        if (!data)
            return [];
        const parsed = JSON.parse(data);
        return parsed.map((p) => new study_plan_entity_1.StudyPlanEntity({
            id: p.id,
            userId: p.userId,
            title: p.title,
            totalUnits: p.totalUnits,
            unit: p.unit,
            unitRange: p.unitRange,
            createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
            deadline: p.deadline ? new Date(p.deadline) : new Date(),
            rounds: p.rounds,
            targetRounds: p.targetRounds,
            estimatedTimePerUnit: p.estimatedTimePerUnit ?? 0,
            difficulty: p.difficulty,
            studyDays: p.studyDays,
            status: p.status,
            dailyQuota: p.dailyQuota,
            dynamicDeadline: p.dynamicDeadline ? new Date(p.dynamicDeadline) : undefined,
        }));
    }
    async _saveAll(plans) {
        // Minimal persistence log to help debug save behavior. Keep concise for easy filtering.
        try {
            // eslint-disable-next-line no-console
            console.debug(`[PERSIST/PLAN] saving ${plans.length} plans, firstId=${plans.length > 0 ? plans[0].id : 'none'}`);
        }
        catch (e) {
            // ignore logging errors
        }
        await async_storage_1.default.setItem(STORAGE_KEY, JSON.stringify(plans));
    }
    async create(plan) {
        const plans = await this._loadAll();
        const idx = plans.findIndex((p) => p.id === plan.id);
        if (idx === -1) {
            plans.push(plan);
        }
        else {
            plans[idx] = plan; // upsert: replace existing
        }
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