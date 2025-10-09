import { format } from 'date-fns';
import { colors } from '../theme';

export type MarkedDates = { [key: string]: any };

export const buildMarkedDates = (upcomingTasks: Array<any>, selectedDate: Date) : MarkedDates => {
  const dates: MarkedDates = {};
  try {
    upcomingTasks.forEach((task) => {
      if (!task || !task.date) return;
      const dateKey = format(task.date, 'yyyy-MM-dd');
      // prefer existing entry if present
      dates[dateKey] = dates[dateKey] || { marked: true, dotColor: colors.primary };
    });

    const selectedKey = format(selectedDate, 'yyyy-MM-dd');
    const wasMarked = !!dates[selectedKey]?.marked;
    dates[selectedKey] = wasMarked
      ? { selected: true, selectedColor: colors.primary, marked: true, dotColor: dates[selectedKey].dotColor || colors.primary }
      : { selected: true, selectedColor: colors.primary, marked: false };

    // debug logging of marked dates summary
    try {
      // eslint-disable-next-line no-console
      console.log('[calendar-utils] buildMarkedDates', {
        selectedKey,
        totalMarked: Object.keys(dates).filter(k => dates[k].marked).length,
        sampleMarked: Object.entries(dates).slice(0, 10).map(([k, v]) => ({ date: k, marked: !!v.marked, dotColor: v.dotColor })),
      });
    } catch (e) {}
  } catch (e) {
    try { console.warn('[calendar-utils] buildMarkedDates error', e); } catch (er) {}
  }
  return dates;
};
