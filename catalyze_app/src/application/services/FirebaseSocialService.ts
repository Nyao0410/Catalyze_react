/**
 * Catalyze AI - Firebase Social Service
 * Firebase Firestoreを使用したソーシャル機能のサービス
 */

import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, query, where, updateDoc } from 'firebase/firestore';
import { db } from '../../infrastructure/firebase';
import type { Friend, CooperationGoal, UserPoints } from '../../types';

const FRIENDS_COLLECTION = 'friends';
const COOPERATION_GOALS_COLLECTION = 'cooperationGoals';
const USER_POINTS_COLLECTION = 'userPoints';

export class FirebaseSocialService {
  /**
   * Firestoreからフレンドリストを取得
   */
  static async getFriends(userId: string): Promise<Friend[]> {
    try {
      if (!db) {
        console.warn('Firestore not initialized');
        return [];
      }
      
      const friendsRef = collection(db, FRIENDS_COLLECTION);
      const q = query(friendsRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      const friends: Friend[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        friends.push({
          ...data,
          addedAt: data.addedAt?.toDate() || new Date(),
        } as Friend);
      });
      
      return friends;
    } catch (error) {
      console.error('Failed to get friends from Firestore:', error);
      return [];
    }
  }

  /**
   * Firestoreにフレンドを追加
   */
  static async addFriend(userId: string, friendUserId: string, friendData: { name: string; avatar: string; level: number; points: number }): Promise<Friend> {
    try {
      if (!db) {
        throw new Error('Firestore not initialized');
      }
      
      const friendId = `${userId}_${friendUserId}`;
      const friendRef = doc(db, FRIENDS_COLLECTION, friendId);
      
      const newFriend: Friend = {
        id: friendUserId, // フレンドのユーザーID
        userId, // 自分のユーザーID
        name: friendData.name,
        avatar: friendData.avatar,
        level: friendData.level,
        points: friendData.points,
        status: 'offline',
        addedAt: new Date(),
      };
      
      await setDoc(friendRef, newFriend);
      return newFriend;
    } catch (error) {
      console.error('Failed to add friend to Firestore:', error);
      throw error;
    }
  }

  /**
   * Firestoreからフレンドを削除
   */
  static async removeFriend(userId: string, friendId: string): Promise<void> {
    try {
      if (!db) {
        throw new Error('Firestore not initialized');
      }
      
      const friendDocId = `${userId}_${friendId}`;
      const friendRef = doc(db, FRIENDS_COLLECTION, friendDocId);
      await deleteDoc(friendRef);
    } catch (error) {
      console.error('Failed to remove friend from Firestore:', error);
      throw error;
    }
  }

  /**
   * Firestoreから協力目標リストを取得
   */
  static async getCooperationGoals(userId: string): Promise<CooperationGoal[]> {
    try {
      if (!db) {
        console.warn('Firestore not initialized');
        return [];
      }
      
      const goalsRef = collection(db, COOPERATION_GOALS_COLLECTION);
      // creatorIdまたはparticipantIdsに含まれる目標を取得
      const q1 = query(goalsRef, where('creatorId', '==', userId));
      const q2 = query(goalsRef, where('participantIds', 'array-contains', userId));
      
      const [snapshot1, snapshot2] = await Promise.all([
        getDocs(q1),
        getDocs(q2),
      ]);
      
      const goalsMap = new Map<string, CooperationGoal>();
      
      snapshot1.forEach((doc) => {
        const data = doc.data();
        goalsMap.set(doc.id, {
          ...data,
          deadline: data.deadline?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
        } as CooperationGoal);
      });
      
      snapshot2.forEach((doc) => {
        const data = doc.data();
        if (!goalsMap.has(doc.id)) {
          goalsMap.set(doc.id, {
            ...data,
            deadline: data.deadline?.toDate() || new Date(),
            createdAt: data.createdAt?.toDate() || new Date(),
          } as CooperationGoal);
        }
      });
      
      return Array.from(goalsMap.values());
    } catch (error) {
      console.error('Failed to get cooperation goals from Firestore:', error);
      return [];
    }
  }

  /**
   * Firestoreに協力目標を作成
   */
  static async createCooperationGoal(
    goal: Omit<CooperationGoal, 'id' | 'createdAt' | 'status'>
  ): Promise<CooperationGoal> {
    try {
      if (!db) {
        throw new Error('Firestore not initialized');
      }
      
      const goalId = `goal-${Date.now()}`;
      const goalRef = doc(db, COOPERATION_GOALS_COLLECTION, goalId);
      
      const newGoal: CooperationGoal = {
        ...goal,
        id: goalId,
        createdAt: new Date(),
        status: 'active',
      };
      
      await setDoc(goalRef, newGoal);
      return newGoal;
    } catch (error) {
      console.error('Failed to create cooperation goal in Firestore:', error);
      throw error;
    }
  }

  /**
   * Firestoreで協力目標の進捗を更新
   */
  static async updateGoalProgress(
    goalId: string,
    progress: number
  ): Promise<CooperationGoal> {
    try {
      if (!db) {
        throw new Error('Firestore not initialized');
      }
      
      const goalRef = doc(db, COOPERATION_GOALS_COLLECTION, goalId);
      const goalSnap = await getDoc(goalRef);
      
      if (!goalSnap.exists()) {
        throw new Error('Goal not found');
      }
      
      const goal = goalSnap.data() as CooperationGoal;
      const newStatus = progress >= goal.targetProgress ? 'completed' : 'active';
      
      await updateDoc(goalRef, {
        currentProgress: progress,
        status: newStatus,
      });
      
      const updatedGoal = await getDoc(goalRef);
      const updatedData = updatedGoal.data() as CooperationGoal;
      
      return {
        ...updatedData,
        deadline: updatedData.deadline instanceof Date ? updatedData.deadline : new Date(updatedData.deadline),
        createdAt: updatedData.createdAt instanceof Date ? updatedData.createdAt : new Date(updatedData.createdAt),
      };
    } catch (error) {
      console.error('Failed to update goal progress in Firestore:', error);
      throw error;
    }
  }

  /**
   * Firestoreからユーザーポイントを取得
   */
  static async getUserPoints(userId: string): Promise<UserPoints | null> {
    try {
      if (!db) {
        console.warn('Firestore not initialized');
        return null;
      }
      
      const pointsRef = doc(db, USER_POINTS_COLLECTION, userId);
      const pointsSnap = await getDoc(pointsRef);
      
      if (!pointsSnap.exists()) {
        return null;
      }
      
      const data = pointsSnap.data();
      return {
        ...data,
        lastUpdated: data.lastUpdated?.toDate() || new Date(),
      } as UserPoints;
    } catch (error) {
      console.error('Failed to get user points from Firestore:', error);
      return null;
    }
  }

  /**
   * Firestoreにユーザーポイントを保存
   */
  static async saveUserPoints(userPoints: UserPoints): Promise<void> {
    try {
      if (!db) {
        throw new Error('Firestore not initialized');
      }
      
      const pointsRef = doc(db, USER_POINTS_COLLECTION, userPoints.userId);
      await setDoc(pointsRef, userPoints);
    } catch (error) {
      console.error('Failed to save user points to Firestore:', error);
      throw error;
    }
  }

  /**
   * Firestoreでポイントを追加
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
      console.error('Failed to add points in Firestore:', error);
      throw error;
    }
  }
}
