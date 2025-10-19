# TasksScreen 徹底分析ドキュメント

## 概要

TasksScreen は React Native で実装された学習タスク管理画面です。タブビューで「履歴」「今日」「予定」の3つのタブ（タブレット時は2つ）を表示し、ユーザーの学習進捗を管理します。

---

## 1. ファイル構成と依存関係

### メインファイル
- **TasksScreen.tsx** (約900行)
  - `TodayScreen` コンポーネント（エクスポート）
  - `HistoryTab`、`TodayTab`、`UpcomingTab` の3つのタブ実装
  - メニュー機能（編集・削除）
  - スプリットビュー（タブレット対応）

### 依存するコンポーネント
- **TaskCard.tsx** - 個別タスク表示カード
- **CalendarView.tsx** - 日付選択カレンダー
- **EmptyState** - 空状態表示

### 依存するフック
- `useDailyTasks` - 指定日のタスク取得
- `useTasksForDate` - 特定日付のタスク取得
- `useUpcomingTasks` - 今後N日間のタスク取得
- `useStudyPlans` - 学習計画一覧
- `useUserSessions` - ユーザーのセッション履歴
- `useDueReviewItems` - 期限の復習アイテム取得
- `useRecordReview`, `useUserReviewItems` - 復習管理

### ビジネスロジック層
- `ProgressAnalysisService` - 進捗分析
- `PlanStatus`, `DailyTaskEntity`, `StudySessionEntity` 型

---

## 2. UI構造（3つのタブ）

### 2.1 履歴タブ (HistoryTab)

#### 表示内容
- 実施したセッションを日付ごとにグループ化
- 新しい順にソート
- 各セッションのカード表示

#### セッションカード表示内容
```
┌─────────────────────────────────────┐
│ [計画名]              [時刻]   [⋮]  │  ← メニューボタン
│ ✅ 80%              │
├─────────────────────────────────────┤
│ 📚 5 ユニット  ⏱ 45分  ⚡ 難易度3/5 │
│ 集中度: [████████░░] 80%           │
└─────────────────────────────────────┘
```

#### 機能
- **メニュー機能** - 右側の「⋮」をタップで編集/削除メニュー表示
- **パフォーマンス色分け** - performanceFactor で色が変わる
  - >= 0.8: 緑（成功）
  - >= 0.6: 青（一次色）
  - >= 0.4: 黄（警告）
  - < 0.4: 赤（エラー）

#### コード実装
```tsx
const groupedSessions = sessions.groupBy(date)
  .sort((a, b) => b.localeCompare(a))  // 新しい順
  
FlatList で日付ごとにグループ化して表示
```

---

### 2.2 今日タブ (TodayTab)

#### 表示構成

```
┌─────────────────────────────────────┐
│ 📅 今日                              │
│ 2025年10月19日 (日)                  │
├─────────────────────────────────────┤
│ サマリーカード:                      │
│ [タスク数] [ユニット数] [推定時間]   │
├─────────────────────────────────────┤
│ 📚 日次タスク 1                      │
│ 📚 日次タスク 2                      │
│ 🔄 復習タスク 1                      │
│ 🔄 復習タスク 2                      │
├─────────────────────────────────────┤
│ 今後の復習予定 (セクション)         │
│ 10月20日 - 2個の復習                │
│ 10月21日 - 3個の復習                │
└─────────────────────────────────────┘
```

#### 表示ロジック: activeTasks の計算

```tsx
activeTasks = [
  // 1. 日次タスク（未完了のみ）
  ...todayTasks
    .map(task => {
      // 今日のセッションのみでフィルタ
      const planSessions = sessions.filter(s => 
        s.planId === plan.id && isToday(s.date)
      )
      
      // 範囲ベースで進捗計算（重複排除）
      const mergedCompleted = mergeRanges(completedRanges)
      const taskProgress = mergedCompleted / task.units
      
      // taskProgress === 1 の場合は return null（完了）
      if (taskProgress === 1) return null
      
      return { type: 'daily', task, plan, taskProgress, achievability }
    })
    .filter(item => item !== null),
    
  // 2. 復習タスク（今日期限のみ）
  ...buildReviewTasks()
]
```

##### 復習タスク生成ロジック (`buildReviewTasks`)

```tsx
// 今日の復習アイテムを planId × 日付 でグループ化
const groups = {}
dueReviewItems.forEach(r => {
  if (startOfDay(r.nextReviewDate).getTime() === today.getTime()) {
    const key = `${r.planId}_${today.getTime()}`
    groups[key] = { planId, date, units: [...] }
  }
})

// ユニット番号を連続範囲に統合
// 例: [1, 2, 3, 5, 6] → [{start:1,end:3}, {start:5,end:6}]
const mergeUnitsToRanges = (units: number[]) => { ... }

// グループごとに復習タスク生成
ranges.forEach(r => {
  const reviewTask = {
    id: `review-${planId}-${date}-${r.start}-${r.end}`,
    planId,
    startUnit: r.start,
    endUnit: r.end,
    units: r.units,
    reviewItemIds: [...] // 基になった復習アイテムID
  }
  
  // 進捗を計算
  const taskProgress = mergedCompleted / r.units
  if (taskProgress < 1) out.push(reviewTask)
})
```

