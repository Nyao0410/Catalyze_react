/**
 * Replication Test: Upcoming Tasks Same Range Issue
 * 問題の再現テスト: 複数日で同じユニット範囲が返される
 */

import { addDays, format } from 'date-fns';

/**
 * シミュレーション: 3日連続でタスクを取得した場合の予想
 * 
 * - 計画: 100ユニット、30日
 * - セッション履歴: なし（初日）
 * 
 * 期待される動作:
 * - Day 1 (Jan 15): 1-4 units (daily quota ~3-4)
 * - Day 2 (Jan 16): 5-8 units (completed: 4)
 * - Day 3 (Jan 17): 9-12 units (completed: 8)
 * 
 * 報告されている問題:
 * - Day 1: 1-100 units ✓
 * - Day 2: 1-100 units ✗ (expected: 5-8)
 * - Day 3: 1-100 units ✗ (expected: 9-12)
 */

function testMultipleDaysTaskGeneration() {
  console.log('========================================');
  console.log('🧪 Replication Test: Multiple Days Task Range');
  console.log('========================================\n');

  // シミュレーション パラメータ
  const baseDate = new Date('2025-01-15');
  const totalUnits = 100;
  const planDeadline = addDays(baseDate, 29); // 30日間の計画
  const targetDays = 3;

  console.log('📋 Test Setup:');
  console.log(`  - Base Date: ${format(baseDate, 'yyyy-MM-dd')}`);
  console.log(`  - Total Units: ${totalUnits}`);
  console.log(`  - Deadline: ${format(planDeadline, 'yyyy-MM-dd')}`);
  console.log(`  - Study Days: 30`);
  console.log(`  - Testing: ${targetDays} consecutive days\n`);

  // 1. 昨日までの完了数（初日なので0）
  const sessionsData = [
    {
      date: format(baseDate, 'yyyy-MM-dd'),
      completed: 0, // Day 1: no sessions yet
    },
    {
      date: format(addDays(baseDate, 1), 'yyyy-MM-dd'),
      completed: 4, // Day 2: should have 4 completed from Day 1
    },
    {
      date: format(addDays(baseDate, 2), 'yyyy-MM-dd'),
      completed: 8, // Day 3: should have 8 completed (Day 1 + Day 2)
    },
  ];

  console.log('📊 Expected Behavior:\n');

  sessionsData.forEach((data, idx) => {
    const dayNum = idx + 1;
    const remainingUnits = totalUnits - data.completed;
    const remainingDays = 30 - idx; // Approximate
    const dailyQuota = Math.ceil(remainingUnits / remainingDays);
    const startUnit = data.completed + 1;
    const endUnit = data.completed + dailyQuota;

    console.log(`  Day ${dayNum} (${data.date}):`);
    console.log(`    - Sessions completed by yesterday: ${data.completed} units`);
    console.log(`    - Remaining units: ${remainingUnits}`);
    console.log(`    - Remaining days: ${remainingDays}`);
    console.log(`    - Daily quota: ~${dailyQuota} units`);
    console.log(`    - Expected task range: ${startUnit}-${endUnit}`);
    console.log();
  });

  console.log('⚠️  If all days show 1-100 units, the issue is confirmed!');
  console.log('✅ If each day shows different ranges, the issue is NOT present.');
  console.log('');
}

/**
 * 根本原因の仮説
 */
function analyzeRootCauses() {
  console.log('========================================');
  console.log('🔍 Root Cause Analysis');
  console.log('========================================\n');

  console.log('🎯 Hypothesis 1: Orchestrator generates same range for all days');
  console.log('   - NewPlanningOrchestrator.generatePlan() might return:');
  console.log('     { dailyTasks: [');
  console.log('       { date: "2025-01-15", startUnit: 1, endUnit: 100 },');
  console.log('       { date: "2025-01-16", startUnit: 1, endUnit: 100 },');
  console.log('       { date: "2025-01-17", startUnit: 1, endUnit: 100 },');
  console.log('     ] }');
  console.log('   Solution: Use getTasksForDate() + generateDailyTask() instead\n');

  console.log('🎯 Hypothesis 2: generateDailyTask() has a bug in session filtering');
  console.log('   - Sessions filter: (s) => startOfDay(s.date).getTime() <= yesterday.getTime()');
  console.log('   - If all days get the same sessions, they\'d get same completed count\n');

  console.log('🎯 Hypothesis 3: remainingRanges calculation is incorrect');
  console.log('   - If remainingRanges never changes, all days get same range\n');

  console.log('🎯 Hypothesis 4: React Query caching issue');
  console.log('   - Query key might not include selectedDate properly\n');
}

// 実行
testMultipleDaysTaskGeneration();
console.log('\n');
analyzeRootCauses();
