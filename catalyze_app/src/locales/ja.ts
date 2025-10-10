/**
 * Catalyze AI - Japanese Translations
 * 日本語翻訳ファイル
 */

export default {
  common: {
    loading: '読み込み中...',
    error: 'エラー',
    save: '保存',
    cancel: 'キャンセル',
    delete: '削除',
    edit: '編集',
    create: '作成',
    update: '更新',
    close: '閉じる',
    ok: 'OK',
    yes: 'はい',
    no: 'いいえ',
    confirm: '確認',
    retry: '再試行',
  },

  tabs: {
    plans: '計画',
    today: 'タスク',
    tasks: 'タスク',
    review: '復習',
    stats: '統計',
  },

  plans: {
    title: '学習計画',
    active: '実行中',
    paused: '一時停止中',
    completed: '完了',
    empty: {
      title: '計画がありません',
      description: '新しい学習計画を作成して始めましょう',
      action: '計画を作成',
    },
    filter: {
      all: 'すべて',
      active: '実行中',
      paused: '一時停止',
      completed: '完了',
    },
    card: {
      deadline: '期限',
      progress: '進捗',
      remaining: '残り',
      days: '日',
      units: '単元',
      rounds: '回',
    },
    detail: {
      title: '計画詳細',
      pause: '一時停止',
      resume: '再開',
      complete: '完了',
      pauseConfirm: {
        title: '一時停止',
        message: 'この計画を一時停止しますか？',
      },
      completeConfirm: {
        title: '計画を完了',
        message: 'この計画を完了としてマークしますか？',
      },
      completedMessage: '計画が完了しました！',
      sections: {
        progress: '進捗状況',
        stats: '統計情報',
        studyDays: '学習曜日',
        sessionHistory: '学習履歴',
        performance: 'パフォーマンス分析',
      },
      stats: {
        rounds: '周回数',
        estimatedTime: '推定時間（分）',
        remainingDays: '残り日数',
        timeProgress: '時間進捗',
      },
      performance: {
        averageEfficiency: '平均効率',
        concentration: '集中度',
        difficulty: '難易度',
        trend: '学習トレンド',
        trendDescription: '過去7日間の学習傾向',
        achievability: '達成可能性',
        achievabilityDescription: '現在の進捗と期限から評価',
      },
      sessionHistory: {
        empty: 'まだ学習セッションがありません',
        minutes: '分',
      },
    },
    difficulty: {
      easy: '簡単',
      normal: '普通',
      hard: '難しい',
    },
  },

  createPlan: {
    title: '新規計画作成',
    cancel: 'キャンセル',
    save: '保存',
    saving: '保存中...',
    success: '作成成功',
    successMessage: '学習計画を作成しました！',
    error: '計画の作成に失敗しました',
    titleLabel: 'タイトル',
    titlePlaceholder: '例: TOEIC対策',
    totalUnits: '総単元数',
    totalUnitsPlaceholder: '例: 30',
    deadline: '期限',
    deadlinePlaceholder: '例: 2024-12-31',
    deadlineHint: '形式: YYYY-MM-DD',
    difficulty: '難易度',
    studyDays: '学習曜日',
    info: 'AI が最適な学習スケジュールを自動計算します',
    validation: {
      titleRequired: 'タイトルを入力してください',
      unitsInvalid: '単元数は1以上の数字を入力してください',
      deadlineInvalid: '有効な期限を入力してください（YYYY-MM-DD形式、未来の日付）',
      studyDaysRequired: '少なくとも1つの学習曜日を選択してください',
    },
    advanced: {
      open: '詳細設定を開く',
      close: '詳細設定を閉じる',
      targetRounds: '目標周回数',
      rounds: '初期周回',
      unitLabel: '単位ラベル',
      estimatedMinutesPerUnit: '単位あたり想定時間（分）',
    },
    advancedValidation: {
      targetRoundsInvalid: '目標周回数は1以上の整数を入力してください',
      roundsInvalid: '初期周回は1以上の整数を入力してください',
      roundsExceedTarget: '初期周回は目標周回数以下にしてください',
      estimatedMinutesInvalid: '単元あたり想定時間は1以上の分を入力してください',
      unitLabelRequired: '単位ラベルを入力してください',
    },
  },

  review: {
    title: '復習',
    loading: '復習項目を読み込んでいます...',
    empty: {
      title: '復習項目がありません',
      description: '今日復習すべき項目はありません。素晴らしいです！',
    },
    question: '問題',
    answer: '答え',
    unit: '第{{number}}単元',
    checkYourAnswer: '答えを確認してください',
    showAnswer: '答えを見る',
    quality: {
      title: '理解度を評価してください',
      0: '完全に忘れた',
      1: 'ほとんど思い出せない',
      2: '少し思い出せた',
      3: '思い出せたが難しかった',
      4: 'スムーズに思い出せた',
      5: '簡単だった',
    },
    stats: {
      repetitions: '復習回数',
      interval: '間隔',
      days: '日',
      easeFactor: '容易度',
    },
    info: 'SM-2アルゴリズムに基づいて次回復習日が自動調整されます',
  },

  today: {
    title: '今日のタスク',
    empty: {
      title: '今日のタスクはありません',
      description: '学習曜日に設定されていないか、すべてのタスクが完了しています',
    },
    summary: {
      plans: '計画',
      units: '単元',
      estimatedTime: '推定時間',
    },
    task: {
      round: 'Round',
      about: '約',
      minutes: '分',
      progress: '進捗',
      complete: '完了を記録',
    },
    sessionRecord: {
      title: '学習記録',
      unitsCompleted: '完了単元数',
      duration: '学習時間(分)',
      concentration: '集中度',
      difficulty: '難易度',
      round: 'ラウンド',
      previous: '前回:',
      updated: '更新後:',
      save: '保存',
      saving: '保存中...',
      success: '学習記録を保存しました！',
      error: '保存に失敗しました',
      validation: {
        unitsRequired: '完了単元数を入力してください',
        durationRequired: '学習時間を入力してください',
      },
    },
  },

  stats: {
    title: '統計',
    loading: '統計を読み込んでいます...',
    empty: {
      title: '統計データがありません',
      description: '学習を開始すると統計が表示されます',
    },
    overall: {
      title: '全体統計',
      totalPlans: '総計画数',
      activePlans: '実行中',
      completedPlans: '完了',
      totalSessions: '総セッション',
      totalHours: '総学習時間',
      totalReviews: '総復習項目',
      dueReviews: '今日の復習',
      avgConcentration: '平均集中度',
    },
    weekly: {
      title: '今週の統計',
      sessions: 'セッション数',
      units: '完了単元',
      minutes: '学習時間(分)',
      concentration: '平均集中度',
    },
    monthly: {
      title: '今月の統計',
      sessions: 'セッション数',
      units: '完了単元',
      minutes: '学習時間(分)',
      concentration: '平均集中度',
    },
  },

  achievability: {
    achieved: '達成済み',
    comfortable: '余裕',
    onTrack: '順調',
    challenging: '挑戦的',
    atRisk: '要注意',
    overdue: '期限切れ',
    impossible: '困難',
  },

  trend: {
    improving: '向上中',
    stable: '安定',
    declining: '低下中',
  },

  status: {
    active: '実行中',
    paused: '一時停止中',
    completed: '完了',
    completedToday: '本日完了',
  },

  weekdays: {
    short: ['日', '月', '火', '水', '木', '金', '土'],
    long: ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'],
  },

  errors: {
    validation: 'バリデーションエラー',
    loadFailed: '読み込みに失敗しました',
    saveFailed: '保存に失敗しました',
    deleteFailed: '削除に失敗しました',
    networkError: 'ネットワークエラーが発生しました',
    unknownError: '不明なエラーが発生しました',
  },
};
