"use strict";
/**
 * インフラストラクチャ層 - メモリ実装
 *
 * StudySessionRepositoryのインメモリ実装（テスト・開発用）
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryStudySessionRepository = void 0;
const date_fns_1 = require("date-fns");
/**
 * メモリ内StudySessionRepository実装
 */
class InMemoryStudySessionRepository {
    constructor() {
        this.sessions = new Map();
    }
    async create(session) {
        this.sessions.set(session.id, session);
        return session;
    }
    async update(session) {
        if (!this.sessions.has(session.id)) {
            throw new Error(`Session with id ${session.id} not found`);
        }
        this.sessions.set(session.id, session);
    }
    async findById(sessionId) {
        return this.sessions.get(sessionId) ?? null;
    }
    async findByPlanId(planId) {
        return Array.from(this.sessions.values())
            .filter((session) => session.planId === planId)
            .sort((a, b) => b.date.getTime() - a.date.getTime());
    }
    async findByPlanIdUntilYesterday(planId) {
        const yesterday = (0, date_fns_1.endOfDay)((0, date_fns_1.subDays)(new Date(), 1));
        return Array.from(this.sessions.values())
            .filter((session) => session.planId === planId && session.date <= yesterday)
            .sort((a, b) => b.date.getTime() - a.date.getTime());
    }
    async findByUserIdAndDateRange(userId, startDate, endDate) {
        const start = (0, date_fns_1.startOfDay)(startDate);
        const end = (0, date_fns_1.endOfDay)(endDate);
        return Array.from(this.sessions.values())
            .filter((session) => session.userId === userId && session.date >= start && session.date <= end)
            .sort((a, b) => b.date.getTime() - a.date.getTime());
    }
    async delete(sessionId) {
        this.sessions.delete(sessionId);
    }
    /**
     * テスト用: 全データクリア
     */
    clear() {
        this.sessions.clear();
    }
    /**
     * テスト用: 全データ取得
     */
    getAll() {
        return Array.from(this.sessions.values());
    }
}
exports.InMemoryStudySessionRepository = InMemoryStudySessionRepository;
//# sourceMappingURL=in-memory-study-session-repository.js.map