#### 処理フロー図

```
useDailyTasks (今日のタスク) 
    ↓
useUserSessions (全セッション)
    ↓
useDueReviewItems (復習アイテム)
    ↓
activeTasks 計算
    ↓
フィルタリング（完了済みは除外）
    ↓
activeTasks 配列生成（日次 + 復習混在）
    ↓
TaskCard で表示
```

#### アクション処理

**タスク完了時の処理** (`handleTaskComplete`)

```tsx
handleTaskComplete(itemOrTask, maybeTask?) {
  // 復習タスク判定（複数シグナル）
  const isReviewType = wrapper?.type === 'review'
  const hasReviewIds = taskObj?.reviewItemIds?.length > 0
  const isReviewIdName = taskObj?.id.startsWith('review-')
  
  if (isReviewType || hasReviewIds || isReviewIdName) {
    // RecordSession へ遷移（セッション記録画面）
    // startUnit ～ endUnit の範囲で自動入力
    navigation.navigate('RecordSession', {
      planId: taskObj.planId,
      startUnit: taskObj.startUnit,
      endUnit: taskObj.endUnit
    })
  } else {
    // 通常タスク → セッション記録モーダルを開く
    navigation.navigate('RecordSession', {
      planId: task.planId,
      taskId: task.id
    })
  }
}
```

**リフレッシュ処理**
```tsx
const onRefresh = async () => {
  await refetchToday()  // React Query のリフレッシュ
}
```

#### タブレット対応 (isTablet = true)

スプリットビュー表示:
- **左:** CalendarView（日付選択）
- **右:** スクロール可能なタスクリスト

```tsx
if (isTablet) {
  const selectedDate = useState(new Date())
  const mergedActiveTasksForDate = activeTasks.filter(
    it => startOfDay(it.task.date) === startOfDay(selectedDate)
  )
  
  return (
    <View style={{ flexDirection: 'row' }}>
      <View style={{ width: '36%' }}>
        <CalendarView ... />
      </View>
      <View style={{ flex: 1 }}>
        <ScrollView>
          {mergedActiveTasksForDate.map(item => <TaskCard />)}
        </ScrollView>
      </View>
    </View>
  )
}
```

#### UpcomingReviewsSection（今後の復習予定）

```tsx
// 明日以降の復習をグループ化
const upcomingReviews = allReviewItems
  .filter(r => startOfDay(r.nextReviewDate) > today)
  .groupBy(r => format(r.nextReviewDate, 'yyyy-MM-dd'))
  .slice(0, 7)  // 7日分のみ
```

---

### 2.3 予定タブ (UpcomingTab)

#### 表示構成

```
┌─────────────────────────────────────┐
│ [カレンダー]                         │
│ 日付: 2025-10-25                    │
├─────────────────────────────────────┤
│ 2025年10月25日(土)のタスク           │
│                                      │
│ 📚 タスク 1 [70%]                    │
│ 📚 タスク 2 [50%]                    │
│ 🔄 復習 1 [30%]                      │
└─────────────────────────────────────┘
```

#### ロジック

1. **カレンダー日付選択** → `selectedDate` 更新
2. **タスク取得** - `useTasksForDate(userId, selectedDate)`
3. **復習タスク生成** - `buildReviewTasks()` で `selectedDate` のみフィルタ
4. **マークド日付計算** - `upcomingTasks` から30日分の日付をマーク

#### タスク計算ロジック

```tsx
const tasksForDate = useTasksForDate(userId, selectedDate)

const reviewTasksForDate = useMemo(() => {
  const selectedDateKey = startOfDay(selectedDate).getTime()
  
  // selectedDate に該当する復習アイテムのみ処理
  dueReviewItems.forEach(r => {
    const reviewDate = startOfDay(r.nextReviewDate)
    if (reviewDate.getTime() !== selectedDateKey) return
    // ...
  })
}, [selectedDate, dueReviewItems, plans, sessions])
```

#### タブレット対応

同様にスプリットビュー表示:
- **左:** CalendarView（日付選択）
- **右:** 選択日付のタスクリスト

---

## 3. ロジック解析

### 3.1 進捗計算（最も複雑な部分）

#### 概要
セッション実績から「タスク内でどれだけ進捗したか」を計算します。

#### 範囲ベース計算の理由
- **単純な加算では不正確** - 同じ範囲を2回実施した場合、重複を除外する必要
- **セッション範囲のマージ** - 重複する範囲を統合

#### 実装: mergedRanges 関数

