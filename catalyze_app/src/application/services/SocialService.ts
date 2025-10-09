/**
 * StudyNext - Social Service
 * ソーシャル機能のサービス（AsyncStorage使用）
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Friend, CooperationGoal, UserPoints, RankingEntry } from '../../types';

const FRIENDS_KEY = '@studynext:friends';
const COOPERATION_GOALS_KEY = '@studynext:cooperationGoals';
const USER_POINTS_KEY = '@studynext:userPoints';

export class SocialService {
  /**
   * フレンドリストを取得
   */
  static async getFriends(userId: string): Promise<Friend[]> {
    try {
      const data = await AsyncStorage.getItem(FRIENDS_KEY);
      if (!data) return [];
      
      const allFriends: Friend[] = JSON.parse(data);
      return allFriends
        .filter(f => f.userId === userId)
        .map(f => ({
          ...f,
          addedAt: new Date(f.addedAt),
        }));
    } catch (error) {
      console.error('Failed to get friends:', error);
      return [];
    }
  }

  /**
   * フレンドを追加
   */
  static async addFriend(userId: string, friend: Omit<Friend, 'userId' | 'addedAt'>): Promise<Friend> {
    try {
      const friends = await this.getFriends(userId);
      const newFriend: Friend = {
        ...friend,
        userId,
        addedAt: new Date(),
      };
      
      friends.push(newFriend);
      await AsyncStorage.setItem(FRIENDS_KEY, JSON.stringify(friends));
      return newFriend;
    } catch (error) {
      console.error('Failed to add friend:', error);
      throw error;
    }
  }

  /**
   * フレンドを削除
   */
  static async removeFriend(userId: string, friendId: string): Promise<void> {
    try {
      const friends = await this.getFriends(userId);
      const updated = friends.filter(f => f.id !== friendId);
      await AsyncStorage.setItem(FRIENDS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to remove friend:', error);
      throw error;
    }
  }

  /**
   * 協力目標リストを取得
   */
  static async getCooperationGoals(userId: string): Promise<CooperationGoal[]> {
    try {
      const data = await AsyncStorage.getItem(COOPERATION_GOALS_KEY);
      if (!data) return [];
      
      const allGoals: CooperationGoal[] = JSON.parse(data);
      return allGoals
        .filter(g => g.creatorId === userId || g.participantIds.includes(userId))
        .map(g => ({
          ...g,
          deadline: new Date(g.deadline),
          createdAt: new Date(g.createdAt),
        }));
    } catch (error) {
      console.error('Failed to get cooperation goals:', error);
      return [];
    }
  }

  /**
   * 協力目標を作成
   */
  static async createCooperationGoal(
    goal: Omit<CooperationGoal, 'id' | 'createdAt' | 'status'>
  ): Promise<CooperationGoal> {
    try {
      const goals = await this.getCooperationGoals(goal.creatorId);
      const newGoal: CooperationGoal = {
        ...goal,
        id: `goal-${Date.now()}`,
        createdAt: new Date(),
        status: 'active',
      };
      
      goals.push(newGoal);
      await AsyncStorage.setItem(COOPERATION_GOALS_KEY, JSON.stringify(goals));
      return newGoal;
    } catch (error) {
      console.error('Failed to create cooperation goal:', error);
      throw error;
    }
  }

  /**
   * 協力目標の進捗を更新
   */
  static async updateGoalProgress(
    goalId: string,
    progress: number
  ): Promise<CooperationGoal> {
    try {
      const data = await AsyncStorage.getItem(COOPERATION_GOALS_KEY);
      if (!data) throw new Error('Goal not found');
      
      const goals: CooperationGoal[] = JSON.parse(data);
      const goalIndex = goals.findIndex(g => g.id === goalId);
      if (goalIndex === -1) throw new Error('Goal not found');
      
      goals[goalIndex] = {
        ...goals[goalIndex],
        currentProgress: progress,
        status: progress >= goals[goalIndex].targetProgress ? 'completed' : 'active',
      };
      
      await AsyncStorage.setItem(COOPERATION_GOALS_KEY, JSON.stringify(goals));
      return {
        ...goals[goalIndex],
        deadline: new Date(goals[goalIndex].deadline),
        createdAt: new Date(goals[goalIndex].createdAt),
      };
    } catch (error) {
      console.error('Failed to update goal progress:', error);
      throw error;
    }
  }

  /**
   * ユーザーポイントを取得
   */
  static async getUserPoints(userId: string): Promise<UserPoints | null> {
    try {
      const data = await AsyncStorage.getItem(USER_POINTS_KEY);
      if (!data) return null;
      
      const allPoints: UserPoints[] = JSON.parse(data);
      const userPoints = allPoints.find(p => p.userId === userId);
      if (!userPoints) return null;
      
      return {
        ...userPoints,
        lastUpdated: new Date(userPoints.lastUpdated),
      };
    } catch (error) {
      console.error('Failed to get user points:', error);
      return null;
    }
  }

  /**
   * ポイントを追加（学習セッション完了時に呼ばれる）
   */
  static async addPoints(userId: string, points: number): Promise<UserPoints> {
    try {
      let currentPoints = await this.getUserPoints(userId);
      
      if (!currentPoints) {
        // 初回作成
        currentPoints = {
          userId,
          points: 0,
          level: 1,
          weeklyPoints: 0,
          lastUpdated: new Date(),
        };
      }
      
      const newTotalPoints = currentPoints.points + points;
      const newLevel = Math.floor(newTotalPoints / 100) + 1; // 100ポイントで1レベルアップ
      
      const updated: UserPoints = {
        ...currentPoints,
        points: newTotalPoints,
        level: newLevel,
        weeklyPoints: currentPoints.weeklyPoints + points,
        lastUpdated: new Date(),
      };
      
      await this.saveUserPoints(updated);
      return updated;
    } catch (error) {
      console.error('Failed to add points:', error);
      throw error;
    }
  }

  /**
   * ユーザーポイントを保存
   */
  private static async saveUserPoints(userPoints: UserPoints): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(USER_POINTS_KEY);
      let allPoints: UserPoints[] = data ? JSON.parse(data) : [];
      
      const index = allPoints.findIndex(p => p.userId === userPoints.userId);
      if (index >= 0) {
        allPoints[index] = userPoints;
      } else {
        allPoints.push(userPoints);
      }
      
      await AsyncStorage.setItem(USER_POINTS_KEY, JSON.stringify(allPoints));
    } catch (error) {
      console.error('Failed to save user points:', error);
      throw error;
    }
  }

  /**
   * 週次ポイントをリセット（週の初めに呼ばれる）
   */
  static async resetWeeklyPoints(userId: string): Promise<UserPoints> {
    try {
      const currentPoints = await this.getUserPoints(userId);
      if (!currentPoints) throw new Error('User points not found');
      
      const updated: UserPoints = {
        ...currentPoints,
        weeklyPoints: 0,
        lastUpdated: new Date(),
      };
      
      await this.saveUserPoints(updated);
      return updated;
    } catch (error) {
      console.error('Failed to reset weekly points:', error);
      throw error;
    }
  }

  /**
   * ランキングを取得
   */
  static async getRanking(userIds: string[]): Promise<RankingEntry[]> {
    try {
      const data = await AsyncStorage.getItem(USER_POINTS_KEY);
      if (!data) return [];
      
      const allPoints: UserPoints[] = JSON.parse(data);
      const friends = await this.getAllFriends();
      
      const ranking: RankingEntry[] = allPoints
        .filter(p => userIds.includes(p.userId))
        .map((p, index) => {
          const friend = friends.find(f => f.id === p.userId);
          return {
            rank: index + 1,
            userId: p.userId,
            name: friend?.name || 'Unknown',
            avatar: friend?.avatar || '👤',
            points: p.weeklyPoints,
            level: p.level,
            status: friend?.status || 'offline',
          };
        })
        .sort((a, b) => b.points - a.points)
        .map((entry, index) => ({ ...entry, rank: index + 1 }));
      
      return ranking;
    } catch (error) {
      console.error('Failed to get ranking:', error);
      return [];
    }
  }

  /**
   * すべてのフレンドを取得（内部使用）
   */
  private static async getAllFriends(): Promise<Friend[]> {
    try {
      const data = await AsyncStorage.getItem(FRIENDS_KEY);
      if (!data) return [];
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to get all friends:', error);
      return [];
    }
  }

  /**
   * モックデータを初期化（開発用）
   */
  static async initializeMockData(userId: string): Promise<void> {
    try {
      // モックフレンド
      const mockFriends: Friend[] = [
        { id: 'friend-1', userId, name: '田中太郎', avatar: '👨', level: 15, points: 2340, status: 'online', addedAt: new Date() },
        { id: 'friend-2', userId, name: '佐藤花子', avatar: '👩', level: 12, points: 1890, status: 'online', addedAt: new Date() },
        { id: 'friend-3', userId, name: '鈴木一郎', avatar: '👨‍💼', level: 18, points: 2850, status: 'offline', addedAt: new Date() },
        { id: 'friend-4', userId, name: '山田美咲', avatar: '👩‍🎓', level: 10, points: 1560, status: 'online', addedAt: new Date() },
        { id: 'friend-5', userId, name: '伊藤健太', avatar: '👨‍🎓', level: 14, points: 2120, status: 'offline', addedAt: new Date() },
      ];
      
      await AsyncStorage.setItem(FRIENDS_KEY, JSON.stringify(mockFriends));
      
      // モック協力目標
      const mockGoals: CooperationGoal[] = [
        {
          id: 'goal-1',
          title: 'みんなで100時間勉強チャレンジ',
          description: 'チーム全員で合計100時間の勉強を目指そう!',
          creatorId: userId,
          participantIds: ['friend-1', 'friend-2', 'friend-3'],
          currentProgress: 67,
          targetProgress: 100,
          deadline: new Date('2025-10-15'),
          createdAt: new Date(),
          status: 'active',
        },
        {
          id: 'goal-2',
          title: '資格試験合格プロジェクト',
          description: 'それぞれの目標資格に向けて頑張ろう!',
          creatorId: userId,
          participantIds: ['friend-2', 'friend-3', 'friend-4'],
          currentProgress: 45,
          targetProgress: 100,
          deadline: new Date('2025-11-30'),
          createdAt: new Date(),
          status: 'active',
        },
      ];
      
      await AsyncStorage.setItem(COOPERATION_GOALS_KEY, JSON.stringify(mockGoals));
      
      // モックポイント
      const mockPoints: UserPoints[] = mockFriends.map(f => ({
        userId: f.id,
        points: f.points,
        level: f.level,
        weeklyPoints: Math.floor(f.points * 0.1),
        lastUpdated: new Date(),
      }));
      
      // 自分のポイントも追加
      mockPoints.push({
        userId,
        points: 2100,
        level: 13,
        weeklyPoints: 120,
        lastUpdated: new Date(),
      });
      
      await AsyncStorage.setItem(USER_POINTS_KEY, JSON.stringify(mockPoints));
      
      console.log('✅ Social mock data initialized');
    } catch (error) {
      console.error('Failed to initialize mock data:', error);
      throw error;
    }
  }
}
