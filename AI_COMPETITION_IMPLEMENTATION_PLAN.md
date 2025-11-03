# AI 競争機能 - 実装計画

## 概要
ソーシャルスクリーンにAIキャラクターとの競争機能を追加し、ユーザーが友達だけでなくAIとも競い合えるようにする。

---

## 1. 型定義の追加

### ファイル: `src/types/social.ts`

新規追加する型：
- `AICompetitor`: AIキャラクターの情報
  - id: string
  - name: string
  - avatar: string
  - level: number
  - personality: string（性格、ロジック）
  - currentPoints: number
  - status: 'idle' | 'competing' | 'resting'
  
- `AICompetitionMatch`: AI競争マッチ
  - id: string
  - userId: string
  - aiCompetitorId: string
  - matchType: 'studyHours' | 'points' | 'streak'（競争のタイプ）
  - userProgress: number
  - aiProgress: number
  - targetProgress: number
  - duration: number（日数）
  - startDate: Date
  - endDate: Date
  - status: 'active' | 'completed' | 'user_won' | 'ai_won' | 'draw'
  - reward: number（勝利時のボーナスポイント）

---

## 2. サービス層の実装

### ファイル: `src/application/services/AICompetitionService.ts`（新規作成）

メソッド：
- `getAvailableAICompetitors(): Promise<AICompetitor[]>`
  - 利用可能なAIキャラクターリストを取得
  
- `getAICompetitorDetail(aiId: string): Promise<AICompetitor>`
  - 特定のAIキャラクターの詳細情報を取得
  
- `startCompetition(userId: string, aiId: string, matchType: string, duration: number): Promise<AICompetitionMatch>`
  - ユーザーがAIとの競争を開始
  - 初期値としてAIの進捗を生成（ランダム性を持たせる）
  
- `updateUserProgress(matchId: string, progress: number): Promise<AICompetitionMatch>`
  - ユーザーの進捗を更新
  - AI の進捗も更新（AI の行動ロジック）
  
- `simulateAIProgress(match: AICompetitionMatch): number`
  - AIの進捗をシミュレート
  - AIのパーソナリティ（難易度）に基づいて進捗を更新
  
- `getActiveMatches(userId: string): Promise<AICompetitionMatch[]>`
  - ユーザーの現在進行中の競争を取得
  
- `completeMatch(matchId: string): Promise<AICompetitionMatch>`
  - 競争を終了し、結果を確定
  - 勝敗判定とポイント配分

---

## 3. AI ロジックの実装

### ファイル: `src/application/services/AIProgressSimulator.ts`（新規作成）

機能：
- AIのパーソナリティごとに異なる進捗パターンを定義
  - `Easy`: 遅いペース、予測可能
  - `Normal`: 中程度のペース、ときどき頑張る
  - `Hard`: 速いペース、ランダムな加速
  - `Extreme`: 非常に速い、不規則な行動
  
- `calculateAIProgress(personality: string, elapsedDays: number, userProgress: number): number`
  - AIのパーソナリティと経過日数からAIの進捗を計算
  - ユーザーの進捗に反応して進捗を調整（競争感を高める）

---

## 4. Hooks の実装

### ファイル: `src/presentation/hooks/useSocial.ts` に追加

新規フック：
- `useAvailableAICompetitors()`
  - 利用可能なAIキャラクターリストを取得
  
- `useStartAICompetition()`
  - AI競争を開始するMutation
  
- `useActiveAIMatches(userId: string)`
  - ユーザーの現在進行中のAI競争を取得
  
- `useUpdateAIMatchProgress()`
  - AI競争のユーザー進捗を更新するMutation
  
- `useCompleteAIMatch()`
  - AI競争を完了するMutation

---

## 5. UI コンポーネントの実装

### ファイル: `src/presentation/screens/SocialScreen.tsx` 修正

#### タブタイプの拡張
```typescript
type TabType = 'cooperation' | 'ranking' | 'ai-competition';
```

#### 新しいタブボタン
- 「AI競争」タブを追加

