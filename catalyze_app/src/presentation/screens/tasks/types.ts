/**
 * TasksScreen関連の型定義
 */

import type { StudySessionEntity, DailyTaskEntity, StudyPlanEntity } from 'catalyze-ai';

export interface SessionForm {
  unitsCompleted: string;
  durationMinutes: string;
  concentration: number;
  difficulty: number;
}

export interface ActiveTask {
  type: 'daily' | 'review';
  task: DailyTaskEntity;
  plan: StudyPlanEntity;
  taskProgress: number;
  achievability: string;
}

export interface ReviewTask extends DailyTaskEntity {
  reviewItemIds?: string[];
}

export interface GroupedSessions {
  date: string;
  sessions: StudySessionEntity[];
}

export interface MenuState {
  visible: boolean;
  selectedSession: StudySessionEntity | null;
  position: { x: number; y: number };
}

export interface TasksScreenDynamicStyles {
  container: any;
  centerContainer: any;
  header: any;
  dateText: any;
  summaryCard: any;
  summaryValue: any;
  summaryLabel: any;
  dateHeader: any;
  sessionCard: any;
  planTitle: any;
  sessionTimeText: any;
  performanceText: any;
  sessionStatText: any;
  sessionQualityLabel: any;
  concentrationBar: any;
  concentrationFill: any;
  concentrationText: any;
  menuModal: any;
  menuItemText: any;
  menuDivider: any;
  splitContainer: any;
  leftPaneCalendar: any;
  rightPaneTasks: any;
}

export interface TabRoute {
  key: 'history' | 'today' | 'upcoming';
  title: string;
}
