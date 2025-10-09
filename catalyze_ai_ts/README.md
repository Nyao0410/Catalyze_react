# Catalyze AI - TypeScript Edition

個別学習計画の最適化を目的とした AI コーチングシステムの TypeScript 実装版です。

## 概要

Catalyze AI は、ユーザーの学習記録を分析し、以下の機能を提供します:

- **動的ノルマ調整**: 学習ペースに応じた日次ノルマの自動調整
- **複数周回学習計画**: 苦手分野を分析した効率的な学習スケジュール
- **記憶定着のための復習**: SM-2 アルゴリズムに基づく最適な復習タイミング
- **進捗分析とパフォーマンス評価**: リアルタイムでの学習状況の可視化

## アーキテクチャ

Clean Architecture と Domain-Driven Design (DDD) に基づいた設計を採用しています。

```
catalyze-ai-ts/
├── src/
│   ├── domain/              # ドメイン層（ビジネスロジック）
│   │   ├── entities/       # エンティティ
│   │   ├── value-objects/  # 値オブジェクト
│   │   ├── repositories/   # リポジトリインターフェース
│   │   ├── services/       # ドメインサービス
│   │   └── types.ts        # 共通型定義
│   ├── algorithms/          # アルゴリズム層（レガシー）
│   ├── models/              # データモデル層
│   └── index.ts             # メインエクスポート
├── package.json
├── tsconfig.json
└── README.md
```

### レイヤー構造

#### 1. ドメイン層 (Domain Layer)

ビジネスロジックの中核を担う層です。

**エンティティ (Entities)**:
- `StudyPlanEntity`: 学習計画
- `StudySessionEntity`: 学習セッション（1回の学習記録）
- `DailyTaskEntity`: 日次タスク
- `ReviewItemEntity`: 復習項目（SM-2アルゴリズム実装）
  
  補足: `StudyPlanEntity` は単元の範囲を表す `unitRange?: { start: number; end: number }` を持てます。
  また `StudySessionEntity` はセッションで学習した具体的な範囲を `startUnit?: number` / `endUnit?: number` として保持できます。

**値オブジェクト (Value Objects)**:
- `DateRange`: 日付範囲
- `Progress`: 進捗状況
- `PerformanceMetrics`: パフォーマンス指標

**ドメインサービス (Domain Services)**:
- `ProgressAnalysisService`: 進捗分析とパフォーマンス評価
- `StatusManagementService`: ステータスの自動管理

**リポジトリインターフェース (Repository Interfaces)**:
- `StudyPlanRepository`: 学習計画のデータアクセス
- `StudySessionRepository`: 学習セッションのデータアクセス
- `ReviewItemRepository`: 復習項目のデータアクセス

## インストール

```bash
cd packages/catalyze_ai_ts
npm install
```

## ビルド

```bash
npm run build
```

## テスト

```bash
# テスト実行
npm test

# ウォッチモード
npm run test:watch

# カバレッジ
npm run test:coverage
```

## 使用例

### 基本セットアップ

```typescript
import {
  // エンティティ
  StudyPlanEntity,
  StudySessionEntity,
  ReviewItemEntity,
  // 型定義
  PlanDifficulty,
  PlanStatus,
  // サービス
  ProgressAnalysisService,
  // アルゴリズム
  DynamicQuotaCalculator,
  PlanningOrchestrator,
  // リポジトリ（メモリ実装）
  InMemoryStudyPlanRepository,
  InMemoryStudySessionRepository,
  InMemoryReviewItemRepository,
} from 'catalyze-ai';

// リポジトリの初期化
const planRepository = new InMemoryStudyPlanRepository();
const sessionRepository = new InMemoryStudySessionRepository();
const reviewRepository = new InMemoryReviewItemRepository();
```

### 1. 学習計画の作成

