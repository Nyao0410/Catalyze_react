# Catalyze AI - TypeScript Edition Architecture

## アーキテクチャ概要

Catalyze AI の TypeScript 版は、**Clean Architecture** と **Domain-Driven Design (DDD)** の原則に基づいて設計されています。

## レイヤー構造

```
┌────────────────────────────────────────┐
│     Presentation Layer (Future)        │
│        UI, Controllers, DTOs           │
└────────────┬───────────────────────────┘
             │ depends on
┌────────────▼───────────────────────────┐
│     Application Layer (Future)         │
│     Use Cases, Application Services    │
└────────────┬───────────────────────────┘
             │ depends on
┌────────────▼───────────────────────────┐
│         Domain Layer ★                 │
│  Entities, Value Objects, Services     │
│       Repository Interfaces            │
└────────────▲───────────────────────────┘
             │ implements
┌────────────┴───────────────────────────┐
│    Infrastructure Layer (Future)       │
│  Database, API, External Services      │
└────────────────────────────────────────┘
```

★ **現在実装済み**: ドメイン層のみ

## ドメイン層 (Domain Layer)

### 1. エンティティ (Entities)

ビジネスオブジェクトの中核。同一性（ID）を持ち、ライフサイクル全体を通じて追跡されます。

#### StudyPlanEntity
学習計画のエンティティ。

**主要な責務**:
- 学習計画のライフサイクル管理（作成、一時停止、再開、完了）
- ステータス遷移のビジネスルール
- 学習日の判定
- 期限切れの判定

**ビジネスルール**:
```typescript
// 学習計画のバリデーション
- totalUnits > 0
- createdAt <= deadline
- studyDays.length > 0
- rounds >= 1
- targetRounds >= 1
```

#### StudySessionEntity
1回の学習セッション（学習記録）。

**主要な責務**:
- パフォーマンス指標の計算
- 学習品質の評価
- 単元あたり平均時間の計算

**計算ロジック**:
```typescript
performanceFactor = (6 - difficulty) × concentration / 9.0
```

#### DailyTaskEntity
日次学習タスク。

**主要な責務**:
- 日付判定（今日/過去/未来）
- タスクタイトルの生成
- 推定時間の計算

#### ReviewItemEntity
復習項目。SM-2アルゴリズムを実装。

**主要な責務**:
- 復習スケジュールの管理
- SM-2アルゴリズムによる最適な間隔計算
- 復習期限の判定

**SM-2アルゴリズム**:
```typescript
// 品質 < 3: 失敗
repetitions = 0
intervalDays = 1

// 品質 >= 3: 成功
newEF = EF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
newEF = max(1.3, newEF)

if (repetitions == 1) intervalDays = 1
else if (repetitions == 2) intervalDays = 6
else intervalDays = round(previousInterval * EF)
```

### 2. 値オブジェクト (Value Objects)

不変で、等価性によって比較されるオブジェクト。

#### DateRange
日付範囲を表す。

**提供する機能**:
- 期間の日数計算
- 経過日数・残り日数の計算
- 進捗率の計算
- 日付の包含判定

#### Progress
進捗状況を表す。

**提供する機能**:
- 進捗率の計算
- 完了判定
- 進捗の更新（advance、reset）
- 総数の変更（withTotal）

#### PerformanceMetrics
パフォーマンス指標を表す。

**提供する機能**:
- パフォーマンス係数の計算
- 単元あたり平均時間の計算
- 効率スコアの計算
- 学習品質レベルの判定

### 3. ドメインサービス (Domain Services)

エンティティや値オブジェクトに属さないビジネスロジック。

#### ProgressAnalysisService
学習進捗の分析とパフォーマンス評価。

**主要な機能**:
```typescript
// 進捗計算
calculateProgress(plan, sessions): Progress
calculateRoundProgress(plan, sessions, round): Progress

// パフォーマンス分析
calculateAveragePerformance(sessions): PerformanceMetrics
analyzeRecentTrend(sessions, recentDays): PerformanceTrend

// 予測と評価
estimateRemainingTime(plan, sessions): number
evaluateAchievability(plan, sessions): AchievabilityStatus
```

**達成可能性評価のロジック**:
```typescript
1. ACHIEVED: progress.isComplete
2. OVERDUE: plan.isOverdue()
3. COMFORTABLE: unitProgress - timeProgress >= 0.2
4. ON_TRACK: unitProgress - timeProgress >= -0.1
5. CHALLENGING: estimatedTime / remainingTime <= 1.2
6. AT_RISK: estimatedTime / remainingTime <= 1.5
7. IMPOSSIBLE: estimatedTime / remainingTime > 1.5
```

