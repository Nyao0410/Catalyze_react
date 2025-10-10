# StudyNext App (React Native)

このリポジトリは StudyNext の React Native クライアント（Expo）です。開発用にローカルの AsyncStorage ベースのモックが提供されており、オプションで Firebase (Firestore + Auth) に切り替え可能です。

## 目次
- 概要
- 必要条件
- セットアップ (開発)
- Firebase を使う場合
- サービス切替 (Service Chooser)
- よくある問題と対処
- 開発コマンド

## 概要
- UI: タスク、プラン、統計、ソーシャル（協力・ランキング）、アカウント（プロフィール/設定）
- データ: デフォルトは AsyncStorage に保存（開発用モック）。Firestore 実装も用意しているため、切り替え可能。

## 必要条件
- Node.js (推奨: LTS)
- npm または yarn
- Expo CLI（ローカルで実行する場合）
- (オプション) Firebase プロジェクト（Anonymous Auth を有効にすること）

## セットアップ (開発)
1. 依存関係をインストール

```bash
cd catalyze_app
npm install
# または
yarn
```

2. 開発サーバーを起動（デフォルトは AsyncStorage を使用）

```bash
cd catalyze_app
npx expo start --clear
```

3. アプリをシミュレータや実機で開く。

## Firebase を使う場合
1. Firebase コンソールで新規プロジェクトを作成し、Authentication > Sign-in method で "Anonymous" を有効にしてください。
2. Firestore を有効化してください（必要ならルールを開発用に緩くしてください）。
3. `src/infrastructure/firebaseConfig.ts` を作成し、あなたの Firebase 設定（apiKey, authDomain, projectId など）を入力します。ローカルにしか置かないよう `.gitignore` に既に追加済みです。

例: `src/infrastructure/firebaseConfig.ts` (コミットしないでください)

```ts
export const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'your-app.firebaseapp.com',
  projectId: 'your-project-id',
  storageBucket: 'your-project-id.appspot.com',
  messagingSenderId: '...',
  appId: '...'
};
```

4. アプリで Firestore を使うには、サービス切替を有効化する必要があります（次の章を参照）。

## サービス切替 (Service Chooser)
- 実装場所: `src/application/services/chooser.ts`
- デフォルト: `USE_FIRESTORE = false`（AsyncStorage を使用）
- 切替方法:
  - 一時的に Firestore を使いたい場合は `chooser.ts` の `USE_FIRESTORE` を `true` に変更してください（または環境変数経由で切り替えする実装を追加することを推奨します）。
  - 切替後、アプリを再ビルド/再起動して Firestore 実装が利用されます。

呼び出し側（hooks / screens）は `src/application/services` から `AccountService` / `SocialService` をインポートしているため、変更は中央の `chooser` のみで済みます。

## よくある問題と対処
- Firebase の `auth/invalid-api-key` や構成エラーが出る場合: `src/infrastructure/firebaseConfig.ts` の値が正しいかを確認し、Anonymous Sign-in を有効にしてください。
- Expo のポート競合: 8081/8082 を使っているプロセスがあれば停止してください。
- TypeScript の deprecation 警告（moduleResolution の警告）: これは tsconfig の警告です。プロジェクトの TypeScript バージョン更新に伴う通知であり、`tsconfig.json` の `ignoreDeprecations` を設定して抑制できます。

## 開発コマンド
- 依存インストール: `npm install` / `yarn`
- 型チェック: `npx tsc --noEmit`
- テスト（パッケージ内）: `npm test` または `yarn test`
- Expo 起動: `npx expo start --clear`

## 追加の改善案
- chooser を環境変数で切り替える（`.env` + `babel-plugin-dotenv-import` など）
- Firestore 側のトランザクション強化（ポイントや進捗の同時更新）
- E2E テストの追加（Firestore 有効時のフロー検証）

---

必要ならこの README にさらにスクリーンショット、API 仕様、貢献ガイドを追加します。どの情報を優先しますか？
# StudyNext React Native App

StudyNext 学習支援アプリのReact Native実装です。

## プロジェクト構造

```
catalyze_app/
├── App.tsx                          # アプリのエントリーポイント
├── package.json
├── tsconfig.json
└── src/
    ├── application/                 # アプリケーション層
    │   └── services/               # アプリケーションサービス
    │       ├── StudyPlanService.ts
    │       ├── StudySessionService.ts
    │       ├── ReviewItemService.ts
    │       └── index.ts
    ├── infrastructure/              # インフラ層（将来的にFirebase等）
    │   └── repositories/
    └── presentation/                # プレゼンテーション層（UI）
        ├── components/             # 再利用可能なコンポーネント
        │   ├── Button.tsx
        │   ├── Card.tsx
        │   ├── Input.tsx
        │   ├── ProgressBar.tsx
        │   └── index.ts
        ├── screens/                # 画面コンポーネント
        │   ├── PlansScreen.tsx
        │   ├── TodayScreen.tsx
        │   ├── ReviewScreen.tsx
        │   └── StatsScreen.tsx
        ├── navigation/             # ナビゲーション設定
        │   ├── types.ts
        │   ├── RootNavigator.tsx
        │   ├── MainTabNavigator.tsx
        │   └── index.ts
        ├── hooks/                  # カスタムフック
        │   ├── useStudyPlans.ts
        │   └── index.ts
        └── theme/                  # デザインシステム
            ├── colors.ts
            ├── typography.ts
            ├── spacing.ts
            └── index.ts
```

