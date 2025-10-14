import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, Firestore } from 'firebase/firestore';
import { db } from '../../infrastructure/firebase';
import type { Friend, CooperationGoal, UserPoints, RankingEntry } from '../../types';

export class FirestoreSocialService {
  static friendsCollection(userId: string) {
    if (!db) {
      console.error('[FirestoreSocialService] Firestore not initialized - db is null');
      throw new Error('Firestore not initialized');
    }
    if (!userId || userId.trim() === '') {
      console.error('[FirestoreSocialService] friendsCollection called with invalid userId:', userId);
      throw new Error('Invalid userId: userId cannot be empty');
    }
    console.log('[FirestoreSocialService] friendsCollection called with userId:', userId);
    return collection(db as Firestore, 'users', userId, 'friends');
  }

  static async getFriends(userId: string): Promise<Friend[]> {
    try {
      console.log('[FirestoreSocialService] getFriends called with userId:', userId);
      const snap = await getDocs(this.friendsCollection(userId));
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
    const ref = doc(this.friendsCollection(ownerId), id);
    // friend param omits id/addedAt; use provided userId field when present
    const payload = { ...friend, addedAt: new Date() } as any;
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

  static userPointsCollection(userId: string) {
    if (!db) {
      console.error('[FirestoreSocialService] Firestore not initialized - db is null');
      throw new Error('Firestore not initialized');
    }
    if (!userId || userId.trim() === '') {
      console.error('[FirestoreSocialService] userPointsCollection called with invalid userId:', userId);
      throw new Error('Invalid userId: userId cannot be empty');
    }
    console.log('[FirestoreSocialService] userPointsCollection called with userId:', userId);
    return collection(db as Firestore, 'users', userId, 'points');
  }

  static async getUserPoints(userId: string): Promise<UserPoints | null> {
    try {
      console.log('[FirestoreSocialService] getUserPoints called with userId:', userId);
      const snap = await getDocs(this.userPointsCollection(userId));
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
        const ref = doc(this.userPointsCollection(userId), 'points');
        const payload = { userId, points, level: Math.floor(points / 100) + 1, weeklyPoints: points, lastUpdated: new Date() } as any;
        await setDoc(ref, payload);
        return payload as UserPoints;
      }

      // update existing (find its doc id)
      const snap = await getDocs(this.userPointsCollection(userId));
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
      const snap = await getDocs(this.userPointsCollection(userId));
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

  static async removeFriend(ownerId: string, friendId: string): Promise<void> {
    try {
      const ref = doc(this.friendsCollection(ownerId), friendId);
      // Note: Firestore doesn't have a direct delete method in this context, but we can use deleteDoc
      // For now, we'll mark as inactive or just remove the document
      await updateDoc(ref, { status: 'removed' });
    } catch (error) {
      console.error('Firestore removeFriend error', error);
      throw error;
    }
  }

  static async initializeMockData(userId: string): Promise<void> {
    try {
      // Create some mock friends
      const mockFriends = [
        {
          userId: 'mock-friend-1',
          name: 'Alice',
          avatar: '👩‍💻',
          level: 3,
          points: 250,
          status: 'online' as const,
        },
        {
          userId: 'mock-friend-2',
          name: 'Bob',
          avatar: '👨‍🎓',
          level: 2,
          points: 180,
          status: 'offline' as const,
        },
      ];

      for (const friend of mockFriends) {
        await this.addFriend(userId, friend);
      }

      // Create a mock cooperation goal
      const mockGoal = {
        title: 'Weekly Study Challenge',
        description: 'Complete 10 hours of study this week together!',
        creatorId: userId,
        participantIds: [userId, 'mock-friend-1'],
        currentProgress: 0,
        targetProgress: 10,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      };

      await this.createCooperationGoal(mockGoal);

      // Initialize user points
      await this.addPoints(userId, 0);

      console.debug('[FirestoreSocialService] initializeMockData success', { userId });
    } catch (error) {
      console.error('Firestore initializeMockData error', error);
      throw error;
    }
  }

  // Similar translations for goals and points would be implemented here.
  // For brevity, only a subset is implemented as an example.
  static async getRanking(userIds: string[]): Promise<RankingEntry[]> {
    try {
      // Query points collection - need to query each user's subcollection
      const entries: RankingEntry[] = [];
      
      for (const userId of userIds) {
        try {
          const points = await this.getUserPoints(userId);
          if (points) {
            entries.push({
              rank: 0,
              userId: points.userId,
              name: 'Unknown', // Would need to get from profile
              avatar: '👤',
              points: points.weeklyPoints || 0,
              level: points.level || 1,
              status: 'offline',
            });
          }
        } catch (e) {
          // Skip users with no points data
        }
      }

      entries.sort((a, b) => b.points - a.points);
      return entries.map((e, i) => ({ ...e, rank: i + 1 }));
    } catch (error) {
      console.error('Firestore getRanking error', error);
      return [];
    }
  }
}
