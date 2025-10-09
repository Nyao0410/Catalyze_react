"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewPlanningOrchestrator = void 0;
const dynamic_quota_calculator_1 = require("./dynamic-quota-calculator");
const multi_round_planner_1 = require("./multi-round-planner");
const daily_task_entity_1 = require("../domain/entities/daily-task-entity");
const date_fns_1 = require("date-fns");
/**
 * NewPlanningOrchestrator
 * より明確で堅牢な日次割当ロジックを提供するオーケストレータ
 */
class NewPlanningOrchestrator {
    constructor() {
        this.quotaCalc = new dynamic_quota_calculator_1.DynamicQuotaCalculator();
        this.planner = new multi_round_planner_1.MultiRoundPlanner();
    }
    generatePlan(plan, sessions, _reviewItems = [], dailyQuotaOverride) {
        const quota = this.quotaCalc.calculate(plan, sessions);
        const usedDailyQuota = typeof dailyQuotaOverride === 'number' ? dailyQuotaOverride : quota.recommendedDailyQuota;
        // generate roundTasks (reuse existing simple logic)
        const roundTasks = this._generateRoundTasks(plan, sessions);
        const dailyTasks = this._allocate(plan, sessions, roundTasks, quota.adjustedTimePerUnitMs, usedDailyQuota);
        return {
            dailyTasks,
            roundTasks,
            dailyQuota: usedDailyQuota,
            provisionalDeadline: quota.provisionalDeadline,
        };
    }
    _generateRoundTasks(plan, sessions) {
        const rangeStart = plan.unitRange?.start ?? 1;
        const rangeEnd = plan.unitRange?.end ?? plan.totalUnits;
        const rangeTotal = rangeEnd - rangeStart + 1;
        const firstRoundCompleted = sessions.filter((s) => s.round === 1).reduce((sum, s) => sum + s.unitsCompleted, 0);
        if (firstRoundCompleted >= rangeTotal && plan.targetRounds > 1) {
            const generated = this.planner.generateRoundTasks(rangeTotal, plan.targetRounds);
            return generated.map((rt) => ({ ...rt, startUnit: rt.startUnit + (rangeStart - 1), endUnit: rt.endUnit + (rangeStart - 1) }));
        }
        return [{ round: 1, startUnit: rangeStart, endUnit: rangeEnd, units: rangeTotal }];
    }
    _allocate(plan, sessions, roundTasks, adjustedTimePerUnitMs, usedDailyQuota) {
        const tasks = [];
        const today = (0, date_fns_1.startOfDay)(new Date());
        // build remaining units across roundTasks considering completed sessions
        const totalCompletedUnits = sessions.reduce((s, v) => s + v.unitsCompleted, 0);
        // flatten remaining range list (start,end,round) in order
        const remainingRanges = [];
        for (const rt of roundTasks) {
            remainingRanges.push({ round: rt.round, start: rt.startUnit, end: rt.endUnit, units: rt.endUnit - rt.startUnit + 1 });
        }
        // consume completed units from the front
        let completed = totalCompletedUnits;
        while (completed > 0 && remainingRanges.length > 0) {
            const head = remainingRanges[0];
            if (completed >= head.units) {
                completed -= head.units;
                remainingRanges.shift();
            }
            else {
                // shrink head
                head.start += completed;
                head.units -= completed;
                completed = 0;
            }
        }
        if (remainingRanges.length === 0)
            return tasks;
        // compute total remaining units
        let totalRemainingUnits = remainingRanges.reduce((a, b) => a + b.units, 0);
        // compute study dates
        const deadlineDay = (0, date_fns_1.startOfDay)(plan.dynamicDeadline ?? plan.deadline);
        const studyDates = [];
        let cursor = today;
        while (cursor <= deadlineDay) {
            const jsDay = cursor.getDay();
            const weekday = jsDay === 0 ? 7 : jsDay;
            if (plan.isStudyDay(weekday))
                studyDates.push(cursor);
            cursor = (0, date_fns_1.addDays)(cursor, 1);
            if (studyDates.length > 365)
                break;
        }
        if (studyDates.length === 0) {
            cursor = today;
            for (let i = 0; i < 30; i++) {
                studyDates.push(cursor);
                cursor = (0, date_fns_1.addDays)(cursor, 1);
            }
        }
        const daysCount = studyDates.length;
        // per-day target: ensure we meet both quota and deadline
        const perDayFromRemaining = Math.ceil(totalRemainingUnits / daysCount);
        const perDayMin = Math.max(Math.ceil(usedDailyQuota || 0), perDayFromRemaining);
        // allocate sequentially, one DailyTask per studyDate, consuming ranges
        let rangeIndex = 0;
        for (let d = 0; d < daysCount && totalRemainingUnits > 0 && rangeIndex < remainingRanges.length; d++) {
            const assignDate = studyDates[d];
            let toAssign = Math.min(perDayMin, totalRemainingUnits);
            // start from current rangeIndex and consume until toAssign is zero
            let dayStart = null;
            let dayEnd = null;
            let dayUnits = 0;
            while (toAssign > 0 && rangeIndex < remainingRanges.length) {
                const rng = remainingRanges[rangeIndex];
                const take = Math.min(toAssign, rng.units);
                const segStart = rng.start;
                const segEnd = rng.start + take - 1;
                if (dayStart === null)
                    dayStart = segStart;
                dayEnd = segEnd;
                dayUnits += take;
                // advance range
                rng.start += take;
                rng.units -= take;
                if (rng.units <= 0)
                    rangeIndex++;
                toAssign -= take;
                totalRemainingUnits -= take;
            }
            if (dayUnits > 0 && dayStart !== null && dayEnd !== null) {
                tasks.push(new daily_task_entity_1.DailyTaskEntity({
                    id: `${plan.id}-${assignDate.toISOString().slice(0, 10)}-r${remainingRanges[Math.max(0, rangeIndex - 1)]?.round ?? remainingRanges[0].round}`,
                    planId: plan.id,
                    date: assignDate,
                    startUnit: dayStart,
                    endUnit: dayEnd,
                    units: dayUnits,
                    estimatedDuration: adjustedTimePerUnitMs * dayUnits,
                    round: remainingRanges[Math.max(0, rangeIndex - 1)]?.round ?? remainingRanges[0].round,
                    advice: '頑張りましょう！',
                }));
            }
        }
        // if any totalRemainingUnits remain (shouldn't happen), append them to the last study day
        if (totalRemainingUnits > 0) {
            const lastDate = studyDates[studyDates.length - 1];
            const lastStart = remainingRanges[remainingRanges.length - 1].start;
            const lastEnd = remainingRanges[remainingRanges.length - 1].end;
            tasks.push(new daily_task_entity_1.DailyTaskEntity({
                id: `${plan.id}-${lastDate.toISOString().slice(0, 10)}-r${remainingRanges[remainingRanges.length - 1].round}`,
                planId: plan.id,
                date: lastDate,
                startUnit: lastStart,
                endUnit: lastEnd,
                units: remainingRanges[remainingRanges.length - 1].units,
                estimatedDuration: adjustedTimePerUnitMs * remainingRanges[remainingRanges.length - 1].units,
                round: remainingRanges[remainingRanges.length - 1].round,
                advice: '締切に間に合わせましょう',
            }));
        }
        // debug
        try {
            // eslint-disable-next-line no-console
            console.log('[NewOrchestrator] plan', { planId: plan.id, totalRemainingUnits });
        }
        catch (e) { }
        return tasks;
    }
}
exports.NewPlanningOrchestrator = NewPlanningOrchestrator;
//# sourceMappingURL=new-planning-orchestrator.js.map