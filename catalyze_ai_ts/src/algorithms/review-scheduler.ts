/**
 * ReviewScheduler
 *
 * レガシーの簡易復習スケジューラ（現在はSM-2が推奨されるが、
 * レガシー互換用に簡易な7日後スケジューリングや、SM-2の補佐処理を提供）
 */

import { ReviewItemEntity } from '../domain/entities/review-item-entity';
import { addDays } from 'date-fns';

export class ReviewScheduler {
  /**
   * 7日後に復習をスケジュールする簡易版（レガシー互換）
   */
  scheduleLegacy(sessionDate: Date): Date {
    return addDays(sessionDate, 7);
  }

  /**
   * SM-2ベースのスケジューリング補助: recordReviewを呼ぶだけで良い。
   */
  scheduleBySM2(item: ReviewItemEntity, quality: number): ReviewItemEntity {
    return item.recordReview(quality);
  }
}
