import { PlanningOrchestrator } from '../planning-orchestrator';
import { StudyPlanEntity } from '../../domain/entities/study-plan-entity';
import { StudySessionEntity } from '../../domain/entities/study-session-entity';

// Debug helper to print plan allocation

describe('orchestrator debug', () => {
  test('print generatePlan for sample plans', () => {
    const orchestrator = new PlanningOrchestrator();

    const plans: StudyPlanEntity[] = [
      new StudyPlanEntity({
        id: 'debug-plan-1',
        userId: 'user-001',
        title: 'debug plan small',
        totalUnits: 100,
        unit: '問',
        unitRange: { start: 1, end: 100 },
        createdAt: new Date(),
        deadline: new Date(new Date().getTime() + 10 * 24 * 60 * 60 * 1000),
        rounds: 1,
        targetRounds: 2,
        estimatedTimePerUnit: 5 * 60 * 1000,
        difficulty: 2,
        studyDays: [1,2,3,4,5],
        status: 'active',
      } as any),
      new StudyPlanEntity({
        id: 'debug-plan-2',
        userId: 'user-001',
        title: 'debug plan tight deadline',
        totalUnits: 50,
        unit: '問',
        unitRange: { start: 1, end: 50 },
        createdAt: new Date(),
        deadline: new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000),
        rounds: 1,
        targetRounds: 1,
        estimatedTimePerUnit: 5 * 60 * 1000,
        difficulty: 3,
        studyDays: [1,2,3,4,5,6,7],
        status: 'active',
      } as any),
    ];

    const sessions: StudySessionEntity[] = [];

    for (const plan of plans) {
      const result = orchestrator.generatePlan(plan, sessions, [] as any);
      // Print summary
      // eslint-disable-next-line no-console
      console.log('--- plan', plan.id);
      // eslint-disable-next-line no-console
      console.log('dailyQuota (reported):', result.dailyQuota);
      // eslint-disable-next-line no-console
      console.log('roundTasks:', JSON.stringify(result.roundTasks.slice(0, 10), null, 2));
      // eslint-disable-next-line no-console
      console.log('dailyTasks sample (first 15):');
      for (let i = 0; i < Math.min(result.dailyTasks.length, 15); i++) {
        const t = result.dailyTasks[i];
        // eslint-disable-next-line no-console
        console.log(`  ${t.date.toISOString().slice(0,10)}: ${t.startUnit}-${t.endUnit} (${t.units})`);
      }
    }

    expect(true).toBe(true);
  });
});