```typescript
const plan = new StudyPlanEntity({
  id: 'plan-001',
  userId: 'user-001',
  title: '数学の問題集',
  totalUnits: 100,
  unit: '問',
  createdAt: new Date('2025-01-01'),
  deadline: new Date('2025-03-31'),
  rounds: 1,
  targetRounds: 2,
  estimatedTimePerUnit: 5 * 60 * 1000, // 5分（ミリ秒）
  difficulty: PlanDifficulty.NORMAL,
  studyDays: [1, 2, 3, 4, 5], // 月〜金
  status: PlanStatus.ACTIVE,
});

// リポジトリに保存
await planRepository.create(plan);

console.log(plan.remainingDays); // 残り日数
console.log(plan.timeProgressRatio); // 時間進捗率
```

### 2. 学習セッションの記録

```typescript
import { StudySessionEntity } from 'catalyze-ai';

const session = new StudySessionEntity({
  id: 'session-001',
  userId: 'user-001',
  planId: 'plan-001',
  date: new Date(),
  unitsCompleted: 10,
  // オプション: このセッションで扱った単元の範囲を明示できる
  // startUnit と endUnit を指定すると、進捗計算はこの範囲長を優先して扱います
  startUnit: 11,
  endUnit: 20,
  durationMinutes: 60,
  concentration: 0.8, // 0.0 ~ 1.0
  difficulty: 3, // 1 ~ 5
  round: 1,
});

console.log(session.performanceFactor); // パフォーマンス係数
console.log(session.qualityLevel); // 学習品質レベル
```

### 3. 進捗分析

```typescript
import { ProgressAnalysisService } from 'catalyze-ai';

const analysisService = new ProgressAnalysisService();

// 進捗計算
const progress = analysisService.calculateProgress(plan, sessions);
console.log(`進捗: ${progress.percentage * 100}%`);

// パフォーマンス分析
const avgPerf = analysisService.calculateAveragePerformance(sessions);
console.log(`平均効率: ${avgPerf.efficiencyScore}`);

// トレンド分析
const trend = analysisService.analyzeRecentTrend(sessions, 7);
console.log(`トレンド: ${trend}`); // improving / stable / declining

// 達成可能性評価
const achievability = analysisService.evaluateAchievability(plan, sessions);
console.log(`達成可能性: ${achievability}`);
```

### 4. 復習スケジュール（SM-2アルゴリズム）

```typescript
let reviewItem = new ReviewItemEntity({
  id: 'review-001',
  userId: 'user-001',
  planId: 'plan-001',
  unitNumber: 10,
  lastReviewDate: new Date(),
  nextReviewDate: new Date(),
  easeFactor: 2.5,
  repetitions: 0,
  intervalDays: 1,
});

// リポジトリに保存
await reviewRepository.create(reviewItem);

// 復習実施後の更新
// quality: 0-5（3以上で成功）
reviewItem = reviewItem.recordReview(4);
await reviewRepository.update(reviewItem);

console.log(reviewItem.nextReviewDate); // 次回復習日
console.log(reviewItem.daysUntilNextReview); // 次回まで何日
console.log(reviewItem.isDueToday); // 今日復習すべきか

// 今日期限の復習項目を取得
const dueToday = await reviewRepository.findDueToday('user-001');
```

### 5. 動的ノルマ調整とマルチラウンドプランニング

```typescript
import { DynamicQuotaCalculator, PlanningOrchestrator } from 'catalyze-ai';

// 動的ノルマ計算
const quotaCalculator = new DynamicQuotaCalculator();
const quotaResult = quotaCalculator.calculate(plan, sessions);

console.log(`推奨日次ノルマ: ${quotaResult.recommendedDailyQuota}単元`);
console.log(`暫定期限: ${quotaResult.provisionalDeadline}`);

// オーケストレーター（全体統合）
const orchestrator = new PlanningOrchestrator();
const planResult = await orchestrator.generatePlan(plan, sessions, reviewItems);

console.log('日次タスク:', planResult.dailyTasks); // 30日分のタスク
console.log('ラウンドタスク:', planResult.roundTasks); // 苦手箇所の重点学習
console.log('推奨日次ノルマ:', planResult.dailyQuota);

// 進捗サマリー
const summary = orchestrator.getProgressSummary(plan, sessions);
console.log(`現在のラウンド: ${summary.currentRound}/${plan.targetRounds}`);
console.log(`進捗: ${summary.progressPercentage}%`);
```

