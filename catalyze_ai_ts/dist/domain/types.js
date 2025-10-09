"use strict";
/**
 * ドメイン層 - 共通型定義
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AchievabilityStatus = exports.PerformanceTrend = exports.TaskType = exports.PlanStatus = exports.PlanDifficulty = void 0;
/**
 * 計画難易度
 */
var PlanDifficulty;
(function (PlanDifficulty) {
    PlanDifficulty["EASY"] = "easy";
    PlanDifficulty["NORMAL"] = "normal";
    PlanDifficulty["HARD"] = "hard";
})(PlanDifficulty || (exports.PlanDifficulty = PlanDifficulty = {}));
/**
 * 計画ステータス
 */
var PlanStatus;
(function (PlanStatus) {
    /** 学習中 */
    PlanStatus["ACTIVE"] = "active";
    /** 一時停止 */
    PlanStatus["PAUSED"] = "paused";
    /** 完了 */
    PlanStatus["COMPLETED"] = "completed";
    /** 本日完了 */
    PlanStatus["COMPLETED_TODAY"] = "completedToday";
})(PlanStatus || (exports.PlanStatus = PlanStatus = {}));
/**
 * タスクタイプ
 */
var TaskType;
(function (TaskType) {
    /** 学習タスク */
    TaskType["LEARNING"] = "learning";
    /** 復習タスク */
    TaskType["REVIEW"] = "review";
})(TaskType || (exports.TaskType = TaskType = {}));
/**
 * パフォーマンストレンド
 */
var PerformanceTrend;
(function (PerformanceTrend) {
    /** 改善中 */
    PerformanceTrend["IMPROVING"] = "improving";
    /** 安定 */
    PerformanceTrend["STABLE"] = "stable";
    /** 低下中 */
    PerformanceTrend["DECLINING"] = "declining";
})(PerformanceTrend || (exports.PerformanceTrend = PerformanceTrend = {}));
/**
 * 達成可能性ステータス
 */
var AchievabilityStatus;
(function (AchievabilityStatus) {
    /** 達成済み */
    AchievabilityStatus["ACHIEVED"] = "achieved";
    /** 余裕あり */
    AchievabilityStatus["COMFORTABLE"] = "comfortable";
    /** 順調 */
    AchievabilityStatus["ON_TRACK"] = "onTrack";
    /** 挑戦的 */
    AchievabilityStatus["CHALLENGING"] = "challenging";
    /** リスクあり */
    AchievabilityStatus["AT_RISK"] = "atRisk";
    /** 期限切れ */
    AchievabilityStatus["OVERDUE"] = "overdue";
    /** 達成不可能 */
    AchievabilityStatus["IMPOSSIBLE"] = "impossible";
})(AchievabilityStatus || (exports.AchievabilityStatus = AchievabilityStatus = {}));
//# sourceMappingURL=types.js.map