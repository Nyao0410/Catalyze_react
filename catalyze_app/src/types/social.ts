/**
 * Catalyze AI - Social Types
 * ソーシャル機能の型定義
 */

export interface Friend {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  level: number;
  points: number;
  status: 'online' | 'offline';
  addedAt: Date;
}

export interface CooperationGoal {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  participantIds: string[];
  currentProgress: number;
  targetProgress: number;
  deadline: Date;
  createdAt: Date;
  status: 'active' | 'completed' | 'cancelled';
}

export interface UserPoints {
  userId: string;
  points: number;
  level: number;
  weeklyPoints: number;
  lastUpdated: Date;
}

export interface RankingEntry {
  rank: number;
  userId: string;
  name: string;
  avatar: string;
  points: number;
  level: number;
  status: 'online' | 'offline';
}
