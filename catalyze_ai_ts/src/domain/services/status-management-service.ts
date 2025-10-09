/**
 * ドメイン層 - ドメインサービス
 * 
 * ステータス管理サービス - 学習計画のステータス自動管理
 */

import { StudyPlanEntity } from '../entities/study-plan-entity';
import { DailyTaskEntity } from '../entities/daily-task-entity';
import { StudySessionEntity } from '../entities/study-session-entity';

/**
 * ステータス管理サービス
 * 
 * 学習計画のステータスを自動的に管理し、ビジネスルールに従って遷移させる
 */
export class StatusManagementService {
  /**
   * ステータスを自動更新
   * 
   * ビジネスルール:
   * 1. 本日完了 → 学習中: 翌日に新しいタスクがあれば学習中に戻す
   * 2. 学習中 → 本日完了: 本日のタスクが全て完了したら本日完了に
   * 3. 学習中 → 完了: 全周回が完了したら完了に
   */
  updateStatus(
    plan: StudyPlanEntity,
    todaysTasks: DailyTaskEntity[],
    todaysSessions: StudySessionEntity[],
    allRoundsComplete: boolean
  ): StudyPlanEntity {
    // 既に完了している場合は変更しない
    if (plan.isCompleted) {
      return plan;
    }

    // 全周回完了している場合は完了ステータスに
    if (allRoundsComplete) {
      return plan.complete();
    }

    // 本日完了から学習中への自動復帰
    if (plan.isCompletedToday) {
      // 翌日にタスクがある場合は学習中に戻す
      const hasFutureTasks = todaysTasks.some((task) => task.isFuture());
      if (hasFutureTasks) {
        return plan.resetTodayCompletion();
      }
      return plan;
    }

    // 本日のタスク完了チェック
    if (todaysTasks.length > 0) {
      const todaysTasksOnly = todaysTasks.filter((task) => task.isToday());

      if (todaysTasksOnly.length > 0) {
        const totalUnitsRequired = todaysTasksOnly.reduce((sum, task) => sum + task.units, 0);
        const totalUnitsCompleted = todaysSessions.reduce(
          (sum, session) => sum + session.unitsCompleted,
          0
        );

        // 本日のタスクが全て完了している場合
        if (totalUnitsCompleted >= totalUnitsRequired) {
          return plan.completeToday();
        }
      }
    }

    return plan;
  }

  /**
   * 学習可能かどうかを判定
   */
  canStudy(plan: StudyPlanEntity): boolean {
    if (plan.isPaused) return false;
    if (plan.isCompleted) return false;
    if (plan.isOverdue()) return false;
    return true;
  }

  /**
   * 日別のステータスメッセージを生成
   */
  generateStatusMessage(plan: StudyPlanEntity): string {
    if (plan.isCompleted) {
      return '計画完了';
    }
    if (plan.isCompletedToday) {
      return '本日のタスク完了';
    }
    if (plan.isPaused) {
      return '一時停止中';
    }
    if (plan.isOverdue()) {
      return '期限切れ';
    }
    if (plan.isActive) {
      return '学習中';
    }
    return '不明';
  }
}
