/**
 * DailyTaskService Diagnostic Script
 * タスク範囲の問題を診断するためのスクリプト
 * 
 * 実行方法:
 * npx ts-node src/application/services/__tests__/DailyTaskService.diagnostic.ts
 */

import { DailyTaskService } from '../DailyTaskService';
import { StudyPlanEntity } from 'catalyze-ai';
import { startOfDay, addDays, format } from 'date-fns';
import { studyPlanService, studySessionService, reviewItemService } from '../../../services';

async function runDiagnostic() {
  const dailyTaskService = new DailyTaskService();
  
  console.log('========================================');
  console.log('DailyTaskService Diagnostic');
  console.log('========================================\n');

  try {
    // テスト用ユーザーID
    const userId = 'user-001';

    // 複数日でタスクを取得
    console.log('🔍 Testing getTasksForDate for consecutive days...\n');

    const baseDate = new Date('2025-01-15');
    const results: Array<{
      date: string;
      taskCount: number;
      tasks: Array<{ startUnit: number; endUnit: number; units: number }>;
    }> = [];

    for (let i = 0; i < 5; i++) {
      const testDate = addDays(baseDate, i);
      console.log(`📅 Fetching tasks for ${format(testDate, 'yyyy-MM-dd (EEEE)')}...`);

      try {
        const tasks = await dailyTaskService.getTasksForDate(userId, testDate);
        
        const taskRanges = tasks.map(t => ({
          startUnit: t.startUnit,
          endUnit: t.endUnit,
          units: t.units,
          id: t.id.substring(0, 50), // IDの先頭50文字のみ表示
        }));

        console.log(`   Tasks count: ${tasks.length}`);
        tasks.forEach((t, idx) => {
          console.log(`   [Task ${idx + 1}] Units: ${t.startUnit}-${t.endUnit} (${t.units} units) | Plan: ${t.planId}`);
        });

        results.push({
          date: format(testDate, 'yyyy-MM-dd'),
          taskCount: tasks.length,
          tasks: taskRanges,
        });
      } catch (error) {
        console.error(`   ❌ Error fetching tasks:`, error);
      }
      console.log();
    }

    // 結果分析
    console.log('========================================');
    console.log('📊 ANALYSIS');
    console.log('========================================\n');

    if (results.length > 0) {
      const uniqueRanges = new Set(
        results.map(r => 
          r.tasks.map(t => `${t.startUnit}-${t.endUnit}`).join(', ')
        )
      );

      console.log(`Total unique range patterns: ${uniqueRanges.size}`);
      console.log('Range patterns:');
      uniqueRanges.forEach(pattern => console.log(`  - ${pattern}`));

      if (uniqueRanges.size === 1) {
        console.log('\n⚠️  ISSUE DETECTED: All days have the same task range!');
        console.log('This matches the reported problem.');
      } else {
        console.log('\n✅ OK: Different task ranges are generated for different days.');
      }
    }

    // 詳細なタスク情報を表示
    console.log('\n========================================');
    console.log('📋 DETAILED TASK INFO');
    console.log('========================================\n');

    results.forEach((result, idx) => {
      console.log(`Day ${idx + 1} (${result.date}):`);
      result.tasks.forEach((task, taskIdx) => {
        console.log(`  Task ${taskIdx + 1}: ${task.startUnit}-${task.endUnit}`);
      });
    });

  } catch (error) {
    console.error('Diagnostic failed:', error);
  }
}

// スクリプト実行
runDiagnostic().catch(console.error);