```tsx
// 入力: [{ start: 1, end: 3 }, { start: 3, end: 5 }]
// 出力: [{ start: 1, end: 5 }]

const mergedRanges = (ranges) => {
  if (ranges.length === 0) return []
  const sorted = ranges.sort((a, b) => a.start - b.start)
  const merged = [sorted[0]]
  
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1]
    if (sorted[i].start <= last.end + 1) {
      // 重複 or 隣接 → マージ
      last.end = Math.max(last.end, sorted[i].end)
    } else {
      // ギャップあり → 新規
      merged.push(sorted[i])
    }
  }
  
  return merged
}
```

#### 進捗計算フロー

```tsx
// 今日のタスク範囲: 1~5 (units=5)
const task = { startUnit: 1, endUnit: 5, units: 5 }

// セッション実績
const sessions = [
  { startUnit: 1, endUnit: 3 },  // 1~3 完了
  { startUnit: 3, endUnit: 4 },  // 3~4 実施（重複）
]

// タスク範囲内のセッションのみ抽出
const planSessions = sessions.filter(s => s.planId === plan.id && isToday(s.date))

// セッション範囲とタスク範囲の交差を計算
const completedRanges = []
planSessions.forEach(session => {
  const overlapStart = Math.max(task.startUnit, session.startUnit)  // 1
  const overlapEnd = Math.min(task.endUnit, session.endUnit)        // 3
  if (overlapStart <= overlapEnd) {
    completedRanges.push({ start: overlapStart, end: overlapEnd })
  }
})
// completedRanges = [{ start: 1, end: 3 }, { start: 3, end: 4 }]

// マージ
const mergedCompleted = mergedRanges(completedRanges)
// mergedCompleted = [{ start: 1, end: 4 }]

// 進捗計算
const completedUnits = mergedCompleted.reduce((sum, r) => sum + (r.end - r.start + 1), 0)
// = 4
const taskProgress = Math.min(completedUnits / task.units, 1)
// = 4 / 5 = 0.8 (80%)
```

### 3.2 復習タスク生成ロジック

#### フロー図

```
useDueReviewItems (復習対象のアイテム取得)
    ↓ 
[ReviewItem, ReviewItem, ReviewItem, ...]
    ↓
planId × 日付 でグループ化
    ↓
{
  "plan1_2025-10-19": {
    planId: "plan1",
    date: Date,
    units: [
      { unit: 1, id: "review-1" },
      { unit: 2, id: "review-2" },
      { unit: 3, id: "review-3" },
    ]
  }
}
    ↓
ユニット番号を連続範囲に統合
[1, 2, 3] → [{ start: 1, end: 3, units: 3 }]
    ↓
各範囲ごとに合成復習タスク作成
reviewTask = {
  id: "review-plan1-1729363200000-1-3-0",
  planId: "plan1",
  startUnit: 1,
  endUnit: 3,
  units: 3,
  reviewItemIds: ["review-1", "review-2", "review-3"]
}
    ↓
progress 計算 (セッションデータから)
    ↓
progress < 1 のもののみリスト化
```

#### コード例

```tsx
// ユニット番号を連続範囲に変換
const mergeUnitsToRanges = (units: number[]) => {
  const sorted = Array.from(new Set(units)).sort((a, b) => a - b)
  const ranges = []
  let curStart = null, curEnd = null
  
  for (const u of sorted) {
    if (curStart === null) {
      curStart = u; curEnd = u
    } else if (u === curEnd + 1) {
      curEnd = u  // 連続 → 拡張
    } else {
      ranges.push({ start: curStart, end: curEnd, units: curEnd - curStart + 1 })
      curStart = u; curEnd = u  // 新規開始
    }
  }
  if (curStart !== null) ranges.push({ start: curStart, end: curEnd, units: curEnd - curStart + 1 })
  return ranges
}

// 例: [1, 2, 3, 5, 6] → [{ start: 1, end: 3, units: 3 }, { start: 5, end: 6, units: 2 }]
```

### 3.3 メニュー機能（編集・削除）

#### セッションメニュー（履歴タブ）

```tsx
// ステート
const [menuVisible, setMenuVisible] = useState(false)
const [selectedSession, setSelectedSession] = useState(null)
const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })

// メニューボタン押下時
handleMenuPress(session, event) {
  const { pageX, pageY } = event.nativeEvent
  setMenuPosition({ x: pageX, y: pageY })
  setSelectedSession(session)
  setMenuVisible(true)
}

// 編集アクション
handleEdit() {
  navigation.navigate('RecordSession', {
    planId: selectedSession.planId,
    sessionId: selectedSession.id  // 既存セッション ID 指定で編集モード
  })
}

// 削除アクション（確認ダイアログ表示）
handleDelete() {
  Alert.alert('確認', 'このセッションを削除しますか？', [
    { text: 'キャンセル', style: 'cancel' },
    {
      text: '削除',
      style: 'destructive',
      onPress: () => {
        deleteSession.mutate(selectedSession.id, {
          onSuccess: () => { /* キャッシュ更新 */ },
          onError: () => { /* エラー表示 */ }
        })
      }
    }
  ])
}
```

