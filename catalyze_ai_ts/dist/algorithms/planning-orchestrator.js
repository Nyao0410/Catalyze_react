"use strict";
/**
 * PlanningOrchestrator
 *
 * 動的ノルマ、周回計画、復習スケジュールの出力を統合し、日次タスクリストを生成する統合制御エンジン。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanningOrchestrator = void 0;
const dynamic_quota_calculator_1 = require("./dynamic-quota-calculator");
const multi_round_planner_1 = require("./multi-round-planner");
const daily_task_entity_1 = require("../domain/entities/daily-task-entity");
const date_fns_1 = require("date-fns");
class PlanningOrchestrator {
    constructor() {
        this.quotaCalc = new dynamic_quota_calculator_1.DynamicQuotaCalculator();
        this.planner = new multi_round_planner_1.MultiRoundPlanner();
    }
    /**
     * 本格的な計画生成
     * - 動的ノルマ計算
     * - 周回計画の生成（1周目完了後は苦手分野に焦点）
     * - 復習タスクの統合
     * - 複数日の日次タスクリスト生成
     *
     * @param plan 学習計画
     * @param sessions 学習セッション履歴
     * @param _reviewItems 復習アイテム（今後の拡張用）
     */
    generatePlan(plan, sessions, _reviewItems = [], 
    // 外部から丸め済みの dailyQuota を渡したい場合に使用する（単体テストやサービス側の一貫性確保用）
    dailyQuotaOverride) {
        // 1. 動的ノルマ計算
        const quota = this.quotaCalc.calculate(plan, sessions);
        // debug: log plan/quota summary
        // eslint-disable-next-line no-console
        console.log(`[Orchestrator] generatePlan planId=${plan.id} totalUnits=${plan.totalUnits} deadline=${plan.deadline?.toISOString()} recommendedDailyQuota=${quota.recommendedDailyQuota} adjustedTimePerUnitMs=${quota.adjustedTimePerUnitMs}`);
        // 使用する dailyQuota を決定（外部オーバーライドがあればそれを優先）
        const usedDailyQuota = typeof dailyQuotaOverride === 'number' ? dailyQuotaOverride : quota.recommendedDailyQuota;
        // 2. 周回計画の生成
        const roundTasks = this._generateRoundTasks(plan, sessions);
        // eslint-disable-next-line no-console
        console.log(`[Orchestrator] roundTasks count=${roundTasks.length} sample=${JSON.stringify(roundTasks.slice(0, 3))}`);
        // 3. 日次タスクの割り当て
        const dailyTasks = this._allocateDailyTasks(plan, sessions, roundTasks, quota.adjustedTimePerUnitMs, usedDailyQuota);
        // eslint-disable-next-line no-console
        console.log(`[Orchestrator] dailyTasks count=${dailyTasks.length} sample=${JSON.stringify(dailyTasks.slice(0, 5).map(d => ({ date: d.date.toISOString().slice(0, 10), start: d.startUnit, end: d.endUnit, units: d.units, round: d.round })))}`);
        return {
            dailyTasks,
            roundTasks,
            dailyQuota: usedDailyQuota,
            provisionalDeadline: quota.provisionalDeadline,
        };
    }
    /**
     * 周回計画の生成
     */
    _generateRoundTasks(plan, sessions) {
        // determine explicit unit range for the plan
        const rangeStart = plan.unitRange?.start ?? 1;
        const rangeEnd = plan.unitRange?.end ?? plan.totalUnits;
        const rangeTotal = rangeEnd - rangeStart + 1;
        // 1周目が完了しているかチェック（range に対する完了数で判定）
        const firstRoundCompleted = sessions
            .filter((s) => s.round === 1)
            .reduce((sum, s) => sum + s.unitsCompleted, 0);
        if (firstRoundCompleted >= rangeTotal && plan.targetRounds > 1) {
            // 1周目完了: 全範囲を周回学習
            const generated = this.planner.generateRoundTasks(rangeTotal, plan.targetRounds);
            return generated.map((rt) => ({
                ...rt,
                startUnit: rt.startUnit + (rangeStart - 1),
                endUnit: rt.endUnit + (rangeStart - 1),
            }));
        }
        else {
            // 1周目進行中: 指定された range をカバーする1周目タスクを返す
            return [
                {
                    round: 1,
                    startUnit: rangeStart,
                    endUnit: rangeEnd,
                    units: rangeTotal,
                },
            ];
        }
    }
    /**
     * 日次タスクの割り当て
     */
    _allocateDailyTasks(plan, sessions, roundTasks, adjustedTimePerUnitMs, usedDailyQuota) {
        const tasks = [];
        const today = (0, date_fns_1.startOfDay)(new Date());
        // dailyQuota may be a float from the quota calculator; rounding is handled later via distribution
        // determine explicit unit range for the plan
        const rangeStart = plan.unitRange?.start ?? 1;
        const rangeEnd = plan.unitRange?.end ?? plan.totalUnits;
        // 現在の進捗を計算（全roundの合計）
        const totalCompletedUnits = sessions.reduce((sum, s) => sum + s.unitsCompleted, 0);
        // Find first incomplete task across roundTasks in order and compute remainingUnitsInCurrentTask
        let completed = totalCompletedUnits;
        let firstIncompleteIndex = 0;
        let remainingUnitsInCurrentTask = 0;
        for (let i = 0; i < roundTasks.length; i++) {
            const t = roundTasks[i];
            const tUnits = t.endUnit - t.startUnit + 1;
            if (completed >= tUnits) {
                completed -= tUnits;
                continue;
            }
            else {
                // this task is partially or fully remaining
                firstIncompleteIndex = i;
                remainingUnitsInCurrentTask = tUnits - completed;
                break;
            }
        }
        // Build remainingRoundTasks starting from firstIncompleteIndex
        const remainingRoundTasks = [];
        for (let i = firstIncompleteIndex; i < roundTasks.length; i++) {
            remainingRoundTasks.push(roundTasks[i]);
        }
        if (remainingRoundTasks.length === 0) {
            // これ以上タスクがない
            return tasks;
        }
        // debug: log remainingRoundTasks summary
        try {
            // eslint-disable-next-line no-console
            console.log('[Orchestrator:ALLOC] plan', { planId: plan.id, totalCompletedUnits });
            // eslint-disable-next-line no-console
            console.log('[Orchestrator:ALLOC] remainingRoundTasks count', remainingRoundTasks.length, 'firstRem', remainingRoundTasks[0]);
        }
        catch (e) { }
        // currentTaskIndex is index within remainingRoundTasks
        let currentTaskIndex = 0;
        // ensure remainingUnitsInCurrentTask is set relative to first remaining task
        const firstRem = remainingRoundTasks[0];
        const firstRemTotal = firstRem.endUnit - firstRem.startUnit + 1;
        if (remainingUnitsInCurrentTask <= 0) {
            remainingUnitsInCurrentTask = firstRemTotal;
        }
        else if (remainingUnitsInCurrentTask > firstRemTotal) {
            remainingUnitsInCurrentTask = firstRemTotal;
        }
        // 逆算分配: 締切までの学習日を列挙し、残りユニットを日ごとに分配する
        const deadlineDay = (0, date_fns_1.startOfDay)(plan.dynamicDeadline ?? plan.deadline);
        // 計算対象の残りユニット（remainingRoundTasks 全体）
        let totalRemainingUnits = 0;
        for (const t of remainingRoundTasks) {
            totalRemainingUnits += t.endUnit - t.startUnit + 1;
        }
        // 最初のタスクが部分的に完了しているなら、その分を差し引く
        const completedInFirst = (firstRemTotal - remainingUnitsInCurrentTask);
        totalRemainingUnits = Math.max(0, totalRemainingUnits - completedInFirst);
        // debug: show remaining units and completedInFirst
        try {
            // eslint-disable-next-line no-console
            console.log('[Orchestrator:ALLOC] totalRemainingUnits', totalRemainingUnits, 'completedInFirst', completedInFirst, 'remainingUnitsInCurrentTask', remainingUnitsInCurrentTask);
        }
        catch (e) { }
        // 刻む日付リストを作る（today から deadlineDay まで、plan.isStudyDay を満たす日）
        const studyDates = [];
        let cursor = today;
        while (cursor <= deadlineDay) {
            const weekday = cursor.getDay() === 0 ? 7 : cursor.getDay();
            if (plan.isStudyDay(weekday))
                studyDates.push(cursor);
            cursor = (0, date_fns_1.addDays)(cursor, 1);
            // safety cap to avoid infinite loops
            if (studyDates.length > 365)
                break;
        }
        // フォールバック: 学習日が一つも無ければ、次の30日を候補にする（既存仕様に合わせる）
        if (studyDates.length === 0) {
            cursor = today;
            for (let i = 0; i < 30; i++) {
                studyDates.push(cursor);
                cursor = (0, date_fns_1.addDays)(cursor, 1);
            }
        }
        // debug: log studyDates summary
        try {
            const daysCountDebug = studyDates.length;
            const firstDate = studyDates[0] ? studyDates[0].toISOString().slice(0, 10) : null;
            const lastDate = studyDates[studyDates.length - 1] ? studyDates[studyDates.length - 1].toISOString().slice(0, 10) : null;
            // eslint-disable-next-line no-console
            console.log('[Orchestrator:ALLOC] studyDates', { daysCount: daysCountDebug, firstDate, lastDate, sample: studyDates.slice(0, 10).map(d => d.toISOString().slice(0, 10)) });
        }
        catch (e) { }
        // 日数に対して単純に ceil で日割り（簡易対応）
        const daysCount = studyDates.length;
        // safety: if totalRemainingUnits is zero, nothing to assign
        if (totalRemainingUnits <= 0 || daysCount <= 0) {
            return tasks;
        }
        const perDayCeil = Math.ceil(totalRemainingUnits / daysCount);
        const minQuotaCeil = Math.max(0, Math.ceil(usedDailyQuota || 0));
        // debug: log perDayCeil and usedDailyQuota
        try {
            // eslint-disable-next-line no-console
            console.log('[Orchestrator:ALLOC] distribution simpleCeil', { perDayCeil, minQuotaCeil, usedDailyQuota, daysCount, totalRemainingUnits });
        }
        catch (e) { }
        // 各日ごとの割り当て配列は per-day の下限を保証
        const perDayAssign = new Array(daysCount).fill(Math.max(perDayCeil, minQuotaCeil));
        // debug: log perDayAssign sample (trimmed)
        try {
            // eslint-disable-next-line no-console
            console.log('[Orchestrator:ALLOC] perDayAssign sample', perDayAssign.slice(0, Math.min(perDayAssign.length, 50)));
        }
        catch (e) { }
        // 日ごとに割り当て数を消費して DailyTaskEntity を作成する
        let dayIndex = 0;
        for (; dayIndex < daysCount && currentTaskIndex < remainingRoundTasks.length; dayIndex++) {
            const assigned = perDayAssign[dayIndex];
            let remainingToAssign = assigned;
            const assignDate = studyDates[dayIndex];
            // skip zero-assign days
            if (remainingToAssign <= 0)
                continue;
            // 集約: 当日分をまとめて1つの DailyTask にするための開始/終了/合計を保持
            let dayStartUnit = null;
            let dayEndUnit = null;
            let dayUnitsAssigned = 0;
            let dayRound = remainingRoundTasks[currentTaskIndex]?.round ?? 1;
            while (remainingToAssign > 0 && currentTaskIndex < remainingRoundTasks.length) {
                const currentTask = remainingRoundTasks[currentTaskIndex];
                const taskUnits = currentTask.endUnit - currentTask.startUnit + 1;
                const completedInTask = taskUnits - remainingUnitsInCurrentTask;
                let startUnit = currentTask.startUnit + completedInTask;
                let take = Math.min(remainingToAssign, remainingUnitsInCurrentTask);
                let endUnit = startUnit + take - 1;
                // clamp
                if (startUnit < rangeStart)
                    startUnit = rangeStart;
                if (endUnit > rangeEnd)
                    endUnit = rangeEnd;
                const actualUnits = endUnit - startUnit + 1;
                if (actualUnits <= 0) {
                    // advance to next task
                    remainingUnitsInCurrentTask = 0;
                    currentTaskIndex++;
                    if (currentTaskIndex < remainingRoundTasks.length) {
                        const nextTask = remainingRoundTasks[currentTaskIndex];
                        remainingUnitsInCurrentTask = nextTask.endUnit - nextTask.startUnit + 1;
                    }
                    continue;
                }
                // 初回割当なら開始を設定
                if (dayStartUnit === null) {
                    dayStartUnit = startUnit;
                    dayRound = currentTask.round;
                }
                // 常に終了は上書きして伸ばす
                dayEndUnit = endUnit;
                dayUnitsAssigned += actualUnits;
                // consume
                remainingUnitsInCurrentTask -= take;
                remainingToAssign -= take;
                if (remainingUnitsInCurrentTask <= 0) {
                    currentTaskIndex++;
                    if (currentTaskIndex < remainingRoundTasks.length) {
                        const nextTask = remainingRoundTasks[currentTaskIndex];
                        remainingUnitsInCurrentTask = nextTask.endUnit - nextTask.startUnit + 1;
                    }
                }
            }
            // 当日の割当があればまとめて1つの DailyTaskEntity を作成
            if (dayUnitsAssigned > 0 && dayStartUnit !== null && dayEndUnit !== null) {
                const dt = new daily_task_entity_1.DailyTaskEntity({
                    id: `${plan.id}-${assignDate.toISOString().slice(0, 10)}-r${dayRound}-t${dayIndex}`,
                    planId: plan.id,
                    date: assignDate,
                    startUnit: dayStartUnit,
                    endUnit: dayEndUnit,
                    units: dayUnitsAssigned,
                    estimatedDuration: adjustedTimePerUnitMs * dayUnitsAssigned,
                    round: dayRound,
                    advice: remainingRoundTasks[0]?.advice || '今日も頑張りましょう！',
                });
                tasks.push(dt);
            }
        }
        return tasks;
    }
    /**
     * 既存セッションから進捗サマリーを取得
     */
    getProgressSummary(plan, sessions) {
        const rangeStart = plan.unitRange?.start ?? 1;
        const rangeEnd = plan.unitRange?.end ?? plan.totalUnits;
        const rangeTotal = rangeEnd - rangeStart + 1;
        const totalCompleted = sessions.reduce((sum, s) => sum + s.unitsCompleted, 0);
        const currentRound = Math.floor(totalCompleted / rangeTotal) + 1;
        const targetTotal = rangeTotal * plan.targetRounds;
        const progressPercentage = (totalCompleted / targetTotal) * 100;
        return {
            totalCompleted,
            currentRound,
            progressPercentage,
        };
    }
}
exports.PlanningOrchestrator = PlanningOrchestrator;
//# sourceMappingURL=planning-orchestrator.js.map