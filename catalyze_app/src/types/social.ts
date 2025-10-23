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

/**
 * AI競争機能の型定義
 */

export interface AICompetitorPersonality {
  difficulty: 'Easy' | 'Normal' | 'Hard' | 'Extreme';
  dailyRate: number;
  randomBonusMin: number;
  randomBonusMax: number;
  description: string;
}

export interface AICompetitor {
  id: string;
  name: string;
  avatar: string;
  level: number;
  personality: AICompetitorPersonality;
  bio: string;
  baseWinRate: number; // 0-1, AIの勝率ベース
  totalMatches: number;
  wins: number;
}

export type CompetitionMatchType = 'studyHours' | 'points' | 'streak';

export interface AICompetitionMatch {
  id: string;
  userId: string;
  aiCompetitorId: string;
  matchType: CompetitionMatchType;
  userProgress: number;
  aiProgress: number;
  targetProgress: number;
  duration: number; // 日数
  startDate: Date;
  endDate: Date;
  status: 'active' | 'completed' | 'user_won' | 'ai_won' | 'draw';
  reward: number; // 勝利時のボーナスポイント
  createdAt: Date;
  updatedAt: Date;
}