---

## 4. ホック・サービス層の依存関係

### 4.1 データ取得フロー

```
タスク表示画面マウント
    ↓
useDailyTasks() → React Query キャッシュ
    ↓ (キャッシュなし)
dailyTaskService.getTodayTasks(userId, date)
    ↓ (API呼び出し)
DailyTaskEntity[] 返却
    ↓
useMemo で activeTasks 計算
    ↓ (依存: todayTasks, sessions, dueReviewItems)
画面レンダリング
```

### 4.2 キャッシュ戦略

すべてのフックで `staleTime: 1000 * 60 * 5` (5分)

- **queryKey 構成**
  - `['dailyTasks', userId, dateKey]` - 日付単位でキャッシング
  - `['upcomingTasks', userId, days]` - 日数で区別
  - `['reviewItems', 'due', userId]` - 期限の復習

---

## 5. 懸念点と問題点

### 5.1 🔴 **パフォーマンス問題**

#### 問題 1: 複数の大規模 useMemo 計算

**箇所:** TodayTab の `activeTasks` 計算（約100行）

```tsx
const activeTasks = React.useMemo(() => {
  // 1. 日次タスク × セッション × 復習アイテム の3重ループ
  todayTasks.forEach(task => {
    sessions.filter(...).forEach(...)  // O(n×m)
  })
  
  // 2. 復習タスク生成ループ
  dueReviewItems.forEach(...)  // 内部で複数の計算
  
  return [...]
}, [todayTasks, plans, sessions, dueReviewItems, progressAnalysisService])
```

**時間計算量:** O(n × m × k)  
- n = タスク数
- m = セッション数
- k = 復習アイテム数

**影響:** セッション数が100を超える場合、レンダリング遅延の可能性

#### 問題 2: 重複した計算

**箇所:** `UpcomingTab` でも同じ `buildReviewTasks` ロジックを実装

```tsx
// TodayTab 内
const reviewTasksForDate = buildReviewTasks()  // 100行

// UpcomingTab 内
const reviewTasksForDate = buildReviewTasks()  // 同じ100行を重複
```

**改善策:**
```tsx
// 共通フックとして抽出
export const useBuildReviewTasks = (userId, targetDate, dueReviewItems, plans, sessions) => {
  return useMemo(() => {
    // 共通ロジック
  }, [dueReviewItems, plans, sessions, targetDate])
}
```

#### 問題 3: 不要な依存関係

```tsx
const activeTasks = useMemo(() => {
  // ...
}, [
  todayTasks,
  plans,
  sessions,  // 全セッション（大量）
  dueReviewItems,
  progressAnalysisService  // ← インスタンス毎回作成？
])
```

`progressAnalysisService` が毎回新規作成される場合、useMemo が毎フレーム実行される。

---

### 5.2 🟠 **ロジック複雑性**

#### 問題 1: 復習タスク ID の合成が脆弱

```tsx
const reviewTask = {
  id: `review-${planId}-${date.getTime()}-${r.start}-${r.end}-${idx}`,
  // ...
}

// これを検出
if (String(taskObj.id).startsWith('review-')) {
  // 復習タスク判定
}
```

**リスク:**
- 文字列パターンマッチングは脆弱
- `idx` パラメータが不安定（同じ復習でも異なる ID に）
- 復習タスク判定コード (`handleTaskComplete`) が複雑すぎる

```tsx
const isReviewType = wrapper && wrapper.type === 'review'
const hasReviewIds = taskObj && (taskObj.reviewItemIds && taskObj.reviewItemIds.length > 0)
const isReviewIdName = taskObj && typeof taskObj.id === 'string' && String(taskObj.id).startsWith('review-')
if (isReviewType || hasReviewIds || isReviewIdName) {
  // 3つの条件で判定... 複雑
}
```

#### 問題 2: 進捗計算の複雑性

**コード分散:**
- `TodayTab` 内の `mergedRanges` 関数
- `UpcomingTab` 内の `mergeReviewRanges` 関数（ほぼ同じ）
- DRY 原則違反

```tsx
// mergedRanges (TodayTab)
const mergedRanges = (ranges) => { ... }

// mergeReviewRanges (UpcomingTab) 
const mergeReviewRanges = (ranges) => { ... }  // ← ほぼ同じ関数を重複定義
```

**改善策:**
```tsx
// utils/rangeUtils.ts に統一
export const mergeRanges = (ranges: Array<{start: number, end: number}>) => {
  // 共通実装
}
```

#### 問題 3: 復習タスク生成コード (buildReviewTasks) が非常に長い

