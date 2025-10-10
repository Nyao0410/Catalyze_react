import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { useRecordReview } from '../hooks/useReviewItems';
import { colors, spacing, textStyles } from '../theme';

type Props = RouteProp<RootStackParamList, 'ReviewEvaluation'>;

export const ReviewEvaluationScreen: React.FC = () => {
  const route = useRoute<Props>();
  const navigation = useNavigation();
  const { itemId, reviewItemIds = [], planId, startUnit, endUnit } = route.params || { itemId: undefined };

  const [quality, setQuality] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processedCount, setProcessedCount] = useState(0);

  const recordReview = useRecordReview();

  const handleSubmit = async () => {
    if ((!(itemId || (reviewItemIds && reviewItemIds.length > 0))) || quality === null) return;
    setError(null);
    setLoading(true);
    setProcessedCount(0);
    try {
      // If reviewItemIds provided, process them sequentially so we can track progress and stop on error
      if (reviewItemIds && reviewItemIds.length > 0) {
        // guard: if too many items, ask for confirmation
        if (reviewItemIds.length > 50) {
          // simple confirm via alert — for now proceed
        }
        for (const id of reviewItemIds) {
          await recordReview.mutateAsync({ itemId: id, quality });
          setProcessedCount((c) => c + 1);
        }
        // invalidate queries handled by hook; go back
        navigation.goBack();
        return;
      }

      // fallback: single item
      if (itemId) {
        await recordReview.mutateAsync({ itemId, quality });
        navigation.goBack();
        return;
      }
    } catch (e: any) {
      console.error('Failed to record review bulk', e);
      setError(e?.message || '評価の記録に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>理解度を評価してください</Text>
      {planId && startUnit !== undefined && endUnit !== undefined && (
        <Text style={styles.subtitle}>{`${startUnit}〜${endUnit} の復習 (計 ${reviewItemIds?.length ?? 1} 単位)`}</Text>
      )}
      <View style={styles.choices}>
        {[
          { v: 0, label: '😞', a11y: '非常にわからない' },
          { v: 1, label: '🙁', a11y: 'わかりにくい' },
          { v: 2, label: '😐', a11y: 'あまりわからない' },
          { v: 3, label: '🙂', a11y: 'まあまあわかる' },
          { v: 4, label: '😃', a11y: 'よくわかる' },
          { v: 5, label: '🤩', a11y: 'とてもよくわかる' },
        ].map(({ v, label, a11y }) => (
          <TouchableOpacity
            key={v}
            accessibilityLabel={a11y}
            accessibilityRole="button"
            style={[styles.choice, quality === v && styles.choiceActive]}
            onPress={() => setQuality(v)}
          >
            <Text style={[styles.choiceText, quality === v && styles.choiceTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {reviewItemIds && reviewItemIds.length > 0 && (
        <Text style={styles.progress}>{`処理: ${processedCount}/${reviewItemIds.length}`}</Text>
      )}
      {error && <Text style={styles.error}>{error}</Text>}
      <TouchableOpacity style={[styles.submit, (quality === null || loading) && styles.submitDisabled]} onPress={handleSubmit} disabled={quality === null || loading}>
        <Text style={styles.submitText}>{loading ? '処理中...' : '送信'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, backgroundColor: colors.background },
  title: { ...textStyles.h2, marginBottom: spacing.md },
  choices: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: spacing.lg },
  choice: { padding: spacing.md, borderRadius: 8, borderWidth: 1, borderColor: colors.border, minWidth: 44, alignItems: 'center' },
  choiceActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  choiceText: { ...textStyles.body, color: colors.text },
  choiceTextActive: { color: colors.white },
  subtitle: { ...textStyles.body, color: colors.textSecondary, marginBottom: spacing.sm },
  progress: { ...textStyles.caption, color: colors.textSecondary, marginTop: spacing.sm },
  error: { ...textStyles.caption, color: colors.error, marginTop: spacing.sm },
  submit: { marginTop: spacing.lg, backgroundColor: colors.primary, padding: spacing.md, borderRadius: 8, alignItems: 'center' },
  submitDisabled: { opacity: 0.5 },
  submitText: { ...textStyles.button, color: colors.white }
});

export default ReviewEvaluationScreen;
