# PlanDetailScreen 学習履歴改善 - 実装ドキュメント

## 概要

PlanDetailScreen（計画詳細画面）で学習履歴が多くなると画面が非常に長くなる問題を解決するため、以下の改善を実施しました：

1. **SessionHistoryScreen** - 全学習セッション履歴を表示する専用スクリーン
2. **PlanDetailScreen** - 直近3件のセッションのみ表示に削減
3. **「すべて見る」ボタン** - SessionHistoryScreen への遷移リンク

---

## 実装内容

### 1. SessionHistoryScreen (新規作成)

ファイル: `catalyze_app/src/presentation/screens/SessionHistoryScreen.tsx`

#### 主な機能

**a) ヘッダーセクション**
- 計画名と戻るボタン
- スクロール可能な統計サマリーカード
  - セッション総数
  - 完了ユニット数
  - 学習時間（時間 + 分）
  - 平均集中度（%）

**b) フィルター機能**
```tsx
<TouchableOpacity onPress={() => setFilterDateRange('all')}>すべて</TouchableOpacity>
<TouchableOpacity onPress={() => setFilterDateRange('week')}>過去7日</TouchableOpacity>
<TouchableOpacity onPress={() => setFilterDateRange('month')}>過去30日</TouchableOpacity>
```

**c) セッション表示**
- 日付ごとにグループ化
- 新しい順にソート
- 各セッションの詳細情報
  - 時刻
  - パフォーマンス係数（%）
  - ユニット数、学習時間、難易度
  - 集中度バー
  - 編集・削除メニュー

**d) 空状態表示**
- セッションなし or フィルター条件でマッチなし

#### データ処理フロー

```
useStudyPlan(planId)
    ↓
useStudySessions(planId) ← 全セッション取得
    ↓
filterDateRange で日付フィルタリング
    ↓
groupSessionsByDate で日付ごとにグループ化
    ↓
sort で新しい順にソート
    ↓
FlatList でレンダリング
```

#### 統計情報の計算

```tsx
const totalSessions = sessions.length  // セッション総数
const totalUnits = sessions.reduce((sum, s) => sum + s.unitsCompleted, 0)  // 累計ユニット
const totalMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0)  // 累計分
const averageConcentration = sessions.length > 0
  ? Math.round((sessions.reduce((sum, s) => sum + s.concentration, 0) / sessions.length) * 100)
  : 0
```

#### テーマ対応

すべてのテキスト、背景色、ボーダーなど、`useTheme()` から取得した色を使用。
ダークモード・ライトモード自動対応。

---

### 2. PlanDetailScreen 修正

ファイル: `catalyze_app/src/presentation/screens/PlanDetailScreen.tsx`

#### 変更内容

**Before: 全セッション履歴を表示**
```tsx
// セッションの数に応じて画面が非常に長くなる
{Object.entries(groupSessionsByDate(sessions))
  .sort(...)
  .map(([date, daySessions]) => (
    // 全日付分の全セッションをレンダリング
    daySessions.map((session) => <SessionCard />)
  ))}
```

**After: 直近3件のみ表示 + 「すべて見る」ボタン**
```tsx
<View style={styles.sectionHeaderRow}>
  <Text style={[textStyles.h3, { color: colors.text }]}>学習履歴</Text>
  {sessions.length > 3 && (
    <TouchableOpacity
      onPress={() => navigation.navigate('SessionHistory', { planId: plan.id })}
    >
      <Text style={[textStyles.caption, { color: colors.primary, fontWeight: '600' }]}>
        すべて見る →
      </Text>
    </TouchableOpacity>
  )}
</View>

{/* 直近3件のみ表示 */}
{Object.entries(groupSessionsByDate(sessions))
  .sort(...)
  .flatMap(([date, daySessions]) => 
    daySessions.map((session) => ({ date, session }))
  )
  .slice(0, 3)  // ← 最初の3件のみ
  .map(({ date, session }) => <SessionCard />)}
```

#### 画面サイズへの影響

| 項目 | Before | After |
|------|--------|-------|
| セッション数 = 50 | 非常に長い（スクロール必須） | 短い（直近3件のみ） |
| セッション数 = 10 | 長い | 短い |
| セッション数 = 3 | 中程度 | 中程度 |

