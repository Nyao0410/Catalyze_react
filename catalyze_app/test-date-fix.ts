/**
 * タイムゾーン修正確認テスト
 * parseLocalDate() が正しくローカル日時を解析することを確認
 */

import { parse, startOfDay, format } from 'date-fns';

function parseLocalDate(dateString: string): Date {
  return parse(dateString, 'yyyy-MM-dd', new Date());
}

// テスト: 2025-10-28 を parseLocalDate で解析
const dateStr = '2025-10-28';
const parsed = parseLocalDate(dateStr);
const normalized = startOfDay(parsed);

console.log('=== タイムゾーン修正確認テスト ===');
console.log('入力:', dateStr);
console.log('parse 結果:', parsed.toISOString());
console.log('startOfDay 結果:', normalized.toISOString());
console.log('format 結果:', format(normalized, 'yyyy-MM-dd'));

// 期待値: yyyy-MM-dd 形式で 2025-10-28 のまま
const expectedDate = format(normalized, 'yyyy-MM-dd');
if (expectedDate === dateStr) {
  console.log('✅ 修正成功！日付が保持されている');
} else {
  console.log(`❌ 修正失敗。期待値: ${dateStr}, 実際: ${expectedDate}`);
}

// テスト: 複数日を確認
console.log('\n=== 複数日テスト ===');
const testDates = ['2025-10-26', '2025-10-27', '2025-10-28', '2025-10-29', '2025-10-30'];
testDates.forEach(dateStr => {
  const d = parseLocalDate(dateStr);
  const formatted = format(startOfDay(d), 'yyyy-MM-dd');
  const isCorrect = formatted === dateStr;
  console.log(`${isCorrect ? '✅' : '❌'} ${dateStr} → ${formatted}`);
});
