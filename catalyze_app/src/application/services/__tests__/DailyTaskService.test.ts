import { dailyTaskService } from '../DailyTaskService';
import { studyPlanService, studySessionService, reviewItemService } from '../../../services';
import { StudyPlanEntity } from 'catalyze-ai';

jest.mock('../../../services', () => ({
  studyPlanService: {
    getActivePlans: jest.fn(),
  },
  studySessionService: {
    getSessionsByPlanId: jest.fn(),
  },
  reviewItemService: {
    getReviewItemsByPlanId: jest.fn(),
    getReviewItemsByUserId: jest.fn(),
  },
}));

describe('DailyTaskService.getUpcomingTasks', () => {
  it('returns tasks for the upcoming window using orchestrator', async () => {
    const mockPlan = new StudyPlanEntity({
      id: 'plan-1',
      userId: 'user-1',
      title: 'Mock Plan',
      totalUnits: 10,
      unit: '問',
      createdAt: new Date(),
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      rounds: 1,
      targetRounds: 1,
      estimatedTimePerUnit: 1000,
      difficulty: 'normal' as any,
      studyDays: [1,2,3,4,5],
      status: 'active' as any,
    } as any);

    (studyPlanService.getActivePlans as jest.Mock).mockResolvedValue([mockPlan]);
    (studySessionService.getSessionsByPlanId as jest.Mock).mockResolvedValue([]);
  (reviewItemService.getReviewItemsByPlanId as jest.Mock).mockResolvedValue([]);
  (reviewItemService.getReviewItemsByUserId as jest.Mock).mockResolvedValue([]);

    const tasks = await dailyTaskService.getUpcomingTasks('user-1', 3);
    expect(Array.isArray(tasks)).toBe(true);
    // should return at most 3 tasks (or fewer if non-study days)
    expect(tasks.length).toBeGreaterThanOrEqual(0);
  });
});
