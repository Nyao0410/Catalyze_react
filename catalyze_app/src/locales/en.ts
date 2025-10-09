/**
 * StudyNext - English Translations
 * 英語翻訳ファイル
 */

export default {
  common: {
    loading: 'Loading...',
    error: 'Error',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    update: 'Update',
    close: 'Close',
    ok: 'OK',
    yes: 'Yes',
    no: 'No',
    confirm: 'Confirm',
    retry: 'Retry',
  },

  tabs: {
    plans: 'Plans',
    today: 'Today',
    review: 'Review',
    stats: 'Stats',
  },

  plans: {
    title: 'Study Plans',
    active: 'Active',
    paused: 'Paused',
    completed: 'Completed',
    empty: {
      title: 'No Plans',
      description: 'Create a new study plan to get started',
      action: 'Create Plan',
    },
    filter: {
      all: 'All',
      active: 'Active',
      paused: 'Paused',
      completed: 'Completed',
    },
    card: {
      deadline: 'Deadline',
      progress: 'Progress',
      remaining: 'Remaining',
      days: 'days',
      units: 'units',
    },
    detail: {
      title: 'Plan Details',
      pause: 'Pause',
      resume: 'Resume',
      complete: 'Complete',
      pauseConfirm: {
        title: 'Pause',
        message: 'Do you want to pause this plan?',
      },
      completeConfirm: {
        title: 'Complete Plan',
        message: 'Mark this plan as completed?',
      },
      completedMessage: 'Plan completed!',
      sections: {
        progress: 'Progress',
        stats: 'Statistics',
        studyDays: 'Study Days',
        sessionHistory: 'Session History',
        performance: 'Performance Analysis',
      },
      stats: {
        rounds: 'Rounds',
        estimatedTime: 'Est. Time (min)',
        remainingDays: 'Days Left',
        timeProgress: 'Time Progress',
      },
      performance: {
        averageEfficiency: 'Avg Efficiency',
        concentration: 'Concentration',
        difficulty: 'Difficulty',
        trend: 'Learning Trend',
        trendDescription: 'Trend over the past 7 days',
        achievability: 'Achievability',
        achievabilityDescription: 'Based on current progress and deadline',
      },
      sessionHistory: {
        empty: 'No study sessions yet',
        minutes: 'min',
      },
    },
    difficulty: {
      easy: 'Easy',
      normal: 'Normal',
      hard: 'Hard',
    },
  },

  createPlan: {
    title: 'Create New Plan',
    cancel: 'Cancel',
    save: 'Save',
    saving: 'Saving...',
    success: 'Success',
    successMessage: 'Study plan created!',
    error: 'Failed to create plan',
    titleLabel: 'Title',
    titlePlaceholder: 'e.g., TOEIC Preparation',
    totalUnits: 'Total Units',
    totalUnitsPlaceholder: 'e.g., 30',
    deadline: 'Deadline',
    deadlinePlaceholder: 'e.g., 2024-12-31',
    deadlineHint: 'Format: YYYY-MM-DD',
    difficulty: 'Difficulty',
    studyDays: 'Study Days',
    info: 'AI will automatically calculate the optimal study schedule',
    validation: {
      titleRequired: 'Please enter a title',
      unitsInvalid: 'Please enter a number greater than 0',
      deadlineInvalid: 'Please enter a valid deadline (YYYY-MM-DD format, future date)',
      studyDaysRequired: 'Please select at least one study day',
    },
  },

  review: {
    title: 'Review',
    loading: 'Loading review items...',
    empty: {
      title: 'No Review Items',
      description: 'No items due for review today. Great job!',
    },
    question: 'Question',
    answer: 'Answer',
    unit: 'Unit {{number}}',
    checkYourAnswer: 'Check your answer',
    showAnswer: 'Show Answer',
    quality: {
      title: 'Rate your understanding',
      0: 'Complete blackout',
      1: 'Barely recalled',
      2: 'Recalled with difficulty',
      3: 'Recalled with effort',
      4: 'Recalled smoothly',
      5: 'Easy recall',
    },
    stats: {
      repetitions: 'Repetitions',
      interval: 'Interval',
      days: 'days',
      easeFactor: 'Ease Factor',
    },
    info: 'Next review date is automatically adjusted based on SM-2 algorithm',
  },

  today: {
    title: 'Today\'s Tasks',
    empty: {
      title: 'No Tasks Today',
      description: 'Not a study day or all tasks completed',
    },
    summary: {
      plans: 'plans',
      units: 'units',
      estimatedTime: 'est. time',
    },
    task: {
      round: 'Round',
      about: 'about',
      minutes: 'min',
      progress: 'Progress',
      complete: 'Record Completion',
    },
    sessionRecord: {
      title: 'Study Record',
      unitsCompleted: 'Units Completed',
      duration: 'Duration (min)',
      concentration: 'Concentration',
      difficulty: 'Difficulty',
      round: 'Round',
      previous: 'Previous:',
      updated: 'Updated:',
      save: 'Save',
      saving: 'Saving...',
      success: 'Study record saved!',
      error: 'Failed to save',
      validation: {
        unitsRequired: 'Please enter units completed',
        durationRequired: 'Please enter study duration',
      },
    },
  },

  stats: {
    title: 'Statistics',
    loading: 'Loading statistics...',
    empty: {
      title: 'No Statistics',
      description: 'Statistics will appear once you start studying',
    },
    overall: {
      title: 'Overall Statistics',
      totalPlans: 'Total Plans',
      activePlans: 'Active',
      completedPlans: 'Completed',
      totalSessions: 'Total Sessions',
      totalHours: 'Total Hours',
      totalReviews: 'Total Reviews',
      dueReviews: 'Due Today',
      avgConcentration: 'Avg Concentration',
    },
    weekly: {
      title: 'This Week',
      sessions: 'Sessions',
      units: 'Units',
      minutes: 'Minutes',
      concentration: 'Avg Concentration',
    },
    monthly: {
      title: 'This Month',
      sessions: 'Sessions',
      units: 'Units',
      minutes: 'Minutes',
      concentration: 'Avg Concentration',
    },
  },

  achievability: {
    achieved: 'Achieved',
    comfortable: 'Comfortable',
    onTrack: 'On Track',
    challenging: 'Challenging',
    atRisk: 'At Risk',
    overdue: 'Overdue',
    impossible: 'Impossible',
  },

  trend: {
    improving: 'Improving',
    stable: 'Stable',
    declining: 'Declining',
  },

  status: {
    active: 'Active',
    paused: 'Paused',
    completed: 'Completed',
    completedToday: 'Completed Today',
  },

  weekdays: {
    short: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    long: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  },

  errors: {
    validation: 'Validation Error',
    loadFailed: 'Failed to load',
    saveFailed: 'Failed to save',
    deleteFailed: 'Failed to delete',
    networkError: 'Network error occurred',
    unknownError: 'Unknown error occurred',
  },
};
