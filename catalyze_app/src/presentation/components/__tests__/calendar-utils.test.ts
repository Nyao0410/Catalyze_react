import { buildMarkedDates } from '../calendar-utils';
import { addDays } from 'date-fns';

describe('calendar-utils buildMarkedDates', () => {
  test('no tasks -> selected day only selected but not marked', () => {
    const selected = new Date('2025-10-09');
    const dates = buildMarkedDates([], selected);
    const key = selected.toISOString().slice(0,10);
    expect(dates[key]).toBeDefined();
    expect(dates[key].selected).toBe(true);
    expect(dates[key].marked).toBe(false);
  });

  test('task on different day -> selected day unmarked, task day marked', () => {
    const selected = new Date('2025-10-09');
    const taskDay = addDays(selected, 2);
    const tasks = [{ date: taskDay }];
    const dates = buildMarkedDates(tasks, selected);
    const selKey = selected.toISOString().slice(0,10);
    const taskKey = taskDay.toISOString().slice(0,10);
    expect(dates[selKey]).toBeDefined();
    expect(dates[selKey].marked).toBe(false);
    expect(dates[taskKey]).toBeDefined();
    expect(dates[taskKey].marked).toBe(true);
  });

  test('task on selected day -> selected day marked and selected', () => {
    const selected = new Date('2025-10-09');
    const tasks = [{ date: selected }];
    const dates = buildMarkedDates(tasks, selected);
    const key = selected.toISOString().slice(0,10);
    expect(dates[key].selected).toBe(true);
    expect(dates[key].marked).toBe(true);
  });
});
