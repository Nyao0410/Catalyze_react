/**
 * StudyNext - AI Competition Service
 * AI競争システム - ユーザーとAI競争相手の進捗追跡
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AICompetitor, AICompetitionMatch, CompetitionMatchType } from '../../types';
import { AIProgressSimulator } from './AIProgressSimulator';
import { AccountService } from './AccountService';

const AI_COMPETITORS_KEY = '@studynext:ai_competitors';
const AI_MATCHES_KEY = '@studynext:ai_matches';

export class AICompetitionService {
  /**
   * デフォルトのAIキャラクターを取得（初期化時に使用）
   */
  private static getDefaultAICompetitors(): AICompetitor[] {
    return [
      {
        id: 'ai-cat',
        name: 'スマートネコ',
        avatar: '🐱',
        level: 8,
        personality: {
          difficulty: 'Easy',
          dailyRate: 2.5,
          randomBonusMin: 0.5,
          randomBonusMax: 1.5,
          description: 'のんびり屋だけど、実は賢い。',
        },
        bio: 'のんびり屋だけど、実は賢い。一緒にのんびり学べる相手。',
        baseWinRate: 0.4,
        totalMatches: 125,
        wins: 50,
      },
      {
        id: 'ai-rabbit',
        name: '熱血ウサギ',
        avatar: '🐰',
        level: 12,
        personality: {
          difficulty: 'Normal',
          dailyRate: 5.0,
          randomBonusMin: 1.0,
          randomBonusMax: 3.0,
          description: '負けず嫌いだけどフェア。',
        },
        bio: '負けず嫌いだけどフェア。いい勝負ができる。',
        baseWinRate: 0.55,
        totalMatches: 200,
        wins: 110,
      },
      {
        id: 'ai-owl',
        name: '知的なフクロウ',
        avatar: '🦉',
        level: 18,
        personality: {
          difficulty: 'Hard',
          dailyRate: 7.5,
          randomBonusMin: 2.0,
          randomBonusMax: 5.0,
          description: '冷徹な戦略家。',
        },
        bio: '冷徹な戦略家。真の実力を試したいなら相手はこいつ。',
        baseWinRate: 0.7,
        totalMatches: 300,
        wins: 210,
      },
      {
        id: 'ai-robot',
        name: '不可解なAI',
        avatar: '🤖',
        level: 25,
        personality: {
          difficulty: 'Extreme',
          dailyRate: 12.0,
          randomBonusMin: 5.0,
          randomBonusMax: 10.0,
          description: '超知的AI。何を考えているか不明。',
        },
        bio: '超知的AI。何を考えているか不明。真のチャンピオンのみがこいつを倒せる。',
        baseWinRate: 0.85,
        totalMatches: 500,
        wins: 425,
      },
    ];
  }

  /**
   * 利用可能なAIキャラクターを取得
   */
  static async getAvailableAICompetitors(): Promise<AICompetitor[]> {
    try {
      const data = await AsyncStorage.getItem(AI_COMPETITORS_KEY);
      if (!data) {
        // 初回実行時はデフォルトで初期化
        const competitors = this.getDefaultAICompetitors();
        await AsyncStorage.setItem(AI_COMPETITORS_KEY, JSON.stringify(competitors));
        return competitors;
      }
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to get AI competitors:', error);
      return this.getDefaultAICompetitors();
    }
  }

  /**
   * 特定のAIキャラクターの詳細を取得
   */
  static async getAICompetitorDetail(aiId: string): Promise<AICompetitor | null> {
    try {
      const competitors = await this.getAvailableAICompetitors();
      return competitors.find(c => c.id === aiId) || null;
    } catch (error) {
      console.error('Failed to get AI competitor detail:', error);
      return null;
    }
  }

  /**
   * AI競争を開始
   */
  static async startCompetition(
    userId: string,
    aiId: string,
    matchType: CompetitionMatchType,
    duration: number
  ): Promise<AICompetitionMatch> {
    try {
      const competitor = await this.getAICompetitorDetail(aiId);
      if (!competitor) {
        throw new Error('AI Competitor not found');
      }

      // マッチ設定
      const targetProgress = this.getTargetProgressByType(matchType);
      const aiInitialProgress = Math.random() * (targetProgress * 0.1); // AIは最初 0-10% の範囲でスタート

      const match: AICompetitionMatch = {
        id: `match-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        aiCompetitorId: aiId,
        matchType,
        userProgress: 0,
        aiProgress: aiInitialProgress,
        targetProgress,
        duration,
        startDate: new Date(),
        endDate: new Date(Date.now() + duration * 24 * 60 * 60 * 1000),
        status: 'active',
        reward: this.calculateReward(competitor.level, matchType),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // マッチを保存
      await this.saveMatch(match);
      return match;
    } catch (error) {
      console.error('Failed to start competition:', error);
      throw error;
    }
  }

  /**
   * ユーザーの進捗を更新してAIの進捗も計算
   */
  static async updateUserProgress(
    matchId: string,
    userProgress: number
  ): Promise<AICompetitionMatch> {
    try {
      const match = await this.getMatch(matchId);
      if (!match) {
        throw new Error('Match not found');
      }

      const competitor = await this.getAICompetitorDetail(match.aiCompetitorId);
      if (!competitor) {
        throw new Error('AI Competitor not found');
      }

      // ユーザー進捗を更新
      const updatedMatch: AICompetitionMatch = {
        ...match,
        userProgress: Math.min(userProgress, match.targetProgress),
      };

      // AIの進捗を再計算
      const elapsedDays = Math.floor(
        (new Date().getTime() - match.startDate.getTime()) / (24 * 60 * 60 * 1000)
      );

      updatedMatch.aiProgress = AIProgressSimulator.calculateAIProgress(
        competitor.personality,
        elapsedDays,
        updatedMatch.userProgress,
        match.targetProgress,
        match.aiProgress
      );

      updatedMatch.updatedAt = new Date();

      // ステータスを確認
      if (updatedMatch.userProgress >= match.targetProgress || updatedMatch.aiProgress >= match.targetProgress) {
        updatedMatch.status = 'completed';
        
        // 勝敗を判定
        const winner = AIProgressSimulator.determineWinner(updatedMatch);
        updatedMatch.status = winner;

        // 勝者の統計を更新
        if (winner === 'ai_won') {
          await this.updateAIStats(match.aiCompetitorId, true);
        } else if (winner === 'user_won') {
          await this.updateAIStats(match.aiCompetitorId, false);
        }
      }

      // マッチを保存
      await this.saveMatch(updatedMatch);
      return updatedMatch;
    } catch (error) {
      console.error('Failed to update user progress:', error);
      throw error;
    }
  }

  /**
   * ユーザーのアクティブなマッチを取得
   */
  static async getActiveMatches(userId: string): Promise<AICompetitionMatch[]> {
    try {
      const data = await AsyncStorage.getItem(AI_MATCHES_KEY);
      if (!data) return [];

      const allMatches: AICompetitionMatch[] = JSON.parse(data).map((m: any) => ({
        ...m,
        startDate: new Date(m.startDate),
        endDate: new Date(m.endDate),
        createdAt: new Date(m.createdAt),
        updatedAt: new Date(m.updatedAt),
      }));

      // ユーザーのプロフィールを取得して、ユーザーの進捗を同期
      const userProfile = await AccountService.getProfile();
      
      // アクティブなマッチのみをフィルタリング
      const activeMatches = allMatches.filter(m => m.userId === userId && m.status === 'active');
      
      // 各マッチに対して、マッチタイプに応じたユーザーの現在の進捗を反映
      const updatedMatches: AICompetitionMatch[] = activeMatches.map(match => {
        if (!userProfile) return match;
        
        // マッチタイプに応じてユーザーの進捗を取得
        let userCurrentProgress = match.userProgress;
        
        if (match.matchType === 'studyHours') {
          // 勉強時間から進捗を取得
          userCurrentProgress = userProfile.totalStudyHours;
        } else if (match.matchType === 'points') {
          // 現在のポイントから進捗を取得
          userCurrentProgress = userProfile.currentPoints;
        } else if (match.matchType === 'streak') {
          // ストリーク情報を取得（ここは後で実装可能なオプション）
          // 現在はuserProfileにはストリーク情報がないため、match.userProgressを使用
          userCurrentProgress = match.userProgress;
        }
        
        // 進捗が変わった場合、AIの進捗も再計算
        if (userCurrentProgress !== match.userProgress) {
          const updatedMatch = { ...match, userProgress: userCurrentProgress };
          
          // AIの進捗を再計算
          const competitor = { personality: { dailyRate: 5, randomBonusMin: 1, randomBonusMax: 3, difficulty: 'Normal' as const, description: '' } };
          const elapsedDays = Math.floor(
            (new Date().getTime() - match.startDate.getTime()) / (24 * 60 * 60 * 1000)
          );
          
          updatedMatch.aiProgress = AIProgressSimulator.calculateAIProgress(
            competitor.personality,
            elapsedDays,
            updatedMatch.userProgress,
            match.targetProgress,
            match.aiProgress
          );
          
          // ステータスを確認
          if (updatedMatch.userProgress >= match.targetProgress || updatedMatch.aiProgress >= match.targetProgress) {
            updatedMatch.status = 'completed';
            
            // 勝敗を判定
            const winner = AIProgressSimulator.determineWinner(updatedMatch);
            updatedMatch.status = winner;
          }
          
          updatedMatch.updatedAt = new Date();
          
          // マッチを保存
          this.saveMatch(updatedMatch);
          
          return updatedMatch;
        }
        
        return match;
      });

      return updatedMatches;
    } catch (error) {
      console.error('Failed to get active matches:', error);
      return [];
    }
  }

  /**
   * ユーザーの完了済みマッチを取得
   */
  static async getCompletedMatches(userId: string): Promise<AICompetitionMatch[]> {
    try {
      const data = await AsyncStorage.getItem(AI_MATCHES_KEY);
      if (!data) return [];

      const allMatches: AICompetitionMatch[] = JSON.parse(data).map((m: any) => ({
        ...m,
        startDate: new Date(m.startDate),
        endDate: new Date(m.endDate),
        createdAt: new Date(m.createdAt),
        updatedAt: new Date(m.updatedAt),
      }));

      return allMatches
        .filter(m => m.userId === userId && m.status !== 'active')
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    } catch (error) {
      console.error('Failed to get completed matches:', error);
      return [];
    }
  }

  /**
   * 単一のマッチを取得
   */
  static async getMatch(matchId: string): Promise<AICompetitionMatch | null> {
    try {
      const data = await AsyncStorage.getItem(AI_MATCHES_KEY);
      if (!data) return null;

      const allMatches: AICompetitionMatch[] = JSON.parse(data);
      const match = allMatches.find(m => m.id === matchId);

      if (!match) return null;

      // ユーザーのプロフィールを取得して、ユーザーの進捗を同期
      const userProfile = await AccountService.getProfile();
      
      let userCurrentProgress = match.userProgress;
      
      if (userProfile) {
        if (match.matchType === 'studyHours') {
          userCurrentProgress = userProfile.totalStudyHours;
        } else if (match.matchType === 'points') {
          userCurrentProgress = userProfile.currentPoints;
        }
        // ストリークはmatch.userProgressを使用
      }

      // 進捗が変わった場合、マッチを更新
      let updatedMatch: AICompetitionMatch = {
        ...match,
        userProgress: userCurrentProgress,
        startDate: new Date(match.startDate),
        endDate: new Date(match.endDate),
        createdAt: new Date(match.createdAt),
        updatedAt: new Date(match.updatedAt),
      };

      if (userCurrentProgress !== match.userProgress) {
        // AIの進捗を再計算
        const competitor = await this.getAICompetitorDetail(match.aiCompetitorId);
        if (competitor) {
          const elapsedDays = Math.floor(
            (new Date().getTime() - updatedMatch.startDate.getTime()) / (24 * 60 * 60 * 1000)
          );
          
          updatedMatch.aiProgress = AIProgressSimulator.calculateAIProgress(
            competitor.personality,
            elapsedDays,
            updatedMatch.userProgress,
            match.targetProgress,
            match.aiProgress
          );
          
          // ステータスを確認
          if (updatedMatch.userProgress >= match.targetProgress || updatedMatch.aiProgress >= match.targetProgress) {
            const winner = AIProgressSimulator.determineWinner(updatedMatch);
            updatedMatch.status = winner;
          }
          
          updatedMatch.updatedAt = new Date();
          
          // マッチを保存
          await this.saveMatch(updatedMatch);
        }
      }

      return updatedMatch;
    } catch (error) {
      console.error('Failed to get match:', error);
      return null;
    }
  }

  /**
   * マッチ種別から目標進捗を取得
   */
  private static getTargetProgressByType(matchType: CompetitionMatchType): number {
    switch (matchType) {
      case 'studyHours':
        return 50; // 50時間
      case 'points':
        return 1000; // 1000ポイント
      case 'streak':
        return 30; // 30日連続
      default:
        return 100;
    }
  }

  /**
   * 報酬を計算
   */
  private static calculateReward(aiLevel: number, matchType: CompetitionMatchType): number {
    const baseReward = aiLevel * 10;
    const typeMultiplier = matchType === 'studyHours' ? 1 : matchType === 'points' ? 1.2 : 1.5;
    return Math.floor(baseReward * typeMultiplier);
  }

  /**
   * マッチを保存
   */
  private static async saveMatch(match: AICompetitionMatch): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(AI_MATCHES_KEY);
      let allMatches: AICompetitionMatch[] = data ? JSON.parse(data) : [];

      const index = allMatches.findIndex(m => m.id === match.id);
      if (index >= 0) {
        allMatches[index] = match;
      } else {
        allMatches.push(match);
      }

      await AsyncStorage.setItem(AI_MATCHES_KEY, JSON.stringify(allMatches));
    } catch (error) {
      console.error('Failed to save match:', error);
      throw error;
    }
  }

  /**
   * AIの統計を更新
   */
  private static async updateAIStats(aiId: string, won: boolean): Promise<void> {
    try {
      const competitors = await this.getAvailableAICompetitors();
      const competitor = competitors.find(c => c.id === aiId);

      if (competitor) {
        competitor.totalMatches += 1;
        if (won) {
          competitor.wins += 1;
        }
        competitor.baseWinRate = competitor.wins / competitor.totalMatches;

        await AsyncStorage.setItem(AI_COMPETITORS_KEY, JSON.stringify(competitors));
      }
    } catch (error) {
      console.error('Failed to update AI stats:', error);
    }
  }

  /**
   * マッチをキャンセル
   */
  static async cancelMatch(matchId: string): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(AI_MATCHES_KEY);
      if (!data) return;

      let allMatches: AICompetitionMatch[] = JSON.parse(data);
      const match = allMatches.find(m => m.id === matchId);

      if (match) {
        match.status = 'completed'; // キャンセル状態を completed に
        await AsyncStorage.setItem(AI_MATCHES_KEY, JSON.stringify(allMatches));
      }
    } catch (error) {
      console.error('Failed to cancel match:', error);
      throw error;
    }
  }
}

