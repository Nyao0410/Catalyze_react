import { DynamicQuotaCalculator } from '../dynamic-quota-calculator';
import { StudyPlanEntity } from '../../domain/entities/study-plan-entity';

describe('DynamicQuotaCalculator', () => {
  it('returns reasonable result for empty sessions', () => {
    const calculator = new DynamicQuotaCalculator();
    const plan = new StudyPlanEntity({
      id: 'p1',
      userId: 'u1',
      title: 't',
      totalUnits: 100,
      createdAt: new Date('2025-01-01'),
      deadline: new Date('2025-12-31'),
      estimatedTimePerUnit: 5 * 60 * 1000,
    });

    const result = calculator.calculate(plan, []);
    expect(result.adjustedTimePerUnitMs).toBeGreaterThan(0);
    expect(result.recommendedDailyQuota).toBeGreaterThanOrEqual(1);
    expect(result.provisionalDeadline instanceof Date).toBe(true);
  });
});
