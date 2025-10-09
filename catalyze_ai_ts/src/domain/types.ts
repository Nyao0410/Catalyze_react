/**
 * ドメイン層 - 共通型定義
 */

/**
 * 計画難易度
 */
export enum PlanDifficulty {
  EASY = 'easy',
  NORMAL = 'normal',
  HARD = 'hard',
}

/**
 * 計画ステータス
 */
export enum PlanStatus {
  /** 学習中 */
  ACTIVE = 'active',
  /** 一時停止 */
  PAUSED = 'paused',
  /** 完了 */
  COMPLETED = 'completed',
  /** 本日完了 */
  COMPLETED_TODAY = 'completedToday',
}

/**
 * タスクタイプ
 */
export enum TaskType {
  /** 学習タスク */
  LEARNING = 'learning',
  /** 復習タスク */
  REVIEW = 'review',
}

/**
 * パフォーマンストレンド
 */
export enum PerformanceTrend {
  /** 改善中 */
  IMPROVING = 'improving',
  /** 安定 */
  STABLE = 'stable',
  /** 低下中 */
  DECLINING = 'declining',
}

/**
 * 達成可能性ステータス
 */
export enum AchievabilityStatus {
  /** 達成済み */
  ACHIEVED = 'achieved',
  /** 余裕あり */
  COMFORTABLE = 'comfortable',
  /** 順調 */
  ON_TRACK = 'onTrack',
  /** 挑戦的 */
  CHALLENGING = 'challenging',
  /** リスクあり */
  AT_RISK = 'atRisk',
  /** 期限切れ */
  OVERDUE = 'overdue',
  /** 達成不可能 */
  IMPOSSIBLE = 'impossible',
}
