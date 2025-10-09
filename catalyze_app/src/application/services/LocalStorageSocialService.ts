/**
 * StudyNext - LocalStorage Social Service
 * ローカルストレージベースのソーシャル機能サービス
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Friend, CooperationGoal, UserPoints, RankingEntry } from '../../types';
import {
  createMockFriends,
  createMockCooperationGoals,
  createMockUserPoints,
} from '../../infrastructure/mockData';

const FRIENDS_KEY = '@studynext:friends:';
const GOALS_KEY = '@studynext:cooperationGoals:';
const POINTS_KEY = '@studynext:userPoints:';

export class LocalStorageSocialService {
  /**
   * フレンドリスト取得
   */
  static async getFriends(userId: string): Promise<Friend[]> {
    try {
      const key = `${FRIENDS_KEY}${userId}`;
      const data = await AsyncStorage.getItem(key);
      
      if (!data) {
        // 初回はモックデータを保存
        const mockFriends = createMockFriends(userId);
        await AsyncStorage.setItem(key, JSON.stringify(mockFriends));
        return mockFriends;
      }
      
      const friends = JSON.parse(data);
      return friends.map((f: any) => ({
        ...f,
        addedAt: new Date(f.addedAt),
      }));
    } catch (error) {
      console.error('LocalStorage getFriends error:', error);
      return [];
    }
  }

  /**
   * フレンド追加
   */
  static async addFriend(
    userId: string,
    friend: Omit<Friend, 'userId' | 'addedAt'>
  ): Promise<Friend> {
    try {
      const friends = await this.getFriends(userId);
      const newFriend: Friend = {
        ...friend,
        userId: friend.id,
        addedAt: new Date(),
      };
      
      friends.push(newFriend);
      const key = `${FRIENDS_KEY}${userId}`;
      await AsyncStorage.setItem(key, JSON.stringify(friends));
      
      return newFriend;
    } catch (error) {
      console.error('LocalStorage addFriend error:', error);
      throw error;
    }
  }

  /**
   * フレンド削除
   */
  static async removeFriend(userId: string, friendId: string): Promise<void> {
    try {
      const friends = await this.getFriends(userId);
      const filtered = friends.filter(f => f.id !== friendId);
      
      const key = `${FRIENDS_KEY}${userId}`;
      await AsyncStorage.setItem(key, JSON.stringify(filtered));
    } catch (error) {
      console.error('LocalStorage removeFriend error:', error);
      throw error;
    }
  }

  /**
   * 協力目標リスト取得
   */
  static async getCooperationGoals(userId: string): Promise<CooperationGoal[]> {
    try {
      const key = `${GOALS_KEY}${userId}`;
      const data = await AsyncStorage.getItem(key);
      
      if (!data) {
        // 初回はモックデータを保存
        const mockGoals = createMockCooperationGoals(userId);
        await AsyncStorage.setItem(key, JSON.stringify(mockGoals));
        return mockGoals;
      }
      
      const goals = JSON.parse(data);
      return goals.map((g: any) => ({
        ...g,
        deadline: new Date(g.deadline),
        createdAt: new Date(g.createdAt),
      }));
    } catch (error) {
      console.error('LocalStorage getCooperationGoals error:', error);
      return [];
    }
  }

  /**
   * 協力目標作成
   */
  static async createCooperationGoal(
    goal: Omit<CooperationGoal, 'id' | 'createdAt' | 'status'>
  ): Promise<CooperationGoal> {
    try {
      const newGoal: CooperationGoal = {
        ...goal,
        id: `goal-${Date.now()}`,
        createdAt: new Date(),
        status: 'active',
      };
      
      const goals = await this.getCooperationGoals(goal.creatorId);
      goals.push(newGoal);
      
      const key = `${GOALS_KEY}${goal.creatorId}`;
      await AsyncStorage.setItem(key, JSON.stringify(goals));
      
      // 参加者全員に同期（簡易実装）
      for (const participantId of goal.participantIds) {
        if (participantId !== goal.creatorId) {
          const participantGoals = await this.getCooperationGoals(participantId);
          participantGoals.push(newGoal);
          await AsyncStorage.setItem(
            `${GOALS_KEY}${participantId}`,
            JSON.stringify(participantGoals)
          );
        }
      }
      
      return newGoal;
    } catch (error) {
      console.error('LocalStorage createCooperationGoal error:', error);
      throw error;
    }
  }

  /**
   * 協力目標の進捗更新
   */
  static async updateGoalProgress(goalId: string, progress: number): Promise<CooperationGoal> {
    try {
      // すべてのユーザーの目標を検索して更新（簡易実装）
      const keys = await AsyncStorage.getAllKeys();
      const goalKeys = keys.filter(k => k.startsWith(GOALS_KEY));
      
      let updatedGoal: CooperationGoal | null = null;
      
      for (const key of goalKeys) {
        const data = await AsyncStorage.getItem(key);
        if (!data) continue;
        
        const goals: CooperationGoal[] = JSON.parse(data).map((g: any) => ({
          ...g,
          deadline: new Date(g.deadline),
          createdAt: new Date(g.createdAt),
        }));
        
        const goalIndex = goals.findIndex(g => g.id === goalId);
        if (goalIndex !== -1) {
          goals[goalIndex] = {
            ...goals[goalIndex],
            currentProgress: progress,
            status: progress >= goals[goalIndex].targetProgress ? 'completed' : 'active',
          };
          updatedGoal = goals[goalIndex];
          await AsyncStorage.setItem(key, JSON.stringify(goals));
        }
      }
      
      if (!updatedGoal) {
        throw new Error('Goal not found');
      }
      
      return updatedGoal;
    } catch (error) {
      console.error('LocalStorage updateGoalProgress error:', error);
      throw error;
    }
  }

  /**
   * ユーザーポイント取得
   */
  static async getUserPoints(userId: string): Promise<UserPoints | null> {
    try {
      const key = `${POINTS_KEY}${userId}`;
      const data = await AsyncStorage.getItem(key);
      
      if (!data) {
        // 初回はモックデータを保存
        const mockPoints = createMockUserPoints(userId);
        await AsyncStorage.setItem(key, JSON.stringify(mockPoints));
        return mockPoints;
      }
      
      const points = JSON.parse(data);
      return {
        ...points,
        lastUpdated: new Date(points.lastUpdated),
      };
    } catch (error) {
      console.error('LocalStorage getUserPoints error:', error);
      return null;
    }
  }

  /**
   * ポイント追加
   */
  static async addPoints(userId: string, points: number): Promise<UserPoints> {
    try {
      const existing = await this.getUserPoints(userId);
      
      const newPoints: UserPoints = existing
        ? {
            ...existing,
            points: existing.points + points,
            weeklyPoints: existing.weeklyPoints + points,
            level: Math.floor((existing.points + points) / 100) + 1,
            lastUpdated: new Date(),
          }
        : {
            userId,
            points,
            weeklyPoints: points,
            level: Math.floor(points / 100) + 1,
            lastUpdated: new Date(),
          };
      
      const key = `${POINTS_KEY}${userId}`;
      await AsyncStorage.setItem(key, JSON.stringify(newPoints));
      
      return newPoints;
    } catch (error) {
      console.error('LocalStorage addPoints error:', error);
      throw error;
    }
  }

  /**
   * 週次ポイントリセット
   */
  static async resetWeeklyPoints(userId: string): Promise<UserPoints> {
    try {
      const existing = await this.getUserPoints(userId);
      if (!existing) {
        throw new Error('User points not found');
      }
      
      const updated: UserPoints = {
        ...existing,
        weeklyPoints: 0,
        lastUpdated: new Date(),
      };
      
      const key = `${POINTS_KEY}${userId}`;
      await AsyncStorage.setItem(key, JSON.stringify(updated));
      
      return updated;
    } catch (error) {
      console.error('LocalStorage resetWeeklyPoints error:', error);
      throw error;
    }
  }

  /**
   * ランキング取得
   */
  static async getRanking(userIds: string[]): Promise<RankingEntry[]> {
    try {
      const entries: RankingEntry[] = [];
      const friends = await this.getFriends(userIds[0] || 'user-001');
      
      for (const userId of userIds) {
        const points = await this.getUserPoints(userId);
        if (points) {
          const friend = friends.find(f => f.userId === userId) || {
            name: userId === userIds[0] ? 'あなた' : '不明',
            avatar: '👤',
            status: 'offline' as const,
          };
          
          entries.push({
            rank: 0,
            userId,
            name: friend.name,
            avatar: friend.avatar,
            points: points.weeklyPoints,
            level: points.level,
            status: friend.status,
          });
        }
      }
      
      // ポイントでソートしてランク付け
      entries.sort((a, b) => b.points - a.points);
      return entries.map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));
    } catch (error) {
      console.error('LocalStorage getRanking error:', error);
      return [];
    }
  }

  /**
   * モックデータ初期化
   */
  static async initializeMockData(userId: string): Promise<void> {
    try {
      // フレンド
      const mockFriends = createMockFriends(userId);
      await AsyncStorage.setItem(`${FRIENDS_KEY}${userId}`, JSON.stringify(mockFriends));
      
      // 協力目標
      const mockGoals = createMockCooperationGoals(userId);
      await AsyncStorage.setItem(`${GOALS_KEY}${userId}`, JSON.stringify(mockGoals));
      
      // ポイント
      const mockPoints = createMockUserPoints(userId);
      await AsyncStorage.setItem(`${POINTS_KEY}${userId}`, JSON.stringify(mockPoints));
      
      console.log('✅ Mock social data initialized');
    } catch (error) {
      console.error('LocalStorage initializeMockData error:', error);
      throw error;
    }
  }
}
