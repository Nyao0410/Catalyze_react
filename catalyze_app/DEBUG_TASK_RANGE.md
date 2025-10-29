# タスク範囲デバッグガイド

## 問題
カレンダーで異なる日付を選択しても、常に「1 - 5」の同じ範囲のタスクが表示される。

## デバッグ手順

### 1. React Native コンソールログの確認
アプリを実行して、ブラウザまたは Expo の開発ツールコンソールで以下のログを確認してください。

#### 期待されるログ流れ:

**10月29日を選択した場合:**
```
[useDailyTasks.useTasksForDate] BEFORE query {
  dateInput: '2025-10-29T00:00:00.000Z',
  dateInputFormatted: '2025-10-29',
  keyDateStr: '2025-10-29',
  userId: 'user-001',
}
[DailyTaskService] Plan range info {
  planId: 'plan-xxx',
  date: '2025-10-29',
  rangeStart: 1,
  rangeEnd: 100,
  rangeTotal: 100,
}
[DailyTaskService] generateDailyTask: cutoffDate check {
  planId: 'plan-xxx',
  date: '2025-10-29',
  cutoffDate: '2025-10-28',
  totalSessions: 0,
  sessions: [],
}
[DailyTaskService] Completion calculation {
  date: '2025-10-29',
  cutoffDate: '2025-10-28',
  totalCompletedUnits: 0,
  sessionsBeforeDate: 0,
  totalSessionsCount: 0,
}
[DailyTaskService] After consuming completed units {
  date: '2025-10-29',
  remainingRangesCount: 1,
  firstRangeStart: 1,
  firstRangeEnd: 100,
}
[DailyTaskService] Task generated {
  date: '2025-10-29',
  startUnit: 1,
  endUnit: 5,  // dailyQuota が 5 だから
  units: 5,
}
[useDailyTasks.useTasksForDate] Result: {
  date: '2025-10-29',
  taskCount: 1,
  tasks: [{
    startUnit: 1,
    endUnit: 5,
    units: 5,
  }],
}
```

**10月30日を選択した場合:**
```
[useDailyTasks.useTasksForDate] BEFORE query {
  dateInput: '2025-10-30T00:00:00.000Z',
  dateInputFormatted: '2025-10-30',
  keyDateStr: '2025-10-30',
  userId: 'user-001',
}
[DailyTaskService] generateDailyTask: cutoffDate check {
  planId: 'plan-xxx',
  date: '2025-10-30',
  cutoffDate: '2025-10-29',
  totalSessions: 1,  // ← 10月29日のセッション
  sessions: [
    { date: '2025-10-29', round: 1, units: 5 },
  ],
}
[DailyTaskService] Completion calculation {
  date: '2025-10-30',
  cutoffDate: '2025-10-29',
  totalCompletedUnits: 5,  // ← 10月29日の完了分
  sessionsBeforeDate: 1,
  totalSessionsCount: 1,
}
[DailyTaskService] After consuming completed units {
  date: '2025-10-30',
  remainingRangesCount: 1,
  firstRangeStart: 6,  // ← 開始が 6 に移動
  firstRangeEnd: 100,
}
[DailyTaskService] Task generated {
  date: '2025-10-30',
  startUnit: 6,  // ← 6-10 として返される
  endUnit: 10,
  units: 5,
}
[useDailyTasks.useTasksForDate] Result: {
  date: '2025-10-30',
  taskCount: 1,
  tasks: [{
    startUnit: 6,
    endUnit: 10,
    units: 5,
  }],
}
```

## 問題の可能性

### 1. セッションが取得されていない
- `totalSessions: 0` のまま
- **解決**: Firestore にセッションデータが正しく保存されているか確認

### 2. セッションの日付が UTC になっている
- セッション日付が正しくパースされていない可能性
- **解決**: `startOfDay(s.date)` の処理を確認

### 3. dailyQuota が計算されていない
- `units` が常に 5 のままで、計算されていない
- **解決**: `DynamicQuotaCalculator` の処理を確認

## 確認方法

コンソールから手動で以下を実行:
```javascript
// Firestore から直接セッションを取得して確認
firebase.firestore().collection('users/user-001/sessions').get()
  .then(snapshot => {
    console.log('Sessions:', snapshot.docs.map(d => ({
      id: d.id,
      date: d.data().date,
      unitsCompleted: d.data().unitsCompleted,
      round: d.data().round,
    })));
  });
```
