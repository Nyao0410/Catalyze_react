/**
 * StudyNext - Service Instances
 * サービスインスタンスの管理
 */

import {
  InMemoryStudyPlanRepository,
  InMemoryStudySessionRepository,
  InMemoryReviewItemRepository,
} from 'catalyze-ai';
import {
  StudyPlanService,
  StudySessionService,
  ReviewItemService,
} from './application/services';

// リポジトリのシングルトンインスタンス
export const planRepository = new InMemoryStudyPlanRepository();
export const sessionRepository = new InMemoryStudySessionRepository();
export const reviewRepository = new InMemoryReviewItemRepository();

// サービスの初期化
export const studyPlanService = new StudyPlanService(planRepository);
export const studySessionService = new StudySessionService(sessionRepository);
export const reviewItemService = new ReviewItemService(reviewRepository);