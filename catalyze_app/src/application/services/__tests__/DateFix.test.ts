/**
 * タイムゾーン修正確認テスト
 */

import { parse, startOfDay, format } from 'date-fns';

function parseLocalDate(dateString: string): Date {
  return parse(dateString, 'yyyy-MM-dd', new Date());
}

describe('タイムゾーン修正テスト', () => {
  it('parseLocalDate が正しくローカル日付を解析する', () => {
    const dateStr = '2025-10-28';
    const parsed = parseLocalDate(dateStr);
    const formatted = format(startOfDay(parsed), 'yyyy-MM-dd');
    expect(formatted).toBe(dateStr);
  });

  it('複数日が正しく解析される', () => {
    const testDates = ['2025-10-26', '2025-10-27', '2025-10-28', '2025-10-29', '2025-10-30'];
    testDates.forEach(dateStr => {
      const d = parseLocalDate(dateStr);
      const formatted = format(startOfDay(d), 'yyyy-MM-dd');
      expect(formatted).toBe(dateStr);
    });
  });

  it('parseLocalDate が Date オブジェクトを返す', () => {
    const result = parseLocalDate('2025-10-28');
    expect(result instanceof Date).toBe(true);
  });
});
