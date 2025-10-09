"use strict";
/**
 * AsyncStorage-backed ReviewItemRepository
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsyncStorageReviewItemRepository = void 0;
const async_storage_1 = __importDefault(require("@react-native-async-storage/async-storage"));
const date_fns_1 = require("date-fns");
const STORAGE_KEY = '@catalyze:reviewItems';
class AsyncStorageReviewItemRepository {
    async _loadAll() {
        const data = await async_storage_1.default.getItem(STORAGE_KEY);
        if (!data)
            return [];
        const parsed = JSON.parse(data);
        return parsed.map((r) => ({ ...r, lastReviewDate: r.lastReviewDate ? new Date(r.lastReviewDate) : undefined, nextReviewDate: r.nextReviewDate ? new Date(r.nextReviewDate) : new Date(r.nextReviewDate) }));
    }
    async _saveAll(items) {
        await async_storage_1.default.setItem(STORAGE_KEY, JSON.stringify(items));
    }
    async create(item) {
        const items = await this._loadAll();
        items.push(item);
        await this._saveAll(items);
        return item;
    }
    async update(item) {
        const items = await this._loadAll();
        const idx = items.findIndex((i) => i.id === item.id);
        if (idx === -1)
            throw new Error(`ReviewItem with id ${item.id} not found`);
        items[idx] = item;
        await this._saveAll(items);
    }
    async findById(itemId) {
        const items = await this._loadAll();
        return items.find((i) => i.id === itemId) ?? null;
    }
    async findByPlanId(planId) {
        const items = await this._loadAll();
        return items.filter((i) => i.planId === planId).sort((a, b) => a.nextReviewDate.getTime() - b.nextReviewDate.getTime());
    }
    async findDueToday(userId) {
        const items = await this._loadAll();
        const today = (0, date_fns_1.endOfDay)(new Date());
        return items.filter((i) => i.userId === userId && i.nextReviewDate <= today).sort((a, b) => a.nextReviewDate.getTime() - b.nextReviewDate.getTime());
    }
    async findByUserIdAndDateRange(userId, startDate, endDate) {
        const items = await this._loadAll();
        const start = (0, date_fns_1.startOfDay)(startDate);
        const end = (0, date_fns_1.endOfDay)(endDate);
        return items.filter((i) => i.userId === userId && i.nextReviewDate >= start && i.nextReviewDate <= end).sort((a, b) => a.nextReviewDate.getTime() - b.nextReviewDate.getTime());
    }
    async delete(itemId) {
        const items = await this._loadAll();
        const updated = items.filter((i) => i.id !== itemId);
        await this._saveAll(updated);
    }
    async deleteByPlanId(planId) {
        const items = await this._loadAll();
        const updated = items.filter((i) => i.planId !== planId);
        await this._saveAll(updated);
    }
    // test helper
    async clear() {
        await async_storage_1.default.removeItem(STORAGE_KEY);
    }
}
exports.AsyncStorageReviewItemRepository = AsyncStorageReviewItemRepository;
//# sourceMappingURL=async-storage-review-item-repository.js.map