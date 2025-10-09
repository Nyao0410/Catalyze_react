"use strict";
/**
 * ReviewScheduler
 *
 * レガシーの簡易復習スケジューラ（現在はSM-2が推奨されるが、
 * レガシー互換用に簡易な7日後スケジューリングや、SM-2の補佐処理を提供）
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewScheduler = void 0;
const date_fns_1 = require("date-fns");
class ReviewScheduler {
    /**
     * 7日後に復習をスケジュールする簡易版（レガシー互換）
     */
    scheduleLegacy(sessionDate) {
        return (0, date_fns_1.addDays)(sessionDate, 7);
    }
    /**
     * SM-2ベースのスケジューリング補助: recordReviewを呼ぶだけで良い。
     */
    scheduleBySM2(item, quality) {
        return item.recordReview(quality);
    }
}
exports.ReviewScheduler = ReviewScheduler;
//# sourceMappingURL=review-scheduler.js.map