約50行のインライン関数で、複数の処理が混在:
1. グループ化
2. 範囲マージ
3. 進捗計算
4. フィルタリング

**改善策:**
```tsx
// reviewTaskGenerator.ts に分離
export const buildReviewTasks = (
  date: Date,
  dueReviewItems,
  plans,
  sessions
) => { ... }
```

---

### 5.3 🟠 **UI/UX 問題**

#### 問題 1: タブレットのスプリットビューが使いづらい

```tsx
if (isTablet) {
  const [selectedDate, setSelectedDate] = useState(new Date())
  // 左: カレンダー (36% 幅)
  // 右: タスク リスト (64% 幅)
}
```

**課題:**
- 36% の幅はカレンダーには狭い
- タスクとカレンダーの高さが不一致の場合、スクロール同期がない
- 日付選択時の反応が遅い可能性

#### 問題 2: 「今日」タブでのタスク完了時の UI フィードバック

```tsx
if (taskProgress === 1) return null  // フィルタリングで非表示
```

ユーザーが「今日」タブで完了記録すると、その瞬間にタスクが画面から消える。

**UX改善:**
- トースト通知で完了を表示
- アニメーションで段階的に消える

#### 問題 3: 空状態メッセージが統一されていない

```tsx
// HistoryTab
<EmptyState
  icon="time-outline"
  title="学習記録がありません"
  description="学習を始めて記録を残しましょう"
/>

// TodayTab
<EmptyState
  icon="calendar-outline"
  title={t('today.empty.title')}  // ← 別のキー
  description={t('today.empty.description')}
/>

// UpcomingTab
<EmptyState
  icon="calendar-outline"
  title="この日のタスクはありません"
  description="別の日を選択するか、学習計画を追加しましょう"
/>
```

---

### 5.4 🟠 **エラーハンドリング**

#### 問題 1: 復習タスク生成で try-catch で失敗を隠す

```tsx
...(function buildReviewTasks() {
  try {
    // ...
  } catch (e) {
    return []  // ← エラーが無視される
  }
})()
```

エラーが発生した場合、ユーザーは何も知らない状態で復習タスクが表示されません。

#### 問題 2: セッション削除時にエラーハンドリングが不十分

```tsx
deleteSession.mutate(selectedSession.id, {
  onSuccess: () => { ... },
  onError: () => {
    Alert.alert('エラー', 'セッションの削除に失敗しました')
  },
})
```

エラーメッセージがジェネリック。詳細なエラー情報がない。

---

### 5.5 🟡 **型安全性**

#### 問題 1: `any` 型の多用

```tsx
const handleMenuPress = (session: StudySessionEntity, event: any) => {
  // event: any ← 型安全でない
  const { pageX, pageY } = event.nativeEvent
}

const reviewTask = {
  // ... その他のフィールド
  reviewItemIds: units
    .filter((u) => u.unit >= r.start && u.unit <= r.end)
    .map((u) => u.id),
} as any  // ← as any で強制型変換

const handleTaskComplete = (itemOrTask: any, maybeTask?: any) => {
  // itemOrTask: any ← 型不明確
}
```

#### 問題 2: 型定義が散在

合成タスク（復習タスク）の型が定義されていない:

```tsx
// TasksScreen 内で即座に定義
const reviewTask = {
  id: `review-...`,
  planId,
  date,
  startUnit: r.start,
  endUnit: r.end,
  units: r.units,
  // ...
} as any  // 型なし
```

---

### 5.6 🟡 **キャッシュ戦略の問題**

#### 問題 1: 5分のキャッシュは短すぎる可能性

```tsx
staleTime: 1000 * 60 * 5,  // 5分
```

**シナリオ:**
- ユーザーが「今日」タブ ← 「履歴」タブ ← 「今日」タブ と切り替え
- 5分以内なら同じデータが再利用される
- しかし、同期が必要な場合もある

#### 問題 2: 手動リフレッシュ時の依存関係

```tsx
const { data: todayTasks = [], refetch: refetchToday } = useDailyTasks(userId)

const onRefresh = async () => {
  await refetchToday()  // ← useDailyTasks のみ更新
  // useUserSessions, useDueReviewItems は更新されない！
}
```

リフレッシュで一部のデータのみ更新されるため、不整合が発生する可能性。

---

### 5.7 🟡 **ナビゲーション**

#### 問題 1: RecordSession への遷移が複雑

```tsx
// 復習タスク
if (ids && ids.length > 0) {
  navigation.navigate('RecordSession', {
    planId: taskObj.planId,
    startUnit: taskObj.startUnit,
    endUnit: taskObj.endUnit
  })
  return
}

// フォールバック 1
const reviewId = taskObj?.reviewItemIds?.[0]
if (reviewId) {
  const found = dueReviewItems.find(r => r.id === reviewId)
  navigation.navigate('RecordSession', { planId: found.planId, startUnit: unit, endUnit: unit })
  return
}

// フォールバック 2
if (isReviewIdName) {
  navigation.navigate('RecordSession', {
    planId: taskObj?.planId,
    startUnit: taskObj?.startUnit,
    endUnit: taskObj?.endUnit
  })
  return
}

// フォールバック 3
if (taskObj) handleOpenSessionModal(taskObj)
```

