/**
 * StudyNext - Statistics Service
 * 統計データ計算サービス
 */

import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  differenceInCalendarDays,
  getHours,
  isToday,
} from 'date-fns';
import type { StudySessionEntity, StudyPlanEntity } from 'catalyze-ai';

/**
 * 時間帯別学習時間データ
 */
export interface TimeOfDayStats {
  hour: number; // 0-23
  totalMinutes: number;
  sessionCount: number;
}

/**
 * 学習ストリークデータ
 */
export interface StreakData {
  currentStreak: number; // 現在の連続日数
  longestStreak: number; // 最長連続日数
  totalStudyDays: number; // 総学習日数
}

/**
 * ヒートマップデータ（1日分）
 */
export interface HeatmapDay {
  date: string; // yyyy-MM-dd
  value: number; // 学習時間（分）
  level: number; // 0-4（色の濃さレベル）
}

/**
 * 学習項目内訳データ
 */
export interface PlanBreakdown {
  planId: string;
  planTitle: string;
  totalMinutes: number;
  percentage: number;
  color: string; // 円グラフの色
}

/**
 * 週間/月間学習時間データ
 */
export interface StudyTimeData {
  date: string; // yyyy-MM-dd
  minutes: number;
  // 科目（プラン）ごとの内訳
  perPlanMinutes?: { planId: string; minutes: number }[];
  label: string; // 表示用ラベル（例: "月", "1/1"）
}