## アーキテクチャ

### Clean Architecture

```
┌─────────────────────────────────────┐
│     Presentation Layer              │
│  UI Components, Screens, Hooks      │
└────────────┬────────────────────────┘
             │ uses
┌────────────▼────────────────────────┐
│     Application Layer               │
│  Services, Use Cases                │
└────────────┬────────────────────────┘
             │ uses
┌────────────▼────────────────────────┐
│     Domain Layer                    │
│  (catalyze-ai パッケージ)           │
│  Entities, Value Objects            │
└────────────▲────────────────────────┘
             │ implements
┌────────────┴────────────────────────┐
│     Infrastructure Layer            │
│  Repositories (In-Memory, Firebase) │
└─────────────────────────────────────┘
```

### 技術スタック

- **フレームワーク**: React Native + Expo
- **ナビゲーション**: React Navigation 7
- **状態管理**: React Query (TanStack Query)
- **スタイリング**: React Native StyleSheet
- **型安全性**: TypeScript
- **ロジック層**: catalyze-ai パッケージ

## セットアップ

### 依存関係のインストール

```bash
cd catalyze_app
npm install
```

### 開発サーバーの起動

```bash
npm start
```

### プラットフォーム別起動

```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

## 主要機能

### 1. プレゼンテーション層

#### コンポーネント
- **Button**: 汎用ボタンコンポーネント（4つのバリアント、3つのサイズ）
- **Card**: カード型コンテナ
- **Input**: テキスト入力フィールド
- **ProgressBar**: 進捗バー

#### テーマシステム
- **colors**: アプリ全体で統一された色定義
- **typography**: テキストスタイルとフォント設定
- **spacing**: マージン・パディングの統一

#### ナビゲーション
- **Bottom Tabs**: 4つのメインタブ（計画、今日、復習、統計）
- **Stack Navigator**: モーダル画面用のスタック

### 2. アプリケーション層

#### サービス
- **StudyPlanService**: 学習計画のCRUD操作
- **StudySessionService**: 学習セッションの管理
- **ReviewItemService**: 復習項目の管理（SM-2アルゴリズム）

### 復習アイテムの自動生成（セッション保存時）

- 挙動: 学習セッションを保存すると、そのセッションで完了したユニット範囲に対して復習アイテムが自動的に作成されます。既に同一 plan と unitNumber の復習アイテムが存在する場合は重複作成を行いません。
- 実装場所: `src/presentation/screens/RecordSessionScreen.tsx` のセッション作成処理内で作成処理を呼び出します。作成処理は `reviewItemService.createReviewItem` を呼びます。
- 初期 nextReviewDate: 自動生成されたアイテムはデフォルトで「翌日」を `nextReviewDate` に設定します（必要に応じて設定を変更可能）。
- 範囲の扱い: 作成時はユニット単位で ReviewItem を作成します。表示側 (`TasksScreen`) は同一日/同一 plan の隣接ユニットをまとめて1つのカードとして表示するため、ユーザーには範囲として見えます。
- 注意点: 大量のユニットを一度に作成するケースがある場合は、バルク作成 API の導入や範囲まとめで1件生成する設計も検討してください。


### 3. データ管理

#### React Query
- キャッシュ戦略
- 自動再フェッチ
- 楽観的更新
- エラーハンドリング

#### カスタムフック
- `useStudyPlans`: 学習計画の取得
- `useActivePlans`: アクティブな計画の取得
- `useCreatePlan`: 計画作成
- `useUpdatePlan`: 計画更新
- etc.

## 開発の進め方

### 完了したステップ

- ✅ プロジェクトのセットアップ
- ✅ ディレクトリ構造の作成
- ✅ テーマシステムの実装
- ✅ 基本コンポーネントの作成
- ✅ ナビゲーション構造の実装
- ✅ アプリケーションサービスの作成
- ✅ React Queryフックの作成

### 次のステップ

- ✅ 学習計画一覧画面の実装
- ✅  学習計画詳細画面の実装
- 🔲 学習計画作成・編集画面の実装
- 🔲 学習セッション記録画面の実装
- 🔲 復習管理画面の実装
- 🔲 統計画面の実装
- 🔲 Firebase連携（Firestore）
- 🔲 認証機能の追加
- 🔲 ユニットテストの追加

## コーディング規約

### TypeScript
- 型安全性を最優先
- `any`型の使用は最小限に
- インターフェースとタイプエイリアスを適切に使い分け

### React Native
- 関数コンポーネント + Hooksを使用
- Props interfaceは明示的に定義
- StyleSheetを使用したスタイリング

### ファイル命名
- コンポーネント: PascalCase（例: `Button.tsx`）
- フック: camelCase + useプレフィックス（例: `useStudyPlans.ts`）
- サービス: PascalCase + Serviceサフィックス（例: `StudyPlanService.ts`）

## テスト

```bash
# テスト実行（今後実装）
npm test