ネストが深く、複数のパスが存在。バグの温床。

---

### 5.8 🟡 **テスト可能性**

#### 問題 1: ビジネスロジックが UI コンポーネント内に混在

- `activeTasks` 計算
- 復習タスク生成
- 進捗計算

→ すべて `TodayTab` 関数内で実装
→ ユニットテストが書きづらい

#### 問題 2: 依存注入がない

```tsx
const progressAnalysisService = new ProgressAnalysisService()  // グローバル
```

---

## 6. 改善提案

### 6.1 アーキテクチャ改善

#### 提案 1: ビジネスロジックを分離

```tsx
// services/taskComputationService.ts

export class TaskComputationService {
  // 進捗計算を統一
  calculateProgress(
    task: DailyTaskEntity,
    sessions: StudySessionEntity[]
  ): number { ... }

  // 復習タスク生成
  buildReviewTasks(
    date: Date,
    dueReviewItems,
    plans,
    sessions
  ): ReviewTaskEntity[] { ... }

  // 活動タスク生成
  computeActiveTasks(
    date: Date,
    todayTasks,
    dueReviewItems,
    plans,
    sessions
  ): (DailyTaskEntity | ReviewTaskEntity)[] { ... }
}

// 使用
const taskComputationService = new TaskComputationService()

const activeTasks = useMemo(() => {
  return taskComputationService.computeActiveTasks(
    today,
    todayTasks,
    dueReviewItems,
    plans,
    sessions
  )
}, [todayTasks, dueReviewItems])
```

#### 提案 2: 復習タスク型を定義

```tsx
// types/reviewTask.ts

export interface ReviewTaskEntity {
  type: 'review'
  id: string
  planId: string
  date: Date
  startUnit: number
  endUnit: number
  units: number
  estimatedMinutes: number
  reviewItemIds: string[]
  advice?: string
}

// 使用
const reviewTask: ReviewTaskEntity = {
  type: 'review',  // 型安全な判定
  id: generateReviewTaskId(...),  // ID 生成ロジック統一
  // ...
}

// 判定
if (task.type === 'review') {
  // TypeScript が task: ReviewTaskEntity と推論
}
```

#### 提案 3: Utility 関数として range 処理を統一

```tsx
// utils/rangeUtils.ts

export const mergeRanges = (
  ranges: Array<{ start: number; end: number }>
): Array<{ start: number; end: number }> => {
  if (ranges.length === 0) return []
  const sorted = ranges.sort((a, b) => a.start - b.start)
  const merged = [sorted[0]]
  
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1]
    if (sorted[i].start <= last.end + 1) {
      last.end = Math.max(last.end, sorted[i].end)
    } else {
      merged.push(sorted[i])
    }
  }
  return merged
}

export const calculateRangeUnits = (
  ranges: Array<{ start: number; end: number }>
): number => {
  return ranges.reduce((sum, r) => sum + (r.end - r.start + 1), 0)
}
```

---

### 6.2 パフォーマンス最適化

#### 提案 1: 大規模データセットの仮想化

```tsx
// 100以上のセッションがある場合、FlatList で仮想化
<FlatList
  data={groupedSessions}
  keyExtractor={(item) => item.date}
  renderItem={({ item }) => <DateGroup sessions={item.sessions} />}
  windowSize={10}  // 前後10行のみレンダリング
/>
```

#### 提案 2: activeTasks 計算の最適化

```tsx
// メモ化を細かくする
const dailyTasksComputed = useMemo(() => {
  return computeDailyTasks(todayTasks, sessions)
}, [todayTasks, sessions])

const reviewTasksComputed = useMemo(() => {
  return taskComputationService.buildReviewTasks(
    today,
    dueReviewItems,
    plans,
    sessions
  )
}, [dueReviewItems, plans, sessions])

const activeTasks = useMemo(() => {
  return [...dailyTasksComputed, ...reviewTasksComputed]
}, [dailyTasksComputed, reviewTasksComputed])
```

#### 提案 3: Progressive Loading

```tsx
// 最初は日次タスクのみ表示
const [showReviewTasks, setShowReviewTasks] = useState(false)

const activeTasks = useMemo(() => {
  return [
    ...dailyTasksComputed,
    ...(showReviewTasks ? reviewTasksComputed : [])
  ]
}, [dailyTasksComputed, reviewTasksComputed, showReviewTasks])
```

---

### 6.3 ロジック改善

#### 提案 1: ハンドラーの単純化