#### StatusManagementService
学習計画のステータスの自動管理。

**ビジネスルール**:
```typescript
// 1. 本日完了 → 学習中
if (plan.isCompletedToday && hasFutureTasks) {
  return plan.resetTodayCompletion();
}

// 2. 学習中 → 本日完了
if (todaysUnitsCompleted >= todaysUnitsRequired) {
  return plan.completeToday();
}

// 3. 学習中 → 完了
if (allRoundsComplete) {
  return plan.complete();
}
```

### 4. リポジトリインターフェース (Repository Interfaces)

データアクセスの抽象化。実装はインフラストラクチャ層に委譲。

```typescript
interface StudyPlanRepository {
  create(plan: StudyPlanEntity): Promise<StudyPlanEntity>;
  update(plan: StudyPlanEntity): Promise<void>;
  findById(planId: string): Promise<StudyPlanEntity | null>;
  findByUserId(userId: string): Promise<StudyPlanEntity[]>;
  delete(planId: string): Promise<void>;
}
```

**依存性逆転の原則 (DIP)**:
ドメイン層はインフラ層に依存せず、インターフェースのみを定義。
実装（Firestore、Hive等）はインフラ層が担当。

## 設計パターン

### 1. Repository Pattern
データアクセスを抽象化し、ドメインロジックとデータソースを分離。

### 2. Strategy Pattern (Future)
タスクスケジューリングで使用予定:
- `FixedDailyStrategy`
- `DynamicAdaptiveStrategy`
- `DeadlinePriorityStrategy`

### 3. Factory Pattern (Future)
複雑なエンティティの生成をカプセル化。

## 型安全性

### 1. Readonly プロパティ
すべてのエンティティと値オブジェクトは不変（readonly）。

```typescript
class StudyPlanEntity {
  readonly id: string;
  readonly title: string;
  readonly totalUnits: number;
  // ...
}
```

### 2. 列挙型 (Enum)
状態管理に型安全な列挙型を使用。

```typescript
enum PlanStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  COMPLETED_TODAY = 'completedToday',
}
```

### 3. バリデーション
コンストラクタでビジネスルールを検証。

```typescript
constructor(props: StudyPlanEntityProps) {
  // ... プロパティ設定
  if (!this.validate()) {
    throw new Error('Invalid StudyPlanEntity');
  }
}
```

## イミュータビリティ

### 更新パターン
エンティティの更新は新しいインスタンスを返す。

```typescript
// ❌ 悪い例
plan.status = PlanStatus.COMPLETED;

// ✅ 良い例
const completedPlan = plan.complete();
```

### 利点
- バグの削減（予期しない状態変更がない）
- 並行処理の安全性
- テストの容易性
- タイムトラベルデバッギング

## テスト戦略

### 1. ユニットテスト
各ドメインオブジェクトを独立してテスト。

```typescript
describe('Progress', () => {
  it('進捗率を正しく計算する', () => {
    const progress = new Progress(50, 100);
    expect(progress.percentage).toBe(0.5);
  });
});
```

### 2. ドメインサービスのテスト
モックリポジトリを使用。

```typescript
describe('ProgressAnalysisService', () => {
  it('達成可能性を正しく評価する', () => {
    const service = new ProgressAnalysisService();
    const achievability = service.evaluateAchievability(plan, sessions);
    expect(achievability).toBe(AchievabilityStatus.ON_TRACK);
  });
});
```

## 今後の実装予定

### Phase 3: アプリケーション層
- ユースケースの実装
- DTO (Data Transfer Object)
- アプリケーションサービス

### Phase 4: インフラストラクチャ層
- リポジトリの具体実装
- Firestore アダプター
- Hive アダプター

### Phase 5: プレゼンテーション層
- REST API
- GraphQL API (オプション)

## ディレクトリ構造（完成形）

```
src/
├── domain/                 # ドメイン層 ★実装済み
│   ├── entities/
│   ├── value-objects/
│   ├── repositories/
│   ├── services/
│   └── types.ts
├── application/            # アプリケーション層（予定）
│   ├── use-cases/
│   ├── dtos/
│   └── services/
├── infrastructure/         # インフラ層（予定）
│   ├── repositories/
│   │   ├── firestore/
│   │   └── hive/
│   └── external/
└── presentation/           # プレゼンテーション層（予定）
    ├── api/
    └── controllers/
```

## まとめ

Catalyze AI TypeScript版は、Clean ArchitectureとDDDの原則に基づき、保守性・拡張性・テスタビリティに優れた設計を実現しています。現在はドメイン層のみの実装ですが、段階的に他の層を追加していく予定です。

---

**Last Updated**: 2025年10月6日
