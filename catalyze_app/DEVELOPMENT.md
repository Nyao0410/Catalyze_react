# StudyNext React Native App - 開発ガイド

## 📋 現在の状態

### ✅ 完了したステップ（Phase 1-5）

1. **React Nativeプロジェクトのセットアップ**
   - Expo + TypeScriptでプロジェクト作成
   - 必要な依存関係のインストール完了
   - ロジック層（catalyze-ai）との連携設定

2. **プロジェクト構造とアーキテクチャの設計**
   - Clean Architectureに基づいたディレクトリ構造
   - 3層アーキテクチャ（Presentation / Application / Infrastructure）
   - 型定義とナビゲーション構造

3. **共通UIコンポーネントの作成**
   - Button: 4つのバリアント（primary, secondary, outline, text）
   - Card: 3つのスタイル（default, outlined, elevated）
   - Input: ラベル、エラー、アイコン対応
   - ProgressBar: 進捗表示コンポーネント
   - テーマシステム（colors, typography, spacing）

4. **ナビゲーション構造の実装**
   - React Navigation 7のセットアップ
   - Bottom Tab Navigator（4つのタブ）
   - Stack Navigator（モーダル画面用）
   - 型安全なナビゲーション

5. **状態管理とデータフェッチングの設定**
   - React Query (TanStack Query)のセットアップ
   - アプリケーションサービス層の実装
   - カスタムフック（useStudyPlans系）
   - インメモリリポジトリとの連携

### 🔲 次のステップ（Phase 6-10）

6. **学習計画一覧画面の実装**
   - プラン一覧の表示
   - フィルタリング機能
   - 進捗インジケーター
   - プラン作成への導線

7. **学習計画詳細画面の実装**
   - プラン詳細情報の表示
   - 進捗状況のビジュアライゼーション
   - 統計情報の表示

8. **学習計画作成・編集画面の実装**
   - フォームバリデーション
   - 日付ピッカー
   - 難易度選択
   - 学習日選択UI

9. **学習セッション記録画面の実装**
   - 学習記録入力フォーム
   - タイマー機能
   - 集中度・難易度入力UI

10. **復習管理画面の実装**
    - 今日の復習項目表示
    - 復習完了機能
    - 次回復習日の表示

## 🚀 アプリの起動方法

```bash
cd catalyze_app

# 開発サーバー起動
npm start

# iOSシミュレーター
npm run ios

# Androidエミュレーター
npm run android

# Web
npm run web
```

## 📁 プロジェクト構造

```
catalyze_app/
├── App.tsx                          # エントリーポイント
├── src/
│   ├── application/                 # アプリケーション層
│   │   └── services/               # サービス（ビジネスロジック）
│   │       ├── StudyPlanService.ts
│   │       ├── StudySessionService.ts
│   │       └── ReviewItemService.ts
│   ├── infrastructure/              # インフラ層
│   │   └── repositories/           # データアクセス
│   └── presentation/                # UI層
│       ├── components/             # 共通コンポーネント
│       │   ├── Button.tsx
│       │   ├── Card.tsx
│       │   ├── Input.tsx
│       │   └── ProgressBar.tsx
│       ├── screens/                # 画面
│       │   ├── PlansScreen.tsx
│       │   ├── TodayScreen.tsx
│       │   ├── ReviewScreen.tsx
│       │   └── StatsScreen.tsx
│       ├── navigation/             # ナビゲーション
│       │   ├── RootNavigator.tsx
│       │   └── MainTabNavigator.tsx
│       ├── hooks/                  # カスタムフック
│       │   └── useStudyPlans.ts
│       └── theme/                  # デザインシステム
│           ├── colors.ts
│           ├── typography.ts
│           └── spacing.ts
```

## 🎨 デザインシステム

### カラーパレット

```typescript
colors.primary        // #6366F1 (Indigo)
colors.secondary      // #10B981 (Green)
colors.accent         // #F59E0B (Amber)
colors.success        // #10B981
colors.warning        // #F59E0B
colors.error          // #EF4444
```

### コンポーネントの使い方

#### Button

```tsx
import { Button } from '@/presentation/components';

<Button
  title="保存"
  variant="primary"  // primary | secondary | outline | text
  size="medium"      // small | medium | large
  onPress={handleSave}
  loading={isLoading}
/>
```

#### Card

```tsx
import { Card } from '@/presentation/components';

<Card variant="elevated" padding="md">
  <Text>カードの内容</Text>
</Card>
```

#### Input

```tsx
import { Input } from '@/presentation/components';

<Input
  label="プラン名"
  placeholder="例: 数学の問題集"
  value={planName}
  onChangeText={setPlanName}
  error={errors.planName}
/>
```

#### ProgressBar

```tsx
import { ProgressBar } from '@/presentation/components';

<ProgressBar
  progress={0.65}
  label="進捗"
  showPercentage
  color={colors.primary}
/>
```

## 🔧 カスタムフックの使い方

### useStudyPlans

```tsx
import { useStudyPlans, useCreatePlan } from '@/presentation/hooks';

function MyComponent() {
  const userId = 'user-001';
  
  // 学習計画を取得
  const { data: plans, isLoading } = useStudyPlans(userId);
  
  // 学習計画を作成
  const createPlan = useCreatePlan();
  
  const handleCreate = async () => {
    await createPlan.mutateAsync(newPlan);
  };
}
```

## 🏗️ アーキテクチャの原則

### 1. 単一責任の原則
- 各コンポーネント/サービスは1つの責任のみを持つ

### 2. 依存性逆転の原則
- Presentation層 → Application層 → Domain層
- 上位層は下位層に依存するが、下位層は上位層を知らない

### 3. インターフェース分離の原則
- 必要なメソッドのみを公開

### 4. 開放閉鎖の原則
- 拡張に対して開いており、修正に対して閉じている

## 📝 開発のベストプラクティス

### TypeScript
```typescript
// ✅ Good: 明示的な型定義
interface PlanCardProps {
  plan: StudyPlanEntity;
  onPress: () => void;
}

// ❌ Bad: any型の使用
function handleData(data: any) { }
```

### React Native
```tsx
// ✅ Good: 関数コンポーネント + Hooks
const PlanCard: React.FC<PlanCardProps> = ({ plan, onPress }) => {
  return <Card onPress={onPress}>...</Card>;
};

// ❌ Bad: クラスコンポーネント
class PlanCard extends React.Component { }
```

### スタイリング
```typescript
// ✅ Good: StyleSheetの使用
const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
});

// ❌ Bad: インラインスタイル
<View style={{ padding: 16 }}>
```

## 🧪 テスト（今後実装予定）

```bash
# ユニットテスト
npm test

# カバレッジ
npm run test:coverage

# E2Eテスト（Detox）
npm run test:e2e
```

## 🚢 デプロイ

```bash
# ビルド（Expo EAS）
eas build --platform ios
eas build --platform android

# 提出
eas submit --platform ios
eas submit --platform android
```

## 📚 参考リンク

- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Query](https://tanstack.com/query/latest)
- [TypeScript](https://www.typescriptlang.org/)
- [Catalyze AI ロジック層](../catalyze_ai_ts/README.md)

## 🤝 コントリビューション

1. フィーチャーブランチを作成
2. 変更をコミット
3. プルリクエストを作成

## 📄 ライセンス

MIT