```tsx
// 現在（複雑）
const handleTaskComplete = (itemOrTask: any, maybeTask?: any) => {
  const wrapper = itemOrTask
  const taskObj = maybeTask || (wrapper && (wrapper.task || wrapper))
  const isReviewType = wrapper && wrapper.type === 'review'
  const hasReviewIds = taskObj && (taskObj.reviewItemIds && taskObj.reviewItemIds.length > 0)
  const isReviewIdName = taskObj && typeof taskObj.id === 'string' && String(taskObj.id).startsWith('review-')
  if (isReviewType || hasReviewIds || isReviewIdName) {
    // ...
  }
}

// 改善提案
const handleTaskComplete = (item: TaskItem) => {
  if (item.type === 'review') {
    handleReviewTaskComplete(item)
  } else {
    handleDailyTaskComplete(item)
  }
}

const handleReviewTaskComplete = (reviewTask: ReviewTaskEntity) => {
  navigation.navigate('RecordSession', {
    planId: reviewTask.planId,
    startUnit: reviewTask.startUnit,
    endUnit: reviewTask.endUnit,
    reviewItemIds: reviewTask.reviewItemIds
  })
}

const handleDailyTaskComplete = (dailyTask: DailyTaskEntity) => {
  navigation.navigate('RecordSession', {
    planId: dailyTask.planId,
    taskId: dailyTask.id
  })
}
```

#### 提案 2: リフレッシュ処理の統一

```tsx
const { 
  data: todayTasks, 
  refetch: refetchTodayTasks 
} = useDailyTasks(userId)

const { 
  data: sessions, 
  refetch: refetchSessions 
} = useUserSessions(userId)

const { 
  data: dueReviewItems, 
  refetch: refetchDueReviewItems 
} = useDueReviewItems(userId)

// すべてをリフレッシュ
const onRefresh = useCallback(async () => {
  await Promise.all([
    refetchTodayTasks(),
    refetchSessions(),
    refetchDueReviewItems()
  ])
}, [refetchTodayTasks, refetchSessions, refetchDueReviewItems])
```

---

### 6.4 UI/UX 改善

#### 提案 1: タブレット用スプリットビューのレスポンシブ化

```tsx
if (isTablet) {
  const calendarWidth = useWindowDimensions().width > 1200 ? '40%' : '36%'
  
  return (
    <View style={{ flexDirection: 'row' }}>
      <View style={{ width: calendarWidth, maxHeight: '100%' }}>
        <CalendarView />
      </View>
      <View style={{ flex: 1 }}>
        <ScrollView scrollEnabled>
          {/* タスクリスト */}
        </ScrollView>
      </View>
    </View>
  )
}
```

#### 提案 2: タスク完了時のアニメーション

```tsx
const [completingTaskId, setCompletingTaskId] = useState<string | null>(null)

const handleTaskComplete = (item) => {
  setCompletingTaskId(item.task.id)
  
  setTimeout(() => {
    // 記録画面へ遷移（既存ロジック）
    navigation.navigate('RecordSession', { ... })
    
    // 少し遅延後に UI を更新
    setCompletingTaskId(null)
  }, 300)
}

// Animated.View で段階的に消す
<Animated.View style={[styles.taskCard, {
  opacity: completingTaskId === item.task.id ? 0.5 : 1,
  transform: [{
    scale: completingTaskId === item.task.id ? 0.95 : 1
  }]
}]}>
  <TaskCard ... />
</Animated.View>
```

#### 提案 3: エラー表示の強化

```tsx
const [errorMessage, setErrorMessage] = useState<string | null>(null)

try {
  const reviewTasks = buildReviewTasks(...)
} catch (error) {
  console.error('復習タスク生成エラー:', error)
  setErrorMessage('復習タスクの読み込みに失敗しました')
  
  // トースト通知
  showErrorToast('復習タスクが表示できません')
}

// UI に表示
{errorMessage && (
  <Banner
    visible={true}
    actions={[
      {
        label: '再試行',
        onPress: () => refetch()
      }
    ]}
    severity="warning"
  >
    {errorMessage}
  </Banner>
)}
```

---

### 6.5 テスト可能性の向上

#### 提案 1: ビジネスロジックのユニットテスト

