/**
 * StudyNext - User Level Service
 * ポイント計算とレベルアップシステム
 */

/**
 * ポイント・レベルシステム
 */
export class UserLevelService {
  /**
   * 学習セッションからポイントを計算
   * @param durationMinutes - セッション時間（分）
   * @param isContinuous - 1時間以上連続かどうか
   */
  static calculatePointsForSession(durationMinutes: number, isContinuous: boolean = false): number {
    // 基本: 分数 / 60 = 時間、1時間 = 1ポイント
    let basePoints = Math.ceil(durationMinutes / 60);
    
    // 最小1ポイント、最大50ポイント
    basePoints = Math.max(1, Math.min(50, basePoints));
    
    // 1時間以上連続の場合はボーナス
    if (isContinuous && durationMinutes >= 60) {
      basePoints += 5;
    }
    
    return basePoints;
  }

  /**
   * 指定レベルに到達するまでに必要な累計ポイントを計算
   * @param targetLevel - 目標レベル（1から始まる）
   * 
   * レベルアップ要件:
   * Lv.1→2: 100pt
   * Lv.2→3: 200pt (合計 300pt)
   * Lv.3→4: 300pt (合計 600pt)
   * ...
   */
  static calculatePointsRequiredForLevel(targetLevel: number): number {
    if (targetLevel <= 1) return 0;
    
    let totalPoints = 0;
    for (let i = 1; i < targetLevel; i++) {
      totalPoints += 100 * i;
    }
    return totalPoints;
  }

  /**
   * 現在のポイントからレベルと進捗を計算
   */
  static calculateLevelFromPoints(totalPoints: number): {
    level: number;
    currentPoints: number;
    pointsToNextLevel: number;
    progress: number; // 0-100
  } {
    let currentLevel = 1;
    let pointsUsed = 0;

    // 現在のレベルを計算
    while (true) {
      const pointsForNextLevel = 100 * currentLevel;
      if (pointsUsed + pointsForNextLevel <= totalPoints) {
        pointsUsed += pointsForNextLevel;
        currentLevel++;
      } else {
        break;
      }
    }

    // 現在のレベル内での進捗
    const pointsNeededForLevel = 100 * currentLevel;
    const currentLevelPoints = totalPoints - pointsUsed;
    const pointsToNextLevel = Math.max(0, pointsNeededForLevel - currentLevelPoints);
    const progress = Math.round((currentLevelPoints / pointsNeededForLevel) * 100);

    return {
      level: currentLevel,
      currentPoints: currentLevelPoints,
      pointsToNextLevel,
      progress,
    };
  }

  /**
   * レベルアップが起きたかを判定
   */
  static checkLevelUp(
    oldTotalPoints: number,
    newTotalPoints: number
  ): { leveledUp: boolean; oldLevel: number; newLevel: number; bonusPoints: number } {
    const oldState = this.calculateLevelFromPoints(oldTotalPoints);
    const newState = this.calculateLevelFromPoints(newTotalPoints);

    const leveledUp = newState.level > oldState.level;
    const bonusPoints = leveledUp ? 100 * (newState.level - oldState.level) : 0;

    return {
      leveledUp,
      oldLevel: oldState.level,
      newLevel: newState.level,
      bonusPoints,
    };
  }

  /**
   * 総学習時間からボーナスポイントを計算
   * @param totalHours - 総学習時間
   */
  static calculateBonusPointsFromHours(totalHours: number): number {
    // 10時間ごとに50ボーナスポイント
    const bonusPerTenHours = 50;
    return Math.floor(totalHours / 10) * bonusPerTenHours;
  }

  /**
   * ユーザーの累計ポイントを計算（学習時間 + セッション・その他ボーナス）
   */
  static calculateTotalPoints(
    studySessionsPoints: number,
    totalHours: number,
    otherBonusPoints: number = 0
  ): number {
    const hourBonusPoints = this.calculateBonusPointsFromHours(totalHours);
    return studySessionsPoints + hourBonusPoints + otherBonusPoints;
  }

  /**
   * レベルに応じた報酬を計算
   */
  static calculateRewardForLevel(level: number): {
    motivationalMessage: string;
    rewardPoints: number;
  } {
    const messages: { [key: number]: string } = {
      1: '学習を開始しました！',
      2: 'ペースをつかんできました！',
      3: '本気を感じます！',
      5: 'エキスパートレベルに到達！',
      10: 'マスターと呼ぶにふさわしい！',
      20: '伝説級の学習者です！',
      50: 'もはや勉強の化身！',
    };

    const message = messages[level] || `レベル${level}に到達！`;
    const rewardPoints = 100 * level; // レベルが高いほど報酬が多い

    return { motivationalMessage: message, rewardPoints };
  }

  /**
   * ポイント履歴エントリを生成
   */
  static generatePointEntry(
    reason: 'study_session' | 'level_up' | 'daily_bonus' | 'milestone' | 'other',
    points: number,
    description: string
  ): {
    reason: string;
    points: number;
    description: string;
    timestamp: Date;
  } {
    const reasonMap = {
      study_session: '学習セッション',
      level_up: 'レベルアップボーナス',
      daily_bonus: '日次ボーナス',
      milestone: 'マイルストーン',
      other: 'その他',
    };

    return {
      reason: reasonMap[reason],
      points,
      description,
      timestamp: new Date(),
    };
  }
}
