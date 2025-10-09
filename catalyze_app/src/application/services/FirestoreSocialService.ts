import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, Firestore } from 'firebase/firestore';
import { db } from '../../infrastructure/firebase';
import type { Friend, CooperationGoal, UserPoints, RankingEntry } from '../../types';

export class FirestoreSocialService {
  static friendsCollection() {
    if (!db) throw new Error('Firestore not initialized');
    return collection(db as Firestore, 'friends');
  }

  static async getFriends(userId: string): Promise<Friend[]> {
    try {
      const q = query(this.friendsCollection(), where('ownerId', '==', userId));
      const snap = await getDocs(q);
      const friends: Friend[] = [];
      snap.forEach(d => {
        const data = d.data() as any;
        friends.push({
          id: d.id,
          userId: data.userId,
          name: data.name,
          avatar: data.avatar,
          level: data.level,
          points: data.points,
          status: data.status,
          addedAt: data.addedAt?.toDate ? data.addedAt.toDate() : new Date(data.addedAt),
        });
      });
      return friends;
    } catch (error) {
      console.error('Firestore getFriends error', error);
      return [];
    }
  }

  static async addFriend(ownerId: string, friend: Omit<Friend, 'id' | 'addedAt'>): Promise<Friend> {
    const id = `friend-${Date.now()}`;
    const ref = doc(this.friendsCollection(), id);
    // friend param omits id/addedAt; use provided userId field when present
    const payload = { ...friend, ownerId, userId: (friend as any).userId ?? id, addedAt: new Date() } as any;
    await setDoc(ref, payload);
    return { id, ...friend, addedAt: new Date() } as Friend;
  }

  static cooperationCollection() {
    if (!db) throw new Error('Firestore not initialized');
    return collection(db as Firestore, 'cooperationGoals');
  }

  static async getCooperationGoals(userId: string): Promise<CooperationGoal[]> {
    try {
      const q = query(this.cooperationCollection(), where('participantIds', 'array-contains', userId));
      const snap = await getDocs(q);
      const goals: CooperationGoal[] = [];
      snap.forEach(d => {
        const data = d.data() as any;
        goals.push({
          id: d.id,
          title: data.title,
          description: data.description,
          creatorId: data.creatorId,
          participantIds: data.participantIds || [],
          currentProgress: data.currentProgress || 0,
          targetProgress: data.targetProgress || 100,
          deadline: data.deadline?.toDate ? data.deadline.toDate() : new Date(data.deadline),
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
          status: data.status || 'active',
        });
      });
      return goals;
    } catch (error) {
      console.error('Firestore getCooperationGoals error', error);
      return [];
    }
  }

  static async createCooperationGoal(goal: Omit<CooperationGoal, 'id' | 'createdAt' | 'status'>): Promise<CooperationGoal> {
    try {
      const id = `goal-${Date.now()}`;
      const ref = doc(this.cooperationCollection(), id);
      const payload = {
        ...goal,
        id,
        createdAt: new Date(),
        status: 'active',
      } as any;
      await setDoc(ref, payload);
      return { ...payload } as CooperationGoal;
    } catch (error) {
      console.error('Firestore createCooperationGoal error', error);
      throw error;
    }
  }

  static async updateGoalProgress(goalId: string, progress: number): Promise<CooperationGoal> {
    try {
      const ref = doc(this.cooperationCollection(), goalId);
      await updateDoc(ref, { currentProgress: progress, status: progress >= 100 ? 'completed' : 'active' });
      const snap = await getDoc(ref);
      const data = snap.data() as any;
      return {
        id: snap.id,
        title: data.title,
        description: data.description,
        creatorId: data.creatorId,
        participantIds: data.participantIds || [],
        currentProgress: data.currentProgress || 0,
        targetProgress: data.targetProgress || 100,
        deadline: data.deadline?.toDate ? data.deadline.toDate() : new Date(data.deadline),
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        status: data.status || 'active',
      } as CooperationGoal;
    } catch (error) {
      console.error('Firestore updateGoalProgress error', error);
      throw error;
    }
  }

  static userPointsCollection() {
    if (!db) throw new Error('Firestore not initialized');
    return collection(db as Firestore, 'userPoints');
  }

  static async getUserPoints(userId: string): Promise<UserPoints | null> {
    try {
      const q = query(this.userPointsCollection(), where('userId', '==', userId));
      const snap = await getDocs(q);
      if (snap.empty) return null;
      const d = snap.docs[0];
      const data = d.data() as any;
      return {
        userId: data.userId,
        points: data.points || 0,
        level: data.level || 1,
        weeklyPoints: data.weeklyPoints || 0,
        lastUpdated: data.lastUpdated?.toDate ? data.lastUpdated.toDate() : new Date(data.lastUpdated),
      } as UserPoints;
    } catch (error) {
      console.error('Firestore getUserPoints error', error);
      return null;
    }
  }

  static async addPoints(userId: string, points: number): Promise<UserPoints> {
    try {
      const existing = await this.getUserPoints(userId);
      if (!existing) {
        const ref = doc(this.userPointsCollection(), `points-${Date.now()}`);
        const payload = { userId, points, level: Math.floor(points / 100) + 1, weeklyPoints: points, lastUpdated: new Date() } as any;
        await setDoc(ref, payload);
        return payload as UserPoints;
      }

      // update existing (find its doc id)
      const q = query(this.userPointsCollection(), where('userId', '==', userId));
      const snap = await getDocs(q);
      const d = snap.docs[0];
      const data = d.data() as any;
      const newTotal = (data.points || 0) + points;
      const newLevel = Math.floor(newTotal / 100) + 1;
      const updated = { ...data, points: newTotal, level: newLevel, weeklyPoints: (data.weeklyPoints || 0) + points, lastUpdated: new Date() } as any;
      await setDoc(d.ref, updated, { merge: true });
      return updated as UserPoints;
    } catch (error) {
      console.error('Firestore addPoints error', error);
      throw error;
    }
  }

  static async resetWeeklyPoints(userId: string): Promise<UserPoints> {
    try {
      const q = query(this.userPointsCollection(), where('userId', '==', userId));
      const snap = await getDocs(q);
      if (snap.empty) throw new Error('User points not found');
      const d = snap.docs[0];
      const data = d.data() as any;
      const updated = { ...data, weeklyPoints: 0, lastUpdated: new Date() } as any;
      await setDoc(d.ref, updated, { merge: true });
      return updated as UserPoints;
    } catch (error) {
      console.error('Firestore resetWeeklyPoints error', error);
      throw error;
    }
  }

  // Similar translations for goals and points would be implemented here.
  // For brevity, only a subset is implemented as an example.
  static async getRanking(userIds: string[]): Promise<RankingEntry[]> {
    try {
      // Query points collection
  if (!db) throw new Error('Firestore not initialized');
  const firestore = db as Firestore;
  const q = query(collection(firestore, 'userPoints'), where('userId', 'in', userIds));
      const snap = await getDocs(q);
      const entries: RankingEntry[] = [];
      snap.forEach(d => {
        const data = d.data() as any;
        entries.push({
          rank: 0,
          userId: data.userId,
          name: data.name || 'Unknown',
          avatar: data.avatar || '👤',
          points: data.weeklyPoints || 0,
          level: data.level || 1,
          status: data.status || 'offline',
        });
      });

      entries.sort((a, b) => b.points - a.points);
      return entries.map((e, i) => ({ ...e, rank: i + 1 }));
    } catch (error) {
      console.error('Firestore getRanking error', error);
      return [];
    }
  }
}
