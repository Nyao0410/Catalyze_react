/**
 * StudyNext - Service Instances
 * サービスインスタンスの管理
 */

import {
  AsyncStorageStudyPlanRepository,
  AsyncStorageStudySessionRepository,
  AsyncStorageReviewItemRepository,
  InMemoryStudyPlanRepository,
  InMemoryStudySessionRepository,
  InMemoryReviewItemRepository,
} from 'catalyze-ai';
import {
  StudyPlanService,
  StudySessionService,
  ReviewItemService,
} from './application/services';

// 切り替えフラグ: 永続化（AsyncStorage）を使うかどうか
// 将来的には環境変数や設定画面で切り替えられるようにするとよい
const USE_ASYNC_STORAGE = true;

// リポジトリのシングルトンインスタンス
export const planRepository = USE_ASYNC_STORAGE
  ? new AsyncStorageStudyPlanRepository()
  : new InMemoryStudyPlanRepository();
export const sessionRepository = USE_ASYNC_STORAGE
  ? new AsyncStorageStudySessionRepository()
  : new InMemoryStudySessionRepository();
export const reviewRepository = USE_ASYNC_STORAGE
  ? new AsyncStorageReviewItemRepository()
  : new InMemoryReviewItemRepository();

// サービスの初期化
export const studyPlanService = new StudyPlanService(planRepository);
export const studySessionService = new StudySessionService(sessionRepository);
export const reviewItemService = new ReviewItemService(reviewRepository);