# カバレッジ
npm run test:coverage
```

## デプロイ

```bash
# Expoビルド
eas build --platform ios
eas build --platform android

# App Storeへの提出
eas submit --platform ios

# Google Playへの提出
eas submit --platform android
```

## ライセンス

MIT

## 参考

- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Query](https://tanstack.com/query/latest)
- [catalyze-ai ロジック層](../catalyze_ai_ts/README.md)

## ダークモード対応 (開発者向け)

`src/presentation/theme/colors.ts` にライト/ダーク両方のパレットが用意されています。既存の `colors` はライトテーマとしてそのまま利用でき、`getColors('dark')` でダークテーマを取得できます。

簡単な利用例（React Native）:

```tsx
import { useColorScheme } from 'react-native';
import { getColors } from './src/presentation/theme/colors';

function MyComponent() {
    const scheme = useColorScheme();
    const c = getColors(scheme === 'dark' ? 'dark' : 'light');

    return (
        // 例: 背景とテキスト色を使用
        <View style={{ backgroundColor: c.background }}>
            <Text style={{ color: c.text }}>こんにちは</Text>
        </View>
    );
}
```

また、`Appearance.getColorScheme()` を使って同期的に取得することもできます。

### ThemeProvider の利用例

アプリ全体でテーマを一元管理するには、`ThemeProvider` をルートでラップします。

`src/presentation/theme/ThemeProvider.tsx` を追加済みです。使い方の例:

```tsx
// App.tsx (簡略化)
import React from 'react';
import { ThemeProvider } from './src/presentation/theme/ThemeProvider';
import { MainNavigator } from './src/presentation/navigation/RootNavigator';

export default function App() {
    return (
        <ThemeProvider>
            <MainNavigator />
        </ThemeProvider>
    );
}
```

コンポーネント内での利用例:

```tsx
import React from 'react';
import { View, Text, Button } from 'react-native';
import { useTheme } from './src/presentation/theme/ThemeProvider';

export function SettingsRow() {
    const { colors, mode, setMode } = useTheme();

    return (
        <View style={{ backgroundColor: colors.card, padding: 12 }}>
            <Text style={{ color: colors.text }}>テーマ: {mode}</Text>
            <Button title="切替" onPress={() => setMode(mode === 'dark' ? 'light' : 'dark')} />
        </View>
    );
}


## タブレット対応 (追加情報)

このリポジトリにはタブレット画面（大きめの幅）での表示・操作性を改善するための基礎対応を追加しました。既存の挙動を壊さないように最小限の変更を行い、同様のパターンで他画面へ横展開できます。

主な変更点（コード）:

- `src/presentation/hooks/useResponsive.ts` を追加
    - 画面サイズを監視し、`width`, `height`, `isTablet`, `isLarge` を提供します。
    - 当面のブレークポイント: tablet >= 768px, large >= 1024px
- `src/presentation/theme/ThemeProvider.tsx` を更新
    - テーマコンテキストに `isTablet`, `width`, `height` を追加。`useTheme()` から一貫して参照できます。
- `src/presentation/components/Button.tsx` を更新
    - タブレットではパディング・最小高さ・フォントサイズをスケールするスタイルを追加（既存の props/variant/size は維持）。
- `src/presentation/screens/PlansScreen.tsx` を更新
    - タブレットで `FlatList` を 2 列のグリッド表示に切り替える処理を追加。列ラッパーとカード幅を調整。

動作確認手順:

1. TypeScript 型チェック

```bash
cd catalyze_app
npx tsc --noEmit
```

2. Expo で起動して UI を確認

```bash
cd catalyze_app
npx expo start --clear
```

- シミュレータ/実機の画面幅を 768px 以上にすると `Plans` 画面が 2 列表示になります。スマホ幅に戻すと 1 列に戻ります。
- Button やカードのパディング、フォントサイズがタブレットでスケールすることを確認してください。

今後の推奨作業:

- `PlanCard` / `TaskCard` の内部レイアウト（タブレット用 variant）を整備して、カードの情報量を増やす
- スプリットビュー（マスター/詳細の横並び）を Plans と PlanDetail に導入し、タブレットでの操作効率を改善する
- `useResponsive` のブレークポイントを設定ファイル化してプロジェクトで一元管理する
- 画面幅依存のレンダリングについてユニット/スナップショットテストを追加する

```

