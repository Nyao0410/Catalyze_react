import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Keyboard, TouchableWithoutFeedback, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Slider from '@react-native-community/slider';
import { useNavigation, useRoute } from '@react-navigation/native';
import { spacing, colors as defaultColors, textStyles } from '../theme';
import { useTheme } from '../theme/ThemeProvider';
import { addDays, isToday, startOfDay } from 'date-fns';
import type { RootStackScreenProps } from '../navigation/types';
import { useCreateSession, useDailyTasksByPlan, useUpdateSession, useStudySession } from '../hooks';
import { useRecordReview } from '../hooks/useReviewItems';
import { useUpdateUserPoints, useAddStudyHours } from '../hooks/useAccount';
import { LevelUpModal } from '../components/LevelUpModal';
import { StudySessionEntity, ProgressAnalysisService } from 'catalyze-ai';
import { studyPlanService, studySessionService } from '../../services';
import { t } from '../../locales';
import { useTopToast } from '../hooks/useTopToast';
import { useCurrentUserId } from '../hooks/useAuth';

type RouteProps = RootStackScreenProps<'RecordSession'>;

export const RecordSessionScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProps['route']>();
  const { planId, taskId, sessionId, elapsedMinutes, startUnit: paramStartUnit, endUnit: paramEndUnit, fromTimer, reviewItemIds } = route.params as any;
  const { colors } = useTheme();

  // 実際のユーザーIDを取得（未ログイン時でもローカルIDが返される）
  const { userId: currentUserId, isLoading: isLoadingUserId } = useCurrentUserId();
  // 'error'の場合はフォールバックを使用、それ以外はそのまま使用
  const userId = currentUserId === 'error' ? 'local-default' : (isLoadingUserId ? 'loading' : currentUserId);
  
  // セッション作成時はuserIdが有効でないとエラー
  if (!isLoadingUserId && (!userId || userId === 'loading' || userId === 'error')) {
    console.warn('[RecordSession] Invalid userId:', userId);
  }

  const createSession = useCreateSession();
  const updateSession = useUpdateSession();
  const recordReview = useRecordReview();
  const queryClient = useQueryClient();
  const toast = useTopToast();
  const updateUserPoints = useUpdateUserPoints();
  const addStudyHours = useAddStudyHours();

  // 編集モードかどうか
  const isEditMode = !!sessionId;

  // 復習タスク完了かどうか（paramStartUnitとparamEndUnitがあれば復習タスク完了）
  const isReviewCompletion = paramStartUnit !== undefined && paramEndUnit !== undefined && !taskId;

  // モード: 'quantity' = 単純に量を入力、'range' = 範囲を指定
  // ★修正: 復習タスク完了時は常に範囲モード
  const [inputMode, setInputMode] = useState<'quantity' | 'range'>(isReviewCompletion ? 'range' : 'quantity');

  // 編集モードの場合、既存のセッションを取得
  const existingSessionQuery = useStudySession(sessionId || '');
  const existingSession = existingSessionQuery.data;

  const [unitsCompleted, setUnitsCompleted] = useState('');
  const [unitsInput, setUnitsInput] = useState(''); // ユーザーが入力する「やった単元数」
  const [rangeStartInput, setRangeStartInput] = useState(''); // 範囲モード: 開始単元
  const [rangeEndInput, setRangeEndInput] = useState(''); // 範囲モード: 終了単元
  const [durationMinutes, setDurationMinutes] = useState('5');
  const [concentration, setConcentration] = useState(0.6);
  const [difficulty, setDifficulty] = useState(3);
  const [round, setRound] = useState<number | undefined>(undefined);

  // レベルアップモーダル用
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [newLevel, setNewLevel] = useState<number | null>(null);

  // タスクが渡されていればデフォルト値を取得
  const tasksQuery = useDailyTasksByPlan(planId);
  const tasks = tasksQuery.data || [];
  const task = taskId ? tasks.find((t) => t.id === taskId) : undefined;

  // 計画を取得
  const planQuery = useQuery({
    queryKey: ['plan', planId],
    queryFn: () => studyPlanService.getPlanById(planId),
  });
  const plan = planQuery.data;

  // セッションを取得
  const sessionsQuery = useQuery({
    queryKey: ['sessions', planId],
    queryFn: () => studySessionService.getSessionsByPlanId(planId),
  });
  const sessions = sessionsQuery.data || [];

  // 進捗を計算
  const progressAnalysisService = new ProgressAnalysisService();
  const progress = plan ? progressAnalysisService.calculateProgress(plan, sessions) : null;

  React.useEffect(() => {
    if (isEditMode && existingSession) {
      // 編集モードの場合、既存のセッションの値をセット
      setUnitsCompleted(String(existingSession.unitsCompleted));
      setDurationMinutes(String(existingSession.durationMinutes));
      setConcentration(existingSession.concentration);
      setDifficulty(existingSession.difficulty);
      setRound(existingSession.round);
      
      // 編集時は範囲モードを優先
      if ((existingSession as any).startUnit !== undefined && (existingSession as any).endUnit !== undefined) {
        setInputMode('range');
        setRangeStartInput(String((existingSession as any).startUnit));
        setRangeEndInput(String((existingSession as any).endUnit));
      } else {
        setInputMode('quantity');
        setUnitsInput(String(existingSession.unitsCompleted));
      }
    } else if (task) {
      // 新規作成の場合、タスクのデフォルト値をセット
      setUnitsCompleted(String(task.units));
      setUnitsInput(String(task.units ?? 1));
      // タイマーからの経過時間があればそれを使う
      setDurationMinutes(elapsedMinutes ? String(elapsedMinutes) : String(task.estimatedMinutes));
      setRound(task.round);
      
      // タスクに範囲情報があれば範囲モードで初期化
      if (task.startUnit !== undefined && task.endUnit !== undefined) {
        setInputMode('range');
        setRangeStartInput(String(task.startUnit));
        setRangeEndInput(String(task.endUnit));
      }
    } else if (paramStartUnit !== undefined && paramEndUnit !== undefined) {
      // タイマーから直接来た場合、startUnitとendUnitから完了単元数を計算
      const calculatedUnits = paramEndUnit - paramStartUnit + 1;
      setUnitsCompleted(String(calculatedUnits));
      setUnitsInput(String(calculatedUnits));
      setDurationMinutes(elapsedMinutes ? String(elapsedMinutes) : '25');
      
      // タイマーからの場合は範囲モード
      setInputMode('range');
      setRangeStartInput(String(paramStartUnit));
      setRangeEndInput(String(paramEndUnit));
    } else if (elapsedMinutes) {
      // タスクはないがタイマーからの経過時間がある場合
      setDurationMinutes(String(elapsedMinutes));
    }
  }, [task, existingSession, isEditMode, elapsedMinutes, paramStartUnit, paramEndUnit]);

  // プレビュー計算: タイマーなどで start/end が直接渡されていればそれを優先して表示する。
  // そうでなければ、これまでの合計から開始単元を決め、入力値から終了単元を計算する。
  const cumulativeCompleted = Array.isArray(sessions) ? sessions.reduce((s: number, it: any) => s + (it.unitsCompleted || 0), 0) : 0;
  let previewStartUnit: number;
  let previewEndUnit: number;
  if (paramStartUnit !== undefined && paramEndUnit !== undefined) {
    // タイマーなどから渡された範囲を基準に、累計完了数を考慮して調整
    // タイマーが渡す範囲はタスクの全範囲なので、完了済みをオフセットして残りの範囲を表示
    const timerRangeSize = paramEndUnit - paramStartUnit + 1;
    previewStartUnit = paramStartUnit + cumulativeCompleted;
    previewEndUnit = Math.min(paramEndUnit, previewStartUnit + timerRangeSize - 1);
  } else if (plan && (plan.unitRange as any)?.start !== undefined && (plan.unitRange as any)?.end !== undefined) {
    // プランに unitRange がある場合は、累計完了数を unitRange.start でオフセットして絶対単元を算出
    const range = plan.unitRange as { start: number; end: number };
    previewStartUnit = range.start + cumulativeCompleted;
    const previewUnitsNumber = unitsInput && !isNaN(parseInt(unitsInput, 10))
      ? Math.max(1, parseInt(unitsInput, 10))
      : (task?.units ?? 1);
    previewEndUnit = Math.min(range.end, previewStartUnit + previewUnitsNumber - 1);
  } else {
    previewStartUnit = cumulativeCompleted + 1;
    const previewUnitsNumber = unitsInput && !isNaN(parseInt(unitsInput, 10))
      ? Math.max(1, parseInt(unitsInput, 10))
      : (task?.units ?? 1);
    previewEndUnit = previewStartUnit + previewUnitsNumber - 1;
  }

  // ...existing code...

  const handleSave = async () => {
    // userIdが有効でない場合はエラー
    if (isLoadingUserId || !userId || userId === 'loading' || userId === 'error') {
      Alert.alert(
        t('errors.generic') || 'エラー',
        'ユーザー情報を読み込めませんでした。しばらく待ってから再度お試しください。'
      );
      return;
    }
    
    // determine units: for edit keep existing value, for new derive from task/timer/default
    const duration = parseInt(durationMinutes);
    let unitsNumber: number;
    let startUnit: number | undefined;
    let endUnit: number | undefined;
    let pointsMessage = ''; // ポイント通知用メッセージ

    if (__DEV__) {
      console.log('[RecordSession] handleSave started:', {
        userId,
        isReviewCompletion,
        inputMode,
        paramStartUnit,
        paramEndUnit,
        isEditMode,
      });
    }

    if (isEditMode && existingSession) {
      unitsNumber = existingSession.unitsCompleted;
      startUnit = (existingSession as any).startUnit;
      endUnit = (existingSession as any).endUnit;
    } else {
      // 入力モードに応じて単元数と範囲を決定
      if (inputMode === 'range') {
        // 範囲モード: ユーザーが明示的に指定
        const start = parseInt(rangeStartInput);
        const end = parseInt(rangeEndInput);
        if (isNaN(start) || isNaN(end) || start > end) {
          Alert.alert(t('common.error'), '開始単元と終了単元を正しく入力してください');
          return;
        }
        startUnit = start;
        endUnit = end;
        unitsNumber = end - start + 1;
      } else {
        // 量モード: 従来通り、累計から計算
        if (unitsInput && !isNaN(parseInt(unitsInput, 10))) {
          unitsNumber = Math.max(1, parseInt(unitsInput, 10));
        } else if (task) {
          unitsNumber = task.units ?? 1;
        } else if (paramStartUnit !== undefined && paramEndUnit !== undefined) {
          unitsNumber = paramEndUnit - paramStartUnit + 1;
        } else {
          unitsNumber = 1;
        }
        
        // ★修正: 復習タスク完了時はparamStartUnit/paramEndUnitをそのまま使用
        if (paramStartUnit !== undefined && paramEndUnit !== undefined) {
          startUnit = paramStartUnit;
          endUnit = paramEndUnit;
        } else {
          // 量モードでは startUnit/endUnit は自動計算される
          startUnit = undefined;
          endUnit = undefined;
        }
      }
    }

    // guard against invalid duration
    if (isNaN(duration) || duration <= 0) {
      Alert.alert(t('common.error'), t('today.sessionRecord.validation.durationRequired'));
      return;
    }

    try {
      if (isEditMode && existingSession) {
        // 編集モードの場合、既存のセッションを更新
        const updatedSession = new StudySessionEntity({
          ...existingSession,
          unitsCompleted: unitsNumber,
          durationMinutes: duration,
          concentration,
          difficulty,
          round: round ?? existingSession.round,
          startUnit: startUnit ?? (existingSession as any).startUnit,
          endUnit: endUnit ?? (existingSession as any).endUnit,
        } as any);

        await updateSession.mutateAsync(updatedSession);

        // --- 編集時の自動 SM-2 適用: 復習完了時のみ難易度を反映 ---
        if (isReviewCompletion) {
          // 復習タスク完了の編集時: SM-2を適用
          try {
            let finalStartUnit: number | undefined = startUnit ?? (existingSession as any).startUnit;
            let finalEndUnit: number | undefined = endUnit ?? (existingSession as any).endUnit;

            if (typeof finalStartUnit === 'number' && typeof finalEndUnit === 'number') {
              const difficultyValue = typeof difficulty === 'number' ? difficulty : Number(difficulty);
              let quality = Number.isNaN(difficultyValue) ? 4 : 6 - Math.round(difficultyValue);
              quality = Math.max(0, Math.min(5, quality));

              if (__DEV__) {
                console.log('[RecordSession] Edit mode - applying SM-2 for review completion with quality=' + quality);
              }

              const { reviewItemService } = await import('../../services');
              let targets: any[] = [];
              
              // reviewItemIdsが指定されている場合はそれを使用（最も確実）
              if (reviewItemIds && reviewItemIds.length > 0) {
                if (__DEV__) {
                  console.log(`[RecordSession] Edit mode - Using provided reviewItemIds: ${reviewItemIds.length} items`);
                }
                // 指定されたIDの復習アイテムを取得
                targets = await Promise.all(
                  reviewItemIds.map(async (id: string) => {
                    try {
                      return await reviewItemService.getReviewItemById(id);
                    } catch (e) {
                      if (__DEV__) {
                        console.warn(`[RecordSession] Edit mode - Failed to get review item ${id}:`, e);
                      }
                      return null;
                    }
                  })
                );
                targets = targets.filter((it) => it !== null);
              } else {
                // reviewItemIdsが指定されていない場合は範囲から検索
                const items: any[] = (await reviewItemService.getReviewItemsByPlanId(planId)) || [];
                // 今日期限の復習アイテムのみを対象にする
                const today = startOfDay(new Date());
                targets = items.filter((it) => {
                  const n = Number(it.unitNumber);
                  const isInRange = !Number.isNaN(n) && n >= finalStartUnit! && n <= finalEndUnit!;
                  // 今日期限のアイテムのみを対象
                  const reviewDate = startOfDay(new Date(it.nextReviewDate));
                  const isDueToday = reviewDate.getTime() <= today.getTime();
                  return isInRange && isDueToday;
                });
              }
              
              if (targets.length > 0) {
                if (__DEV__) {
                  console.log(`[RecordSession] Edit mode - Applying SM-2 quality=${quality} to ${targets.length} review items to regenerate schedule`);
                }
                await Promise.all(targets.map((it) => recordReview.mutateAsync({ itemId: it.id, quality })));
                if (__DEV__) {
                  console.log(`[RecordSession] Edit mode - SM-2 applied successfully. Next review dates updated`);
                }
              }
            }
          } catch (e) {
            if (__DEV__) {
              console.warn('[RecordSession] Failed to auto-apply SM-2 on edit (review):', e);
            }
          }
        } else {
          // 通常学習の編集時: SM-2は適用しない（新規復習アイテムは生成されない）
          if (__DEV__) {
            console.log('[RecordSession] Edit mode - normal learning (no SM-2 applied)');
          }
        }
      } else {
        // 新規作成はロジック分離
        const session = new StudySessionEntity({
          id: `session-${Date.now()}`,
          userId,
          planId,
          date: new Date(),
          unitsCompleted: unitsNumber,
          durationMinutes: duration,
          concentration,
          difficulty,
          round: round ?? task?.round ?? 1,
          startUnit,
          endUnit,
        } as any);

        let autoStartUnit: number;
        let computedEndUnit: number;

        if (inputMode === 'range' && startUnit !== undefined && endUnit !== undefined) {
          // 範囲モード: ユーザーが指定した範囲を使用
          autoStartUnit = startUnit;
          computedEndUnit = endUnit;
        } else {
          // 量モード: 従来通り自動計算
          const cumulativeCompleted = Array.isArray(sessions) ? sessions.reduce((s: number, it: any) => s + (it.unitsCompleted || 0), 0) : 0;
          autoStartUnit = cumulativeCompleted + 1;
          computedEndUnit = autoStartUnit + unitsNumber - 1;
        }

        if (__DEV__) {
          console.log('[RecordSession] Session creation params:', {
            isReviewCompletion,
            inputMode,
            startUnit,
            endUnit,
            autoStartUnit,
            computedEndUnit,
            unitsNumber,
            difficulty,
          });
        }

        // compute initialQuality from difficulty (6 - difficulty, clamped 0..5)
        // SM-2アルゴリズム用の品質値に変換: 難易度1(簡単) → quality 5(最良)、難易度5(難) → quality 1(困難)
        const difficultyValue = typeof difficulty === 'number' ? difficulty : Number(difficulty);
        let initialQuality = Number.isNaN(difficultyValue) ? 4 : 6 - Math.round(difficultyValue);
        initialQuality = Math.max(0, Math.min(5, initialQuality));

        // ★修正: 復習タスク完了と通常学習を区別
        if (isReviewCompletion) {
          // ===== 復習タスク完了ロジック =====
          // 既存の復習アイテムに対してSM-2を適用して次回復習日をスケジュール
          if (__DEV__) {
            console.log('[RecordSession] Review completion flow - applying SM-2 to existing review items');
          }
          
          // セッションを記録（復習アイテムの生成は行わない）
          const newSession = new StudySessionEntity({
            id: `session-${Date.now()}`,
            userId,
            planId,
            date: new Date(),
            unitsCompleted: unitsNumber,
            durationMinutes: duration,
            concentration,
            difficulty,
            round: round ?? 1,
            startUnit: autoStartUnit,
            endUnit: computedEndUnit,
          } as any);
          
          await createSession.mutateAsync(newSession);
          
          // 既存の復習アイテムに対してSM-2を適用して次回復習日を再生成
          try {
            const { reviewItemService } = await import('../../services');
            let targets: any[] = [];
            
            // reviewItemIdsが指定されている場合はそれを使用（最も確実）
            if (reviewItemIds && reviewItemIds.length > 0) {
              if (__DEV__) {
                console.log(`[RecordSession] Using provided reviewItemIds: ${reviewItemIds.length} items`);
              }
              // 指定されたIDの復習アイテムを取得
              targets = await Promise.all(
                reviewItemIds.map(async (id: string) => {
                  try {
                    return await reviewItemService.getReviewItemById(id);
                  } catch (e) {
                    if (__DEV__) {
                      console.warn(`[RecordSession] Failed to get review item ${id}:`, e);
                    }
                    return null;
                  }
                })
              );
              targets = targets.filter((it) => it !== null);
            } else {
              // reviewItemIdsが指定されていない場合は範囲から検索
              const items: any[] = (await reviewItemService.getReviewItemsByPlanId(planId)) || [];
              if (__DEV__) {
                console.log(`[RecordSession] Found ${items.length} review items for plan ${planId}`);
                console.log(`[RecordSession] Looking for units between ${autoStartUnit} and ${computedEndUnit}`);
              }
              
              // 今日期限の復習アイテムのみを対象にする
              const today = startOfDay(new Date());
              targets = items.filter((it) => {
                const n = Number(it.unitNumber);
                const isInRange = !Number.isNaN(n) && n >= autoStartUnit && n <= computedEndUnit;
                // 今日期限のアイテムのみを対象
                const reviewDate = startOfDay(new Date(it.nextReviewDate));
                const isDueToday = reviewDate.getTime() <= today.getTime();
                return isInRange && isDueToday;
              });
            }
            
            if (__DEV__) {
              console.log(`[RecordSession] Found ${targets.length} matching review items to update with SM-2`);
              if (targets.length > 0) {
                console.log(`[RecordSession] Target review items: ${targets.map((t: any) => `${t.unitNumber} (id: ${t.id})`).join(', ')}`);
              }
            }
            
            // 復習済みアイテムに対してSM-2を適用（次回復習日を計算して再生成）
            if (targets.length > 0) {
              if (__DEV__) {
                console.log(`[RecordSession] Applying SM-2 quality=${initialQuality} to ${targets.length} review items to regenerate schedule`);
              }
              await Promise.all(targets.map((it) => recordReview.mutateAsync({ itemId: it.id, quality: initialQuality })));
              if (__DEV__) {
                console.log(`[RecordSession] SM-2 applied successfully. Next review dates updated based on quality ${initialQuality}`);
              }
            } else {
              if (__DEV__) {
                console.log(`[RecordSession] No matching review items found for range ${autoStartUnit}-${computedEndUnit}`);
              }
            }
          } catch (e) {
            if (__DEV__) {
              console.warn('[RecordSession] Failed to apply SM-2 for review tasks:', e);
            }
          }
        } else {
          // ===== 通常学習ロジック =====
          // 新規セッションを記録し、新しい復習アイテムを自動生成
          if (__DEV__) {
            console.log('[RecordSession] Normal learning flow - creating session with review items');
          }
          
          const session = new StudySessionEntity({
            id: `session-${Date.now()}`,
            userId,
            planId,
            date: new Date(),
            unitsCompleted: unitsNumber,
            durationMinutes: duration,
            concentration,
            difficulty,
            round: round ?? task?.round ?? 1,
            startUnit: autoStartUnit,
            endUnit: computedEndUnit,
          } as any);

          // サービスの統合メソッドで新規セッション + 復習アイテム生成
          await (await import('../../services')).studySessionService.recordSessionWithReviewItems(
            session,
            planId,
            autoStartUnit,
            computedEndUnit,
            initialQuality
          );
          
          if (__DEV__) {
            console.log('[RecordSession] Session created successfully:', {
              sessionId: session.id,
              unitsCompleted: unitsNumber,
              duration,
            });
          }
        }
        
        // セッション作成後の復習タスク自動作成処理は削除
        // 代わりに TasksScreen で今日のタスク完了時に自動作成するように変更
        
        // 新規セッション作成経路は service を直接呼んでいるため React Query のキャッシュ更新が行われない。
        // 保存後に関連クエリを無効化して TasksScreen / Review リストが最新化されるようにする。
        try {
          console.log('Invalidating queries...');
          queryClient.invalidateQueries({ queryKey: ['dailyTasks', userId] });
          queryClient.invalidateQueries({ queryKey: ['upcomingTasks', userId] });
          queryClient.invalidateQueries({ queryKey: ['tasksForDate', userId] });
          queryClient.invalidateQueries({ queryKey: ['reviewItems', 'due', userId] });
          queryClient.invalidateQueries({ queryKey: ['reviewItems', 'user', userId] });
          // TasksScreenの履歴タブで使用されるキー
          queryClient.invalidateQueries({ queryKey: ['studySessions', 'user', userId] });
          // 統計画面で使用されるキー（重要: 統計が正しく更新されるように）
          queryClient.invalidateQueries({ queryKey: ['sessions', 'all', userId] });
          // 統計データのキャッシュも無効化
          queryClient.invalidateQueries({ queryKey: ['stats', userId] });
          // PlanDetail uses the ['studySessions', planId] key; invalidate it so the detail view refreshes
          queryClient.invalidateQueries({ queryKey: ['studySessions', planId] });
          queryClient.invalidateQueries({ queryKey: ['dailyTasks', 'plan', planId] });
        } catch (e) {
          // ignore
        }

        // ポイント付与処理: 新規セッションのみ（編集時は付与しない）
        if (!isEditMode) {
          try {
            // 総学習時間を更新（時間単位に変換）
            const studyHours = duration / 60;
            await addStudyHours.mutateAsync(studyHours);
            
            const isContinuous = duration >= 60; // 1時間以上で継続ボーナス
            const pointsEarned = Math.round(duration * 0.017 * (isContinuous ? 1.2 : 1));
            const result = await updateUserPoints.mutateAsync({
              pointsEarned,
              reason: `学習セッション完了: ${duration}分`,
            });
            console.log(`[RecordSession] Points awarded: ${pointsEarned}pt, Study hours: ${studyHours}h`);
            
            // レベルアップ検出
            if (result && (result as any).leveledUp) {
              pointsMessage = `✨ +${pointsEarned}pt | Lv.${(result as any).newLevel}にレベルアップ!`;
              // レベルアップモーダルを表示
              setNewLevel((result as any).newLevel);
              setShowLevelUpModal(true);
            } else if (pointsEarned > 0) {
              pointsMessage = `+ ${pointsEarned}pt`;
            }
            
            // アカウント関連のキャッシュを無効化してアカウント画面を更新
            queryClient.invalidateQueries({ queryKey: ['account', 'profile', userId] });
            queryClient.invalidateQueries({ queryKey: ['userStats', userId] });
          } catch (e) {
            console.warn('[RecordSession] Failed to award points:', e);
          }
        }
      }
      // 成功時はトーストを表示して戻る
      try {
        const baseMessage = isEditMode ? 'セッションが更新されました' : t('today.sessionRecord.success');
        const toastMessage = pointsMessage ? `${baseMessage} ${pointsMessage}` : baseMessage;
        toast.show(toastMessage);
      } catch (e) {}
      // レベルアップモーダルが表示されていない場合のみナビゲート
      if (!showLevelUpModal) {
        // If opened from Timer, close both RecordSession and Timer by popping two screens.
        try {
          if (fromTimer) {
            // pop two (RecordSession + TimerScreen)
            (navigation as any).pop?.(2);
            return;
          }
        } catch (e) {}
        
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert(t('common.error'), isEditMode ? 'セッションの更新に失敗しました' : t('today.sessionRecord.error'));
    }
  };

  return (
    <>
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()} accessible={false}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <ScrollView style={[styles.content, { backgroundColor: colors.background }]} contentContainerStyle={styles.scrollContent}>
        {/* モード選択 */}
        {!isReviewCompletion && (
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>入力モード</Text>
            <View style={styles.modeSelector}>
              <TouchableOpacity
                style={[styles.modeButton, inputMode === 'quantity' && [styles.modeButtonActive, { backgroundColor: colors.primary }]]}
                onPress={() => setInputMode('quantity')}
              >
                <Text style={[styles.modeButtonText, inputMode === 'quantity' && styles.modeButtonTextActive]}>
                  量を入力
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeButton, inputMode === 'range' && [styles.modeButtonActive, { backgroundColor: colors.primary }]]}
                onPress={() => setInputMode('range')}
              >
                <Text style={[styles.modeButtonText, inputMode === 'range' && styles.modeButtonTextActive]}>
                  範囲を指定
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 量モード */}
        {inputMode === 'quantity' && (
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>完了した単元数</Text>
            <View style={styles.sliderContainer}>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={Math.max(1, plan?.totalUnits ?? 100)}
                step={1}
                value={parseInt(unitsInput) || 1}
                onValueChange={(value) => setUnitsInput(String(Math.round(value)))}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.border}
                thumbTintColor={colors.primary}
              />
              <TextInput
                style={[styles.input, { flex: 1, color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
                value={unitsInput}
                onChangeText={(v) => setUnitsInput(v.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                placeholder="例: 10"
                placeholderTextColor={colors.textTertiary}
              />
            </View>
            <Text style={[styles.mutedText, { color: colors.textSecondary }]}>学習範囲: {previewStartUnit} 〜 {previewEndUnit}</Text>
          </View>
        )}

        {/* 範囲モード */}
        {inputMode === 'range' && (
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>学習範囲</Text>
            <View style={styles.rangeContainer}>
              <View style={styles.rangeInputGroup}>
                <Text style={[styles.rangeLabel, { color: colors.textSecondary }]}>開始単元</Text>
                <TextInput
                  style={[styles.rangeInput, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
                  value={rangeStartInput}
                  onChangeText={(v) => setRangeStartInput(v.replace(/[^0-9]/g, ''))}
                  keyboardType="number-pad"
                  placeholder="1"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
              <Text style={[styles.rangeSeparator, { color: colors.text }]}>〜</Text>
              <View style={styles.rangeInputGroup}>
                <Text style={[styles.rangeLabel, { color: colors.textSecondary }]}>終了単元</Text>
                <TextInput
                  style={[styles.rangeInput, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
                  value={rangeEndInput}
                  onChangeText={(v) => setRangeEndInput(v.replace(/[^0-9]/g, ''))}
                  keyboardType="number-pad"
                  placeholder="10"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
            </View>
            {rangeStartInput && rangeEndInput && (
              <Text style={[styles.mutedText, { color: colors.textSecondary }]}>
                完了単元数: {Math.max(0, parseInt(rangeEndInput) - parseInt(rangeStartInput) + 1)} 個
              </Text>
            )}
          </View>
        )}

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>{t('today.sessionRecord.duration')}</Text>
          <View style={styles.sliderContainer}>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={300}
              step={10}
              value={parseInt(durationMinutes) || 5}
              onValueChange={(value) => setDurationMinutes(String(Math.round(value)))}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
            />
            <TextInput
              style={[styles.input, { flex: 1, color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
              value={durationMinutes}
              onChangeText={setDurationMinutes}
              keyboardType="number-pad"
              placeholder="60"
              placeholderTextColor={colors.textTertiary}
            />
          </View>
        </View>

        <View style={[styles.formGroup, styles.centerAlignedGroup]}>
          <Text style={[styles.label, { color: colors.text }]}>{t('today.sessionRecord.concentration')}</Text>
          <View style={styles.centeredRow}>
            {[0.2, 0.4, 0.6, 0.8, 1.0].map((value) => (
              <TouchableOpacity
                key={String(value)}
                style={[
                  styles.iconButton,
                  concentration === value && [styles.iconButtonActive, { backgroundColor: colors.primary }],
                ]}
                onPress={() => setConcentration(value)}
              >
                <Text style={concentration === value ? styles.ratingButtonTextActive : styles.ratingButtonText}>
                  {value === 0.2 ? '😩' : value === 0.4 ? '☹️' : value === 0.6 ? '🙂' : value === 0.8 ? '😊' : '😁'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.formGroup, styles.centerAlignedGroup]}>
          <Text style={[styles.label, { color: colors.text }]}>{t('today.sessionRecord.difficulty')}</Text>
          <View style={styles.centeredRow}>
            {[1, 2, 3, 4, 5].map((value) => (
              <TouchableOpacity
                key={value}
                onPress={() => setDifficulty(value)}
                style={styles.starButton}
              >
                <Ionicons name={value <= difficulty ? 'star' : 'star-outline'} size={28} color={value <= difficulty ? colors.primary : colors.border} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {typeof round !== 'undefined' && (
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>{t('today.sessionRecord.round')}</Text>
            <Text style={[styles.roundText, { color: colors.textSecondary }]}>R{round}</Text>
          </View>
        )}

        <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleSave} disabled={createSession.isPending}>
          <Text style={styles.saveButtonText}>{createSession.isPending ? t('today.sessionRecord.saving') : t('today.sessionRecord.save')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  </TouchableWithoutFeedback>

  {/* レベルアップモーダル */}
  {newLevel !== null && (
    <LevelUpModal
      visible={showLevelUpModal}
      level={newLevel}
      onDismiss={() => {
        setShowLevelUpModal(false);
        // モーダル閉鎖後にナビゲート
        try {
          if (fromTimer) {
            (navigation as any).pop?.(2);
          } else {
            navigation.goBack();
          }
        } catch (e) {}
      }}
    />
  )}
</>);
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: defaultColors.background },
  header: { padding: spacing.lg, backgroundColor: defaultColors.card, borderBottomWidth: 1, borderBottomColor: defaultColors.border },
  headerTitle: { ...textStyles.h1, color: defaultColors.text },
  content: { flex: 1 },
  scrollContent: { padding: spacing.lg },
  formGroup: { marginBottom: spacing.lg },
  label: { ...textStyles.body, fontWeight: '600', marginBottom: spacing.sm },
  input: { ...textStyles.body, borderWidth: 1, borderColor: defaultColors.border, borderRadius: 8, padding: spacing.md, backgroundColor: defaultColors.background },
  saveButton: { backgroundColor: defaultColors.primary, padding: spacing.md, borderRadius: 8, alignItems: 'center' },
  saveButtonText: { ...textStyles.button, color: defaultColors.white },
  ratingButtons: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  ratingButton: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: 8, borderWidth: 1, borderColor: defaultColors.border, backgroundColor: defaultColors.backgroundSecondary },
  ratingButtonActive: { backgroundColor: defaultColors.primary, borderColor: defaultColors.primary },
  ratingButtonText: { ...textStyles.bodySmall, color: defaultColors.textSecondary },
  ratingButtonTextActive: { color: defaultColors.textInverse },
  roundText: { ...textStyles.body, fontWeight: '700' },
  mutedText: { ...textStyles.bodySmall, color: defaultColors.textSecondary, marginTop: spacing.sm },
  sliderContainer: { flexDirection: 'row', alignItems: 'center' },
  slider: { width: 250, marginRight: spacing.md },
  stepperButton: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 8, borderWidth: 1, borderColor: defaultColors.border, backgroundColor: defaultColors.backgroundSecondary, minWidth: 40, alignItems: 'center', justifyContent: 'center' },
  stepperButtonText: { ...textStyles.body, fontWeight: '700', color: defaultColors.text },
  // new styles for centered icon controls
  centerAlignedGroup: { alignItems: 'center' },
  centeredRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm },
  iconButton: { padding: spacing.sm, borderRadius: 8, marginHorizontal: spacing.xs, backgroundColor: defaultColors.backgroundSecondary },
  iconButtonActive: { backgroundColor: defaultColors.primary },
  starButton: { paddingHorizontal: spacing.sm, marginHorizontal: spacing.xs },
  // Mode selector styles
  modeSelector: { flexDirection: 'row', gap: spacing.sm },
  modeButton: { flex: 1, paddingVertical: spacing.md, paddingHorizontal: spacing.sm, borderRadius: 8, borderWidth: 1, borderColor: defaultColors.border, backgroundColor: defaultColors.backgroundSecondary, alignItems: 'center' },
  modeButtonActive: { backgroundColor: defaultColors.primary, borderColor: defaultColors.primary },
  modeButtonText: { ...textStyles.body, fontWeight: '600', color: defaultColors.text },
  modeButtonTextActive: { color: defaultColors.white },
  // Range input styles
  rangeContainer: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rangeInputGroup: { flex: 1, gap: spacing.sm },
  rangeLabel: { ...textStyles.bodySmall, fontWeight: '600', color: defaultColors.textSecondary },
  rangeInput: { ...textStyles.body, borderWidth: 1, borderColor: defaultColors.border, borderRadius: 8, padding: spacing.md, backgroundColor: defaultColors.background, textAlign: 'center' },
  rangeSeparator: { ...textStyles.body, fontWeight: '700', color: defaultColors.textSecondary, marginBottom: spacing.md },
});

export default RecordSessionScreen;