export class StatisticsService {
  /**
   * 週間学習時間データを取得
   */
  getWeeklyStudyTime(sessions: StudySessionEntity[]): StudyTimeData[] {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 0 }); // 日曜始まり
    const weekEnd = endOfWeek(now, { weekStartsOn: 0 });

    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    const weekLabels = ['日', '月', '火', '水', '木', '金', '土'];

    return days.map((day, index) => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const daySessions = sessions.filter(
        (s) => format(s.date, 'yyyy-MM-dd') === dayStr
      );
      const totalMinutes = daySessions.reduce(
        (sum, s) => sum + s.durationMinutes,
        0
      );

      // プランごとに集計（科目別内訳）
      const planMap = new Map<string, number>();
      daySessions.forEach((s) => {
        const prev = planMap.get(s.planId) || 0;
        planMap.set(s.planId, prev + s.durationMinutes);
      });
      const perPlanMinutes = Array.from(planMap.entries()).map(([planId, minutes]) => ({ planId, minutes }));

      return {
        date: dayStr,
        minutes: totalMinutes,
        perPlanMinutes,
        label: weekLabels[index],
      };
    });
  }

  /**
   * 月間学習時間データを取得（週ごと）
   */
  getMonthlyStudyTime(sessions: StudySessionEntity[]): StudyTimeData[] {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    // 月の最初の週の日曜から最後の週の土曜まで
    const rangeStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const rangeEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const weeks: StudyTimeData[] = [];
    let currentWeekStart = rangeStart;

    while (currentWeekStart <= rangeEnd) {
      const currentWeekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 0 });
      const weekLabel = `${format(currentWeekStart, 'M/d')}`;

      const weekSessions = sessions.filter((s) => {
        return s.date >= currentWeekStart && s.date <= currentWeekEnd;
      });

      const totalMinutes = weekSessions.reduce(
        (sum, s) => sum + s.durationMinutes,
        0
      );

      // 週内のプランごとの合計を計算
      const planMap = new Map<string, number>();
      weekSessions.forEach((s) => {
        const prev = planMap.get(s.planId) || 0;
        planMap.set(s.planId, prev + s.durationMinutes);
      });
      const perPlanMinutes = Array.from(planMap.entries()).map(([planId, minutes]) => ({ planId, minutes }));

      weeks.push({
        date: format(currentWeekStart, 'yyyy-MM-dd'),
        minutes: totalMinutes,
        perPlanMinutes,
        label: weekLabel,
      });

      // 次の週へ
      currentWeekStart = new Date(currentWeekStart);
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }

    return weeks;
  }

  /**
   * 学習項目の内訳を取得（週間）
   */
  getWeeklyPlanBreakdown(
    sessions: StudySessionEntity[],
    plans: StudyPlanEntity[]
  ): PlanBreakdown[] {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 0 });

    const weekSessions = sessions.filter(
      (s) => s.date >= weekStart && s.date <= weekEnd
    );

    return this.calculatePlanBreakdown(weekSessions, plans);
  }

  /**
   * 学習項目の内訳を取得（月間）
   */
  getMonthlyPlanBreakdown(
    sessions: StudySessionEntity[],
    plans: StudyPlanEntity[]
  ): PlanBreakdown[] {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const monthSessions = sessions.filter(
      (s) => s.date >= monthStart && s.date <= monthEnd
    );

    return this.calculatePlanBreakdown(monthSessions, plans);
  }

  /**
   * 学習ストリークを計算
   */
  calculateStreak(sessions: StudySessionEntity[]): StreakData {
    if (sessions.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        totalStudyDays: 0,
      };
    }

    // 日付ごとにグループ化
    const studyDatesSet = new Set(
      sessions.map((s) => format(s.date, 'yyyy-MM-dd'))
    );
    const studyDates = Array.from(studyDatesSet).sort();
    const totalStudyDays = studyDates.length;

    // 現在のストリークを計算
    let currentStreak = 0;
    const today = format(new Date(), 'yyyy-MM-dd');
    let checkDate = new Date();

    while (true) {
      const dateStr = format(checkDate, 'yyyy-MM-dd');
      if (studyDatesSet.has(dateStr)) {
        currentStreak++;
        checkDate = new Date(checkDate);
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (dateStr === today) {
        // 今日の分はまだ学習していない可能性があるので前日から確認
        checkDate = new Date(checkDate);
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // 最長ストリークを計算
    let longestStreak = 0;
    let tempStreak = 1;

    for (let i = 1; i < studyDates.length; i++) {
      const prevDate = new Date(studyDates[i - 1]);
      const currDate = new Date(studyDates[i]);
      const daysDiff = differenceInCalendarDays(currDate, prevDate);

      if (daysDiff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    return {
      currentStreak,
      longestStreak,
      totalStudyDays,
    };
  }

  /**
   * 最適学習時間帯を計算
   */
  getOptimalStudyTime(sessions: StudySessionEntity[]): TimeOfDayStats[] {
    const hourStats = new Map<number, { minutes: number; count: number }>();

    // 時間帯ごとに集計
    sessions.forEach((session) => {
      const hour = getHours(session.date);
      const existing = hourStats.get(hour) || { minutes: 0, count: 0 };
      hourStats.set(hour, {
        minutes: existing.minutes + session.durationMinutes,
        count: existing.count + 1,
      });
    });

    // 0-23時の配列に変換
    const result: TimeOfDayStats[] = [];
    for (let hour = 0; hour < 24; hour++) {
      const stats = hourStats.get(hour) || { minutes: 0, count: 0 };
      result.push({
        hour,
        totalMinutes: stats.minutes,
        sessionCount: stats.count,
      });
    }

    return result;
  }

  /**
   * ヒートマップデータを生成（過去365日分）
   */
  getHeatmapData(sessions: StudySessionEntity[]): HeatmapDay[] {
    const now = new Date();
    const yearAgo = new Date(now);
    yearAgo.setFullYear(yearAgo.getFullYear() - 1);

    const days = eachDayOfInterval({ start: yearAgo, end: now });

    // 日付ごとの学習時間を計算
    const dailyMinutes = new Map<string, number>();
    sessions.forEach((session) => {
      const dateStr = format(session.date, 'yyyy-MM-dd');
      const existing = dailyMinutes.get(dateStr) || 0;
      dailyMinutes.set(dateStr, existing + session.durationMinutes);
    });

    // 最大値を求めてレベル分けの基準を作る
    const maxMinutes = Math.max(...Array.from(dailyMinutes.values()), 1);

    return days.map((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const minutes = dailyMinutes.get(dateStr) || 0;

      // 0-4のレベルに変換（0: なし、1-4: 濃さ）
      let level = 0;
      if (minutes > 0) {
        const ratio = minutes / maxMinutes;
        if (ratio > 0.75) level = 4;
        else if (ratio > 0.5) level = 3;
        else if (ratio > 0.25) level = 2;
        else level = 1;
      }

      return {
        date: dateStr,
        value: minutes,
        level,
      };
    });
  }

  /**
   * プライベート: 学習項目の内訳を計算
   */
  private calculatePlanBreakdown(
    sessions: StudySessionEntity[],
    plans: StudyPlanEntity[]
  ): PlanBreakdown[] {
    const planMinutes = new Map<string, number>();
    const totalMinutes = sessions.reduce(
      (sum, s) => sum + s.durationMinutes,
      0
    );

    // プランごとに集計
    sessions.forEach((session) => {
      const existing = planMinutes.get(session.planId) || 0;
      planMinutes.set(session.planId, existing + session.durationMinutes);
    });

    // 色のパレット
    const colors = [
      '#FF6B6B', // 赤
      '#4ECDC4', // シアン
      '#45B7D1', // 青
      '#FFA07A', // オレンジ
      '#98D8C8', // ミント
      '#F7DC6F', // 黄色
      '#BB8FCE', // 紫
      '#85C1E2', // ライトブルー
    ];

    const result: PlanBreakdown[] = [];
    let colorIndex = 0;

    planMinutes.forEach((minutes, planId) => {
      const plan = plans.find((p) => p.id === planId);
      const percentage = totalMinutes > 0 ? (minutes / totalMinutes) * 100 : 0;

      result.push({
        planId,
        planTitle: plan?.title || '不明な学習計画',
        totalMinutes: minutes,
        percentage: Math.round(percentage * 10) / 10,
        color: colors[colorIndex % colors.length],
      });

      colorIndex++;
    });

    // 学習時間の多い順にソート
    return result.sort((a, b) => b.totalMinutes - a.totalMinutes);
  }
}

export const statisticsService = new StatisticsService();