#### ボタンの表示条件

```tsx
{sessions.length > 3 && (
  // 「すべて見る」ボタンを表示（セッション4件以上の場合）
)}
```

---

### 3. ナビゲーション設定更新

ファイル: `catalyze_app/src/presentation/navigation/types.ts`

```tsx
export type RootStackParamList = {
  // ...既存のスクリーン...
  SessionHistory: { planId: string };  // ← 新規追加
  // ...
};
```

#### RootNavigator への登録

ファイル: `catalyze_app/src/presentation/navigation/RootNavigator.tsx`

```tsx
import { SessionHistoryScreen } from '../screens/SessionHistoryScreen';

// ...

<Stack.Screen
  name="SessionHistory"
  component={SessionHistoryScreen}
  options={{
    title: '学習履歴',
    headerStyle: {
      backgroundColor: colors.background,
    },
    headerTintColor: colors.text,
    headerTitleStyle: {
      color: colors.text,
    },
  }}
/>
```

#### スクリーンインデックスに追加

ファイル: `catalyze_app/src/presentation/screens/index.ts`

```tsx
export { SessionHistoryScreen } from './SessionHistoryScreen';
```

---

## UIデザイン

### SessionHistoryScreen レイアウト

```
┌─────────────────────────────────────┐
│ ← 学習履歴        [計画名]           │  ← ヘッダー
├─────────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ │
│ │  10  │ │ 150  │ │ 8h   │ │ 85%  │ │
│ │セッション│ユニット│ 時間│集中度 │  ← 統計カード（スクロール可）
│ └──────┘ └──────┘ └──────┘ └──────┘ │
├─────────────────────────────────────┤
│ [すべて] [過去7日] [過去30日]        │  ← フィルター
├─────────────────────────────────────┤
│ 2025年10月19日 (日)                 │
│ ┌─────────────────────────────────┐ │
│ │ 10:30  ■■■■■ 85%              │ │  ← セッションカード
│ │ 📚 5  ⏱ 45  ⚡ 難易度3/5        │ │
│ │ 集中度: [█████░░░░] 85%        │ │
│ └─────────────────────────────────┘ │
│                                      │
│ ┌─────────────────────────────────┐ │
│ │ 14:00  ■■■■░ 72%              │ │
│ │ 📚 8  ⏱ 60  ⚡ 難易度4/5        │ │
│ │ 集中度: [████░░░░░░] 72%       │ │
│ └─────────────────────────────────┘ │
│                                      │
│ 2025年10月18日 (土)                 │
│ ┌─────────────────────────────────┐ │
│ │ 09:15  ■■■■■ 92%              │ │
│ │ 📚 10 ⏱ 90  ⚡ 難易度3/5        │ │
│ │ 集中度: [██████░░░░] 92%       │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### PlanDetailScreen 修正後のレイアウト

```
┌─────────────────────────────────────┐
│ [計画名] [ステータス] [メニュー]    │  ← ヘッダー
├─────────────────────────────────────┤
│ 進捗状況                             │
│ ████████░░ 80%                      │
├─────────────────────────────────────┤
│ 統計情報                             │
│ [周回数] [推定時間] [残り日数] ...   │
├─────────────────────────────────────┤
│ ...その他セクション...               │
├─────────────────────────────────────┤
│ 学習履歴               すべて見る →  │  ← セクションヘッダー
│ ┌─────────────────────────────────┐ │
│ │ 10/19 10:30  ■■■■■            │ │
│ │ 📚 5  ⏱ 45  ⚡ 難易度3/5        │ │  ← 直近3件のセッション
│ │ 集中度: [█████░░░░] 85%        │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ 10/19 14:00  ■■■■░            │ │
│ │ 📚 8  ⏱ 60  ⚡ 難易度4/5        │ │
│ │ 集中度: [████░░░░░░] 72%       │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ 10/18 09:15  ■■■■■            │ │
│ │ 📚 10 ⏱ 90  ⚡ 難易度3/5        │ │
│ │ 集中度: [██████░░░░] 92%       │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## 改善のメリット

### 1. UX 改善
- **スクロール量削減** - PlanDetailScreen がコンパクト化
- **情報アクセス性向上** - 直近の学習を素早く確認可能
- **詳細確認が簡単** - 「すべて見る」1タップで専用スクリーンへ移動