### 6. リポジトリの使い方

#### インメモリリポジトリ（テスト・開発用）

```typescript
import {
  InMemoryStudyPlanRepository,
  InMemoryStudySessionRepository,
  InMemoryReviewItemRepository,
} from 'catalyze-ai';

// 簡単にテストできる
const planRepo = new InMemoryStudyPlanRepository();
await planRepo.create(plan);
const activePlans = await planRepo.findActiveByUserId('user-001');
```

#### Firestoreリポジトリ（プロダクション用）

```typescript
import {
  FirestoreStudyPlanRepository,
  FirestoreStudySessionRepository,
  FirestoreReviewItemRepository,
} from 'catalyze-ai';
import admin from 'firebase-admin';

// Firebase初期化
admin.initializeApp();
const firestore = admin.firestore();

// Firestoreリポジトリ
const planRepo = new FirestoreStudyPlanRepository(firestore);
const sessionRepo = new FirestoreStudySessionRepository(firestore);
const reviewRepo = new FirestoreReviewItemRepository(firestore);

// 同じインターフェースで使用可能
await planRepo.create(plan);
const activePlans = await planRepo.findActiveByUserId('user-001');
```

## 主要な機能

### SM-2 アルゴリズム

間隔反復学習（Spaced Repetition）の実装です。

**特徴**:
- 回答品質（0-5）に基づく間隔調整
- 容易度係数（Ease Factor）の動的更新
- 記憶の定着を最適化

**アルゴリズム**:
```
品質 < 3: 失敗 → 1日後に再復習
品質 ≥ 3: 成功 → 間隔を延長

新容易度 = EF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))

間隔:
  repetitions == 1: 1日
  repetitions == 2: 6日
  repetitions > 2:  前回間隔 × 容易度係数
```

### パフォーマンス係数

学習効率を数値化したものです。

パフォーマンス係数は、難易度と集中度を組み合わせて 0.0～1.0 で表現します。

新しい式（案B: 乗算正規化）:
```
performanceFactor = (concentration × difficulty) / MAX_DIFFICULTY
```
ここで MAX_DIFFICULTY = 5（difficulty の最大値）です。

例:
- difficulty=5, concentration=1.0 → 1.0
- difficulty=3, concentration=1.0 → 0.6
- difficulty=1, concentration=1.0 → 0.2

品質レベルの閾値（現行の初期値）:
- EXCELLENT: >= 0.85
- GOOD: >= 0.65
- FAIR: >= 0.40
- POOR: それ以下

備考:
- この変更により「難易度が高く、かつ集中して学習した」ケースが高く評価されます。
- 上記の閾値やスケーリングは運用データに基づいて調整することを推奨します。

### 達成可能性評価

学習計画の達成可能性を7段階で評価します:

1. **ACHIEVED**: 達成済み
2. **COMFORTABLE**: 余裕あり（進捗が予定より20%以上先行）
3. **ON_TRACK**: 順調（進捗が予定通り±10%以内）
4. **CHALLENGING**: 挑戦的（推定時間が残り時間の120%以内）
5. **AT_RISK**: リスクあり（推定時間が残り時間の150%以内）
6. **OVERDUE**: 期限切れ
7. **IMPOSSIBLE**: 達成不可能（推定時間が残り時間の150%超過）

## 型安全性

TypeScript の強力な型システムを活用しています:

- すべてのエンティティと値オブジェクトは不変（readonly）
- null 安全性
- 列挙型（enum）による状態管理
- ジェネリクスによる型推論

## テスト

Jest を使用した包括的なテストを実装予定です。

```bash
npm test
```

## ライセンス

MIT

## 参考

- 元となる Dart 版: `/packages/catalyze_ai`
- ドキュメント: `/docs/AIロジック解剖書.md`

## 今後の開発予定

- [ ] TaskSchedulingStrategy の実装（3つの戦略）
- [ ] レガシーアルゴリズムの移植
- [ ] モデル層の実装
- [ ] ユニットテストの追加
- [ ] 統合テストの追加
- [ ] API ドキュメントの生成

---

**Version**: 2.0.0  
**Last Updated**: 2025年10月6日
