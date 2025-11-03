# ポイント・レベルシステム実装完了ドキュメント

## 📋 実装概要

Catalyze React Native アプリケーションに**ポイント・レベルシステム**を実装しました。ユーザーが学習セッションを完了するたびにポイントを獲得し、累積ポイントに基づいてレベルが上昇します。

---

## 🎯 実装された機能

### 1. **ポイント計算システム** ✅
- **セッションポイント**: 学習時間 ÷ 60 分 = ポイント
  - 最小1pt、最大50pt
  - 1時間以上の連続学習でボーナス +5pt
- **継続ボーナス**: 1時間以上連続学習で 1.2倍乗算
- **時間ボーナス**: 総学習時間10時間ごとに +50pt

### 2. **レベルシステム** ✅
- **レベル計算式**:
  - Lv.1→2: 100pt必要
  - Lv.2→3: 200pt必要
  - Lv.n→n+1: 100×n pt必要
- **最大レベル**: 理論上無制限（設定に応じて調整可能）
- **進捗表示**: 0-100%のプログレスバー

### 3. **レベルアップボーナス** ✅
- **ボーナスポイント**: レベルアップ時に 100×(新レベル-前レベル) pt追加
- **自動適用**: レベルアップ検出時に自動付与

### 4. **UI表示機能** ✅
- **AccountScreen**:
  - 経験値プログレスバー
  - 現在レベルと次レベルまでの必要ポイント
  - 総ポイント表示（星アイコン付き）
  - 進捗率（%表示）
  
- **RecordSessionScreen**:
  - セッション完了時にトースト通知
  - ポイント獲得数表示
  - レベルアップ時に特別メッセージ表示

### 5. **レベルアップアニメーション** ✅
- **LevelUpModal コンポーネント**:
  - スケールアニメーション（0→1）
  - 回転アニメーション（星アイコン）
  - 自動閉鎖（2.5秒後）
  - グロー効果付きの華やかなデザイン

---

## 📂 実装ファイル一覧

### 新規作成ファイル

| ファイル | 説明 | 主要機能 |
|---------|------|--------|
| `src/application/services/UserLevelService.ts` | ポイント・レベル計算エンジン | 点数計算、レベル判定、ボーナス計算 |
| `src/presentation/components/LevelUpModal.tsx` | レベルアップアニメーション | モーダル表示、アニメーション実装 |

### 修正ファイル

| ファイル | 修正内容 |
|---------|--------|
| `src/types/account.ts` | UserProfile型に4フィールド追加 |
| `src/application/services/AccountService.ts` | addUserPoints()、getUserStats()メソッド追加 |
| `src/presentation/hooks/useAccount.ts` | useUpdateUserPoints()、useUserStats()フック追加 |
| `src/presentation/screens/AccountScreen.tsx` | ポイント・レベル表示セクション追加、スタイル定義追加 |
| `src/presentation/screens/RecordSessionScreen.tsx` | ポイント付与ロジック、アニメーション連携追加 |
| `src/application/services/chooser.ts` | AccountServiceInterface拡張 |

---

## 🔄 ワークフロー

```
ユーザーが学習セッション完了
    ↓
RecordSessionScreen.handleSave()実行
    ↓
useUpdateUserPoints()でポイント付与
    ↓
UserLevelService.checkLevelUp()でレベルアップ判定
    ↓
【レベルアップあり】
    ├─ ボーナスポイント追加
    ├─ UserProfile更新
    ├─ LevelUpModal表示（アニメーション）
    └─ トースト通知：「✨ +Xpt | Lv.yにレベルアップ!」
    
【レベルアップなし】
    ├─ 通常ポイント追加
    ├─ UserProfile更新
    └─ トースト通知：「+ Xpt」
    
    ↓
AccountScreen自動更新（キャッシュ無効化）
    ↓
ユーザーが新しいレベル・進捗を確認
```

---

## 💾 データ構造

### UserProfile拡張フィールド

```typescript
{
  // 既存フィールド...
  
  // 新規フィールド
  totalPoints: number;           // 累計ポイント（全期間）
  level: number;                 // 現在レベル
  currentPoints: number;         // 現在レベル内での進捗ポイント
  pointsToNextLevel: number;     // 次レベルまでに必要なポイント
  levelUpProgress: number;       // 進捗率 (0-100)
}
```

### ポイント付与の戻り値

```typescript
{
  // UserProfileの全フィールド...
  
  // レベルアップ情報
  leveledUp?: boolean;           // レベルアップしたか
  newLevel?: number;             // 新しいレベル
}
```

---

## 📊 ポイント計算例

### シナリオ1: 通常の学習セッション（30分）
```
セッション時間: 30分
基本ポイント: ceil(30/60) = 1pt
ボーナス: なし（1時間未満）
最終ポイント: 1pt

トースト表示: "セッションが記録されました + 1pt"
```

### シナリオ2: 連続学習セッション（90分）
```
セッション時間: 90分
基本ポイント: ceil(90/60) = 2pt
ボーナス: +5pt（1時間以上連続）
乗算: (2 + 5) × 1.2 = 8.4 → 8pt
最終ポイント: 8pt

トースト表示: "セッションが記録されました + 8pt"
```

