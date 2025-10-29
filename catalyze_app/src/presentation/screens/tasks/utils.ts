/**
 * TasksScreen用のユーティリティ関数
 */

import { format, startOfDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import { StudySessionEntity } from 'catalyze-ai';

/**
 * ローカル日時として 'yyyy-MM-dd' 形式の文字列を Date に変換
 */
export function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * パフォーマンス係数に基づいて色を返す
 */
export function getPerformanceColor(performanceFactor: number, colors: any): string {
  if (performanceFactor >= 0.8) return colors.success;
  if (performanceFactor >= 0.6) return colors.primary;
  if (performanceFactor >= 0.4) return colors.warning;
  return colors.error;
}

/**
 * 単位の配列から連続した範囲を計算
 */
export function mergeUnitsToRanges(units: number[]): Array<{ start: number; end: number; units: number }> {
  const sorted = Array.from(new Set(units)).sort((a, b) => a - b);
  const ranges: Array<{ start: number; end: number; units: number }> = [];
  let curStart: number | null = null;
  let curEnd: number | null = null;

  for (const u of sorted) {
    if (curStart === null) {
      curStart = u;
      curEnd = u;
      continue;
    }
    if (u === (curEnd as number) + 1) {
      curEnd = u;
    } else {
      ranges.push({ start: curStart, end: curEnd as number, units: (curEnd as number) - curStart + 1 });
      curStart = u;
      curEnd = u;
    }
  }
  if (curStart !== null) {
    ranges.push({ start: curStart, end: curEnd as number, units: (curEnd as number) - curStart + 1 });
  }
  return ranges;
}

/**
 * 範囲を重複排除してマージ
 */
export function mergeRanges(ranges: Array<{ start: number; end: number }>): Array<{ start: number; end: number }> {
  if (ranges.length === 0) return [];
  const sorted = ranges.sort((a, b) => a.start - b.start);
  const merged: Array<{ start: number; end: number }> = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    if (sorted[i].start <= last.end + 1) {
      last.end = Math.max(last.end, sorted[i].end);
    } else {
      merged.push(sorted[i]);
    }
  }
  return merged;
}

/**
 * セッションから完了した範囲を抽出
 */
export function extractCompletedRanges(
  sessions: StudySessionEntity[],
  taskStart: number,
  taskEnd: number
): Array<{ start: number; end: number }> {
  const completedRanges: Array<{ start: number; end: number }> = [];

  sessions.forEach((session) => {
    if (session.startUnit !== undefined && session.endUnit !== undefined) {
      const overlapStart = Math.max(taskStart, session.startUnit);
      const overlapEnd = Math.min(taskEnd, session.endUnit);
      if (overlapStart <= overlapEnd) {
        completedRanges.push({ start: overlapStart, end: overlapEnd });
      }
    }
  });

  return completedRanges;
}

/**
 * 完了ユニット数を計算
 */
export function calculateCompletedUnits(
  completedRanges: Array<{ start: number; end: number }>
): number {
  return completedRanges.reduce((sum, r) => sum + (r.end - r.start + 1), 0);
}

/**
 * タスクの進捗を計算
 */
export function calculateTaskProgress(completedUnits: number, totalUnits: number): number {
  return Math.min(completedUnits / totalUnits, 1);
}

/**
 * 日付をフォーマット（yyyy年MM月dd日 (E)）
 */
export function formatDateHeader(date: Date): string {
  return format(date, 'yyyy年MM月dd日 (E)', { locale: ja });
}

/**
 * 日付をフォーマット（M月d日(E)）
 */
export function formatDateShort(date: Date): string {
  return format(date, 'M月d日(E)', { locale: ja });
}

/**
 * 日付をフォーマット（HH:mm）
 */
export function formatTime(date: Date): string {
  return format(date, 'HH:mm', { locale: ja });
}

/**
 * セッションを日付ごとにグループ化
 */
export function groupSessionsByDate(
  sessions: StudySessionEntity[]
): Array<{ date: string; sessions: StudySessionEntity[] }> {
  const groups: { [date: string]: StudySessionEntity[] } = {};

  sessions.forEach((session) => {
    const dateKey = format(session.date, 'yyyy-MM-dd');
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(session);
  });

  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, sessions]) => ({
      date,
      sessions: sessions.sort((a, b) => b.date.getTime() - a.date.getTime()),
    }));
}
