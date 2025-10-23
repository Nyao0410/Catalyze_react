/**
 * StudyNext - AI Progress Simulator
 * AI の進捗シミュレーションロジック
 */

import type { AICompetitorPersonality, AICompetitionMatch } from '../../types';

export class AIProgressSimulator {
  /**
   * AIの性格タイプを定義
   */
  static readonly PERSONALITIES = {
    Easy: {
      difficulty: 'Easy' as const,
      dailyRate: 3,
      randomBonusMin: -2,
      randomBonusMax: 2,
      description: 'のんびり屋、でもそこそこ実力者',
    } as AICompetitorPersonality,
    
    Normal: {
      difficulty: 'Normal' as const,
      dailyRate: 5,
      randomBonusMin: -3,
      randomBonusMax: 5,
      description: '負けず嫌い、バランスの取れた実力',
    } as AICompetitorPersonality,
    
    Hard: {
      difficulty: 'Hard' as const,
      dailyRate: 8,
      randomBonusMin: -2,
      randomBonusMax: 8,
      description: '冷徹な戦略家、非常に実力者',
    } as AICompetitorPersonality,
    
    Extreme: {
      difficulty: 'Extreme' as const,
      dailyRate: 10,
      randomBonusMin: -5,
      randomBonusMax: 15,
      description: '超知的AI、予測不可能',
    } as AICompetitorPersonality,
  };

  /**
   * AI進捗を計算
   * @param personality - AIのパーソナリティ
   * @param elapsedDays - 競争開始からの経過日数
   * @param userProgress - ユーザーの現在進捗
   * @param targetProgress - 目標進捗
   * @param aiBaseProgress - AIのベース進捗（マッチ開始時）
   */
  static calculateAIProgress(
    personality: AICompetitorPersonality,
    elapsedDays: number,
    userProgress: number,
    targetProgress: number,
    aiBaseProgress: number = 0
  ): number {
    // 基本進捗 = 基始値 + (経過日数 * 日次レート) + ランダムボーナス
    const randomBonus = Math.random() * (personality.randomBonusMax - personality.randomBonusMin) + personality.randomBonusMin;
    let baseProgress = aiBaseProgress + (elapsedDays * personality.dailyRate) + randomBonus;

    // ユーザー反応ロジック
    const userRatio = userProgress / targetProgress;
    const aiRatio = baseProgress / targetProgress;

    // ユーザーがAIを大きく上回っている場合: AIが頑張る
    if (userRatio > aiRatio + 0.2) {
      baseProgress *= 1.3; // 30% 速くなる
    }
    // ユーザーがかなり遅れている場合: AIが余裕を見せる
    else if (userRatio < aiRatio - 0.3) {
      baseProgress *= 0.9; // 10% 遅くなる
    }

    // 目標進捗を超えないようにする
    return Math.min(baseProgress, targetProgress);
  }

  /**
   * マッチの勝敗を判定
   */
  static determineWinner(match: AICompetitionMatch): 'user_won' | 'ai_won' | 'draw' {
    const userReachedTarget = match.userProgress >= match.targetProgress;
    const aiReachedTarget = match.aiProgress >= match.targetProgress;

    if (userReachedTarget && !aiReachedTarget) {
      return 'user_won';
    } else if (aiReachedTarget && !userReachedTarget) {
      return 'ai_won';
    } else if (userReachedTarget && aiReachedTarget) {
      // 両方が目標に達した場合、より速く到達した方が勝ち
      // 同時の場合は引き分け
      return 'draw';
    } else {
      // 両方とも未到達: 進捗が多い方が勝つ
      if (match.userProgress > match.aiProgress) {
        return 'user_won';
      } else if (match.aiProgress > match.userProgress) {
        return 'ai_won';
      }
      return 'draw';
    }
  }

  /**
   * AI状態を文字列で取得（UIで使用）
   */
  static getAIStatus(
    aiProgress: number,
    targetProgress: number,
    userProgress: number,
    personality: AICompetitorPersonality
  ): string {
    const aiRatio = aiProgress / targetProgress;
    const userRatio = userProgress / targetProgress;

    if (aiProgress >= targetProgress) {
      return '🏁 ゴール完了!';
    }

    const isUserAhead = userRatio > aiRatio;
    const gapRatio = Math.abs(userRatio - aiRatio);

    if (isUserAhead && gapRatio > 0.3) {
      return '💪 追い上げ中...';
    } else if (!isUserAhead && gapRatio > 0.3) {
      return '😎 リードキープ中';
    } else if (gapRatio < 0.1) {
      return '⚡ 接戦中!';
    } else if (personality.difficulty === 'Easy' || personality.difficulty === 'Normal') {
      return '🤔 集中中...';
    } else {
      return '🧠 思考中...';
    }
  }

  /**
   * 推奨される日次進捗を計算
   * ユーザーが目標に到達するために必要な1日あたりの進捗を返す
   */
  static calculateRequiredDailyProgress(
    userProgress: number,
    targetProgress: number,
    remainingDays: number
  ): number {
    if (remainingDays <= 0) return 0;
    const needed = Math.max(0, targetProgress - userProgress);
    return needed / remainingDays;
  }

  /**
   * AI の予想終了日を計算
   */
  static estimateAICompletionDate(
    aiProgress: number,
    targetProgress: number,
    personality: AICompetitorPersonality
  ): Date {
    if (aiProgress >= targetProgress) {
      return new Date();
    }

    const remaining = targetProgress - aiProgress;
    const daysNeeded = Math.ceil(remaining / personality.dailyRate);
    const now = new Date();
    now.setDate(now.getDate() + daysNeeded);
    return now;
  }
}