### 2. パフォーマンス改善
- **レンダリング最適化** - PlanDetailScreen で最大3件のセッションのみレンダリング
- **メモリ効率** - SessionHistoryScreen は FlatList で仮想化（スクロール外のアイテムはアンロード）

### 3. 機能拡張
- **フィルター機能** - 期間による絞り込み
- **統計情報** - セッション数、総学習時間、平均集中度を一目で把握
- **編集・削除** - SessionHistoryScreen でもセッションを直接操作可能

---

## ナビゲーション構造

```
MainTabNavigator (Plans)
    ↓
PlansScreen
    ↓
PlanDetailScreen
    ├─ [タイマーを開始] → TimerScreen
    ├─ [完了] → completePlan()
    ├─ [一時停止/再開] → pausePlan() / resumePlan()
    └─ 学習履歴 [すべて見る →] → SessionHistory
         ↓
      SessionHistoryScreen
         ├─ フィルター (すべて/過去7日/過去30日)
         ├─ [編集] → RecordSession (sessionId)
         └─ [削除] → deleteSession()
```

---

## 依存する機能

| 機能 | ファイル | 説明 |
|------|---------|------|
| useStudyPlan | hooks/useStudyPlans.ts | 計画情報取得 |
| useStudySessions | hooks/useStudySessions.ts | セッション一覧取得 |
| useDeleteSession | hooks/useStudySessions.ts | セッション削除 |
| useTheme | theme/ThemeProvider.tsx | テーマ色取得 |
| navigation.navigate | navigation/types.ts | 画面遷移 |

---

## 型安全性

```tsx
// ナビゲーションパラメータ
type RootStackParamList = {
  SessionHistory: { planId: string };
}

// コンポーネント Props
type Props = RootStackScreenProps<'SessionHistory'>;

// ナビゲーション呼び出し
navigation.navigate('SessionHistory', { planId: plan.id });
```

---

## テーマ対応

両スクリーンともすべて `useTheme()` 経由で色を取得：

```tsx
const { colors } = useTheme();

// 使用例
<View style={{ backgroundColor: colors.background }}>
  <Text style={{ color: colors.text }}>テキスト</Text>
</View>
```

対応色：
- `background` - 背景色
- `card` - カード背景色
- `primary` - プライマリ色（ボタン、選択状態）
- `text` - テキスト色
- `textSecondary` - セカンダリテキスト色
- `border` - ボーダー色
- `success` - 成功色（パフォーマンス高）
- `warning` - 警告色
- `error` - エラー色

---

## スタイル共通化

両スクリーンで再利用される関数：

```tsx
// セッション日付ごとにグループ化
const groupSessionsByDate = (sessions: StudySessionEntity[]) => {
  return sessions.reduce((groups, session) => {
    const dateKey = format(session.date, 'yyyy-MM-dd');
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(session);
    return groups;
  }, {} as Record<string, StudySessionEntity[]>);
};

// パフォーマンス係数に基づいて色を返す
const getPerformanceColor = (colors: any, performanceFactor?: number) => {
  const pf = typeof performanceFactor === 'number' && Number.isFinite(performanceFactor) ? performanceFactor : 0;
  if (pf >= 0.8) return colors.success;
  if (pf >= 0.6) return colors.primary;
  if (pf >= 0.4) return colors.warning;
  return colors.error;
};
```

---

## 今後の拡張案

1. **検索機能** - セッション検索（日付、ユニット数など）
2. **エクスポート** - セッション履歴を CSV/PDF でエクスポート
3. **統計グラフ** - 学習トレンドをグラフで可視化
4. **セッション比較** - 複数セッションの比較表示
5. **フィルター拡張** - 難易度、集中度、パフォーマンスでフィルタ

---

## ファイル一覧

| ファイル | 変更内容 |
|---------|---------|
| `SessionHistoryScreen.tsx` | **新規作成** |
| `PlanDetailScreen.tsx` | 学習履歴セクション修正（直近3件に制限） |
| `navigation/types.ts` | SessionHistory ルート追加 |
| `navigation/RootNavigator.tsx` | SessionHistoryScreen 登録 |
| `screens/index.ts` | SessionHistoryScreen エクスポート |

---