```tsx
// __tests__/taskComputationService.test.ts

import { TaskComputationService } from '../services/taskComputationService'

describe('TaskComputationService', () => {
  let service: TaskComputationService

  beforeEach(() => {
    service = new TaskComputationService()
  })

  describe('calculateProgress', () => {
    it('単一セッションで進捗を計算できる', () => {
      const task = { startUnit: 1, endUnit: 5, units: 5 }
      const sessions = [{ startUnit: 1, endUnit: 3 }]
      
      const progress = service.calculateProgress(task, sessions)
      
      expect(progress).toBe(0.6)  // 3/5
    })

    it('重複するセッション範囲をマージできる', () => {
      const task = { startUnit: 1, endUnit: 5, units: 5 }
      const sessions = [
        { startUnit: 1, endUnit: 3 },
        { startUnit: 3, endUnit: 5 }
      ]
      
      const progress = service.calculateProgress(task, sessions)
      
      expect(progress).toBe(1.0)  // 1~5 = 完全
    })
  })

  describe('buildReviewTasks', () => {
    it('復習アイテムから合成タスクを生成できる', () => {
      const dueReviewItems = [
        { unitNumber: 1, planId: 'p1' },
        { unitNumber: 2, planId: 'p1' },
        { unitNumber: 3, planId: 'p1' }
      ]
      
      const reviewTasks = service.buildReviewTasks(new Date(), dueReviewItems, [], [])
      
      expect(reviewTasks).toHaveLength(1)
      expect(reviewTasks[0].startUnit).toBe(1)
      expect(reviewTasks[0].endUnit).toBe(3)
    })
  })
})
```

#### 提案 2: UI コンポーネントのスナップショットテスト

```tsx
// __tests__/TasksScreen.snapshot.test.tsx

describe('TasksScreen', () => {
  it('TodayTab を正しくレンダリングできる', () => {
    const { toJSON } = render(
      <TasksScreen />
    )
    
    expect(toJSON()).toMatchSnapshot()
  })

  it('タブレット時のスプリットビューを正しくレンダリングできる', () => {
    const { toJSON } = render(
      <TasksScreen />,
      { screen: { isTablet: true } }
    )
    
    expect(toJSON()).toMatchSnapshot()
  })
})
```

---

### 6.6 キャッシュ戦略の改善

#### 提案 1: キャッシュ時間の動的調整

```tsx
// キャッシュ設定を環境に応じて変更
const getCacheConfig = (screenFocus: boolean) => ({
  staleTime: screenFocus ? 1000 * 60 : 1000 * 60 * 5,  // 画面外は長めに
  gcTime: 1000 * 60 * 30,  // ガベージコレクション時間
})

export const useDailyTasks = (userId: string, focused: boolean) => {
  return useQuery({
    queryKey: ['dailyTasks', userId],
    queryFn: () => dailyTaskService.getTodayTasks(userId),
    ...getCacheConfig(focused)
  })
}
```

#### 提案 2: 手動リフレッシュの同期化

```tsx
const useRefreshAllTaskData = (userId: string) => {
  const { refetch: refetchTasks } = useDailyTasks(userId)
  const { refetch: refetchSessions } = useUserSessions(userId)
  const { refetch: refetchReview } = useDueReviewItems(userId)

  return useCallback(async () => {
    await Promise.all([
      refetchTasks(),
      refetchSessions(),
      refetchReview()
    ])
  }, [refetchTasks, refetchSessions, refetchReview])
}

// 使用
const onRefresh = useRefreshAllTaskData(userId)
```

---

## 7. サマリー

### 今日タブの処理フロー
```
今日のタスク取得 → セッション取得 → 復習アイテム取得
    ↓
activeTasks 計算（日次 + 復習の合成）
    ↓
完了済み（progress === 1）を除外
    ↓
TaskCard でレンダリング
    ↓
タスク完了時 → RecordSession へ遷移
```

### 予定タブの処理フロー
```
カレンダー日付選択
    ↓
該当日のタスク取得
    ↓
該当日の復習タスク生成
    ↓
TaskCard でレンダリング
    ↓
タスク完了時 → RecordSession へ遷移
```

### 主な改善ポイント
| 項目 | 現状 | 改善案 |
|------|------|--------|
| **パフォーマンス** | 大規模 useMemo | ロジック分離 + 仮想化 |
| **ロジック複雑性** | UI 内に混在 | 専用サービスに分離 |
| **型安全性** | `any` 型多用 | 型定義強化 |
| **テスト可能性** | 低い | ビジネスロジック分離 |
| **キャッシュ戦略** | 固定 5分 | 動的調整 + 同期リフレッシュ |
| **エラーハンドリング** | try-catch で隠す | ユーザーに通知 |
| **ナビゲーション** | 複数フォールバック | 型安全な単一フロー |

---

## 8. ファイル構造の提案

```
src/
  presentation/
    screens/
      TasksScreen.tsx (簡潔化)
    tabs/
      TodayTab.tsx (分離)
      UpcomingTab.tsx (分離)
      HistoryTab.tsx (分離)
    hooks/
      useTodayTasks.ts (新規)
      useReviewTaskComputation.ts (新規)
    services/
      taskComputationService.ts (新規)
      reviewTaskGenerator.ts (新規)
    utils/
      rangeUtils.ts (新規: range 処理統一)
      reviewTaskIdGenerator.ts (新規: ID 生成)
    types/
      reviewTask.ts (新規: 型定義)

catalyze_ai/
  src/
    domain/
      entities/
        reviewTask.ts (新規)
```

---