### シナリオ3: レベルアップ（Lv.1→2）
```
前回総ポイント: 95pt
新規ポイント: 10pt
新総ポイント: 105pt

レベルアップ判定:
  - Lv.1: 0-99pt
  - Lv.2: 100-299pt ← 新しいレベル
  
レベルアップボーナス: 100 × 1 = 100pt
最終総ポイント: 105 + 100 = 205pt

レベル2内での進捗: 205 - 100 = 105pt
次レベルまで: 300 - 205 = 95pt必要

LevelUpModal表示：★回転アニメーション
トースト表示: "セッションが記録されました ✨ +10pt | Lv.2にレベルアップ!"
```

---

## 🎨 UI/UXの詳細

### AccountScreen（プロフィール表示）
```
┌─────────────────────────────────┐
│  Avatar | Lv.2 | 50時間 ⭐      │
├─────────────────────────────────┤
│  経験値                         │
│  115 / 200pt                     │
│ ██████░░░░░░░░░░░░░░ (57%)      │
│  次のレベルまで 85 pt            │
└─────────────────────────────────┘
```

### RecordSessionScreen（完了画面）
```
✅ セッションが記録されました + 8pt

【レベルアップ時】
✅ セッションが記録されました ✨ +15pt | Lv.3にレベルアップ!
  ↓
  [LevelUpModal表示]
  ┌──────────────────┐
  │    ⭐⭐⭐        │
  │ レベルアップ!     │
  │   Level 3        │
  │ おめでとうござい  │
  │   [続ける]       │
  └──────────────────┘
```

---

## 🔧 技術仕様

### UserLevelService メソッド

| メソッド | パラメータ | 戻り値 | 説明 |
|---------|-----------|--------|------|
| `calculatePointsForSession` | durationMinutes, isContinuous | number | セッションのポイント計算 |
| `calculatePointsRequiredForLevel` | targetLevel | number | 指定レベル到達に必要な累計ポイント |
| `calculateLevelFromPoints` | totalPoints | object | ポイントからレベルを逆算 |
| `checkLevelUp` | oldPoints, newPoints | object | レベルアップ判定 |
| `calculateBonusPointsFromHours` | totalHours | number | 時間ボーナス計算 |
| `calculateTotalPoints` | sessionPts, hours, bonus | number | 総ポイント計算 |
| `calculateRewardForLevel` | level | object | レベル別メッセージ |

### AccountService 拡張メソッド

```typescript
// ポイント付与（自動的にレベルアップを判定）
addUserPoints(pointsEarned: number, reason?: string): Promise<UserProfile & {
  leveledUp?: boolean;
  newLevel?: number;
}>

// ユーザー統計情報取得
getUserStats(): Promise<{
  level: number;
  totalPoints: number;
  currentPoints: number;
  pointsToNextLevel: number;
  levelUpProgress: number;
  totalStudyHours: number;
}>
```

---

## ✅ テストチェックリスト

- [x] ユーザープロフィールが新フィールドで初期化される
- [x] ポイント計算が正確に機能する
- [x] レベルアップが正しく判定される
- [x] レベルアップボーナスが付与される
- [x] AccountScreenに進捗バーが表示される
- [x] RecordSessionScreenでポイント通知が表示される
- [x] レベルアップ時にアニメーションが表示される
- [x] レベルアップモーダルが自動閉鎖される
- [x] キャッシュ無効化によりUI更新される
- [x] TypeScriptのコンパイルエラーがない

---

## 🚀 今後の拡張可能性

1. **ポイント履歴機能**
   - ユーザーがポイント獲得履歴を確認できる画面

2. **アチーブメント/バッジ**
   - 特定レベルや学習時間達成時のバッジ表示

3. **リーダーボード**
   - ユーザー間のポイントランキング

4. **レベル報酬**
   - レベルアップ時の特別機能ロック解除
   - カスタマイズオプション

5. **ポイント交換**
   - 獲得ポイントをプレミアム機能と交換

6. **ゲーミフィケーション強化**
   - コンボシステム
   - 週間チャレンジ
   - シーズンランキング

---

## 📝 実装者ノート

### 設計判定

1. **ポイント単位**: セッション時間（分）ベースで計算
   - 理由: 学習量に直結し、ユーザーに分かりやすい

2. **レベル要件**: 100×n の二次式
   - 理由: 初期は達成しやすく、後期は挑戦的になる進行曲線

3. **レベルアップボーナス**: 本レベルアップ時のみ
   - 理由: 達成時の喜びを最大化し、動機付けを強化

4. **モーダル表示**: アニメーション＆自動閉鎖
   - 理由: 華やかなUX体験とフロー中断の回避を両立

### パフォーマンス最適化

- UserLevelService は静的メソッド化で軽量
- ポイント計算はサーバー不要（オフライン対応）
- キャッシュ無効化を選別的に実施

---

## 📞 サポート

実装中に質問や問題が発生した場合は、以下を確認してください：

1. TypeScriptエラーがないか確認
2. UserProfile型の初期化値を確認
3. React Query キャッシュキーが正確か確認
4. 非同期処理の順序が正確か確認

---

**実装完了日**: 2024年
**バージョン**: 1.0
**ステータス**: 本番環境準備完了 ✅
