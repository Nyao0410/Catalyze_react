# アカウント画面のポイント・レベルシステム実装計画

## 概要
アカウント画面にポイントシステムとレベルアップメカニクスを導入し、ユーザーの学習進捗を可視化します。

---

## 1. 型定義の拡張

### ファイル: `src/types/account.ts`

既存の `UserProfile` に以下を追加:
```typescript
export interface UserProfile {
  userId: string;
  displayName: string;
  avatar: string;
  email: string;
  level: number;
  totalStudyHours: number;
  // 新規フィールド
  totalPoints: number;           // 累計獲得ポイント
  currentPoints: number;         // 現在のポイント（レベルアップに向けて）
  pointsToNextLevel: number;     // 次のレベルまでに必要なポイント
  levelUpProgress: number;       // 0-100%のレベルアップ進捗
  createdAt: Date;
  updatedAt: Date;
}
```

### ポイント獲得ルール:
- **学習セッション完了時**: 進捗時間 × 1ポイント（最小1pt、最大50pt/セッション）
- **1時間以上連続**: 5ボーナスポイント
- **レベルアップ時**: 100ボーナスポイント付与

### レベルアップシステム:
- レベル1→2: 100pt必要
- レベルn→n+1: 100 × n pt必要（累積）
  - Lv.1: 100pt
  - Lv.2: 200pt (合計 300pt)
  - Lv.3: 300pt (合計 600pt)
  - Lv.4: 400pt (合計 1000pt)
  - ...

---

## 2. サービス層の実装

### ファイル: `src/application/services/UserLevelService.ts`（新規作成）

メソッド:
- `calculatePointsForSession(durationMinutes: number, isBonusSession: boolean): number`
  - 学習セッションの実施時間からポイントを計算
  
- `calculatePointsRequiredForLevel(level: number): number`
  - 指定レベルまでに必要な累計ポイントを計算
  
- `calculateLevelFromPoints(totalPoints: number): { level: number; currentPoints: number; pointsToNextLevel: number; progress: number }`
  - ポイントからレベルと進捗を計算
  
- `updateUserProfileWithPoints(userId: string, pointsEarned: number): Promise<UserProfile>`
  - ユーザーにポイント付与し、プロフィール更新

---

## 3. フック統合

### ファイル: `src/presentation/hooks/useAccount.ts` に追加

新規フック:
- `useUpdateUserPoints()`
  - ポイント更新のMutation
  
- `useUserStats(userId: string)`
  - ユーザーの統計情報（レベル、ポイント、進捗率）を取得

---

## 4. UI コンポーネント実装

### ファイル: `src/presentation/screens/AccountScreen.tsx` 修正

#### プロフィールセクションの拡張:

1. **レベル表示を改善**
   - レベルバッジをより目立たせる
   - "Lv.X" + "★" を表示

2. **ポイント進捗表示**
   ```
   +----------------------------------+
   | Lv.5 ★★★★★                      |
   +----------------------------------+
   | 経験値: 750 / 1000pt              |
   | [████████░░░░░░░░░░░░░] 75%      |
   +----------------------------------+
   ```

3. **統計情報表示**
   - 総学習時間: XXh
   - 累計ポイント: XXXX pt
   - 現在のレベル: X
   - 次のレベルまで: XX pt

4. **レベルアップ通知**
   - レベルアップ時にアニメーション付きメッセージ表示
   - 報酬ポイントを表示

---

## 5. 学習セッション完了時の連携

### ファイル: `src/presentation/screens/RecordSessionScreen.tsx` に変更

セッション完了時:
1. ポイントを計算
2. `useUpdateUserPoints()` で更新
3. レベルアップした場合は通知を表示
4. 総学習時間も更新

---

## 6. テーマ対応

- 動的スタイルでテーマ色に対応
- ダークモード時の見た目最適化

---

## 実装手順

### Phase 1: 型と基礎サービス
1. ✅ `UserProfile` を拡張
2. ✅ `UserLevelService` を実装
3. ✅ ポイント計算ロジックを実装

### Phase 2: フック統合
4. ✅ `useAccount.ts` に新規フック追加
5. ✅ React Query との統合

### Phase 3: UI 実装
6. ✅ `AccountScreen.tsx` にポイント・レベル表示を追加
7. ✅ レベルアップ表示を実装

### Phase 4: セッション連携
8. ✅ `RecordSessionScreen.tsx` との連携

### Phase 5: テスト
9. ✅ 動作確認

---

## 利点

1. **ゲーミフィケーション**: ポイントとレベルでユーザー継続率向上
2. **目標明確化**: レベルアップまでの進捗が可視化される
3. **ボーナス機構**: 連続学習を促進
4. **ランキング連携**: ポイントがランキングにも反映（既存）

---

## 展開図

```
学習セッション完了
    ↓
ポイント計算（UserLevelService）
    ↓
プロフィール更新（AccountService）
    ↓
UIに反映（AccountScreen）
    ↓
レベルアップ時 → 通知表示
```

---

## 将来の拡張案

- アチーブメントシステム
- レベルごとのボーナス機能アンロック
- リーダーボード統合
- ポイント交換システム
