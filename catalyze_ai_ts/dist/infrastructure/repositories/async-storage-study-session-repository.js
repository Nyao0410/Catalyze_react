"use strict";
/**
 * AsyncStorage-backed StudySessionRepository
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsyncStorageStudySessionRepository = void 0;
const async_storage_1 = __importDefault(require("@react-native-async-storage/async-storage"));
const date_fns_1 = require("date-fns");
const STORAGE_KEY = '@catalyze:studySessions';
class AsyncStorageStudySessionRepository {
    async _loadAll() {
        const data = await async_storage_1.default.getItem(STORAGE_KEY);
        if (!data)
            return [];
        const parsed = JSON.parse(data);
        return parsed.map((s) => ({ ...s, date: new Date(s.date) }));
    }
    async _saveAll(sessions) {
        await async_storage_1.default.setItem(STORAGE_KEY, JSON.stringify(sessions));
    }
    async create(session) {
        const sessions = await this._loadAll();
        sessions.push(session);
        await this._saveAll(sessions);
        return session;
    }
    async update(session) {
        const sessions = await this._loadAll();
        const idx = sessions.findIndex((s) => s.id === session.id);
        if (idx === -1)
            throw new Error(`Session with id ${session.id} not found`);
        sessions[idx] = session;
        await this._saveAll(sessions);
    }
    async findById(sessionId) {
        const sessions = await this._loadAll();
        return sessions.find((s) => s.id === sessionId) ?? null;
    }
    async findByPlanId(planId) {
        const sessions = await this._loadAll();
        return sessions.filter((s) => s.planId === planId).sort((a, b) => b.date.getTime() - a.date.getTime());
    }
    async findByPlanIdUntilYesterday(planId) {
        const sessions = await this._loadAll();
        const yesterday = (0, date_fns_1.endOfDay)(new Date(Date.now() - 24 * 60 * 60 * 1000));
        return sessions.filter((s) => s.planId === planId && s.date <= yesterday).sort((a, b) => b.date.getTime() - a.date.getTime());
    }
    async findByUserIdAndDateRange(userId, startDate, endDate) {
        const sessions = await this._loadAll();
        const start = (0, date_fns_1.startOfDay)(startDate);
        const end = (0, date_fns_1.endOfDay)(endDate);
        return sessions.filter((s) => s.userId === userId && s.date >= start && s.date <= end).sort((a, b) => b.date.getTime() - a.date.getTime());
    }
    async delete(sessionId) {
        const sessions = await this._loadAll();
        const updated = sessions.filter((s) => s.id !== sessionId);
        await this._saveAll(updated);
    }
    // test helper
    async clear() {
        await async_storage_1.default.removeItem(STORAGE_KEY);
    }
}
exports.AsyncStorageStudySessionRepository = AsyncStorageStudySessionRepository;
//# sourceMappingURL=async-storage-study-session-repository.js.map