#### `renderAICompetitionMode()` 関数
構成：
1. **AI競争一覧セクション**
   - 現在進行中のAI競争マッチを表示
   - マッチごとに：
     - AIの名前・アバター・性格（難易度）
     - ユーザーVS AI の進捗バー
     - 予想される結果（必要なペース表示）
     - 「詳細」ボタン
   
2. **新しい競争開始セクション**
   - 「新しいAI競争を開始」ボタン
   - クリックで AI選択画面に遷移

### ファイル: `src/presentation/screens/AICompetitionDetailScreen.tsx`（新規作成）

機能：
- AI競争の詳細ページ
- リアルタイムで進捗を表示・更新
- AIの現在の状態を表示（考え中、集中中、休憩中 など）
- ユーザーの学習セッション完了時に進捗が自動更新されるUI
- 競争終了時の結果表示と報酬の配分

### ファイル: `src/presentation/screens/SelectAICompetitorScreen.tsx`（新規作成）

機能：
- 利用可能なAIキャラクターを一覧表示
- 各AIの説明（性格、難易度）
- 競争の種類選択（勉強時間、ポイント、ストリーク）
- 競争期間選択（1日、3日、7日）
- 「競争開始」ボタン

---

## 6. モックデータの追加

### ファイル: `src/application/services/AICompetitionService.ts`

デフォルトのAIキャラクター：
```
1. スマートネコ（Easy）
   - avatar: "🐱"
   - personality: "のんびり屋、でもそこそこ実力者"
   - 進捗: ゆっくり、安定

2. 熱血ウサギ（Normal）
   - avatar: "🐰"
   - personality: "負けず嫌い、バランスの取れた実力"
   - 進捗: 中程度、時々頑張る

3. 知的なフクロウ（Hard）
   - avatar: "🦉"
   - personality: "冷徹な戦略家、非常に実力者"
   - 進捗: 速い、計算高い

4. 不可解なAI（Extreme）
   - avatar: "🤖"
   - personality: "超知的AI、予測不可能"
   - 進捗: 非常に速い、不規則
```

---

## 7. 実装手順

### Phase 1: 基礎実装
1. ✅ 型定義を追加（social.ts）
2. ✅ AICompetitionService を実装
3. ✅ AIProgressSimulator を実装

### Phase 2: Hooks と統合
4. ✅ useSocial.ts にフックを追加
5. ✅ React Query と統合

### Phase 3: UI 実装
6. ✅ SocialScreen.tsx に AI競争タブを追加
7. ✅ AICompetitionDetailScreen を作成
8. ✅ SelectAICompetitorScreen を作成

### Phase 4: ナビゲーション統合
9. ✅ 画面遷移を設定
10. ✅ パラメータ渡し

### Phase 5: 統合テスト
11. ✅ 全体動作確認

---

## 8. 技術仕様

### AI 進捗計算ロジック

基本公式：
```
AIProgress = BaseProgress + (ElapsedDays * Personality.DailyRate) + RandomBonus
```

パーソナリティごとの設定：
- **Easy**: DailyRate = 3, RandomBonus: -2 ～ +2
- **Normal**: DailyRate = 5, RandomBonus: -3 ～ +5
- **Hard**: DailyRate = 8, RandomBonus: -2 ～ +8
- **Extreme**: DailyRate = 10, RandomBonus: -5 ～ +15

ユーザー反応ロジック：
- ユーザーの進捗がAIを上回った場合: AIが頑張る（進捗速度+30%）
- ユーザーがかなり遅れた場合: AIが余裕を見せる（進捗速度-10%）

---

## 9. 実装の利点

1. **ユーザーエンゲージメント向上**
   - 友達がいなくてもAIと競争できる
   - 常に相手がいるので学習のモチベーションアップ

2. **ゲーム性の追加**
   - 異なる難易度のAIで段階的に挑戦
   - 各AIのパーソナリティで独自の競争体験

3. **拡張性**
   - 将来的にAIキャラクターを追加可能
   - ストーリー機能と連携可能

---

## 10. 今後の拡張案

- AIキャラクターのストーリーモード
- AI との友情度システム
- コラボレーション（友達 + AI でのチーム競争）
- AIの進化システム（競争を通じてAIが強くなる）
