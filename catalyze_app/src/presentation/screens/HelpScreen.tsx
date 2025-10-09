/**
 * HelpScreen - ヘルプ・サポート画面
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { spacing, textStyles } from '../theme';

export const HelpScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const faqItems = [
    {
      question: '学習計画の作成方法は？',
      answer: 'ホーム画面の「新しい計画」ボタンから、学習内容、期限、目標などを設定できます。',
    },
    {
      question: '進捗が正しく記録されない場合は？',
      answer: 'セッション記録画面で入力内容を確認してください。また、アプリを再起動すると改善することがあります。',
    },
    {
      question: '復習のタイミングは？',
      answer: 'SM-2アルゴリズムに基づいて最適な復習タイミングが自動的に計算されます。',
    },
    {
      question: 'データのバックアップは？',
      answer: 'アカウントでログインすることで、クラウドに自動バックアップされます。',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <View
        style={[
          styles.header,
          { backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: insets.top },
        ]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitleSmall, { color: colors.text }]}>ヘルプ・サポート</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>よくある質問</Text>
          {faqItems.map((item, index) => (
            <View key={index} style={[styles.faqCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.question, { color: colors.text }]}>{item.question}</Text>
              <Text style={[styles.answer, { color: colors.textSecondary }]}>{item.answer}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>お問い合わせ</Text>
          <TouchableOpacity
            style={[styles.contactCard, { backgroundColor: colors.card }]}
            onPress={() => Linking.openURL('mailto:support@studynext.app')}
          >
            <Ionicons name="mail-outline" size={24} color={colors.primary} />
            <View style={styles.contactText}>
              <Text style={[styles.contactTitle, { color: colors.text }]}>メールでお問い合わせ</Text>
              <Text style={[styles.contactDescription, { color: colors.textSecondary }]}>
                support@studynext.app
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm, // compact header
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: spacing.md,
  },
  headerTitle: {
    ...textStyles.h2,
  },
  headerTitleSmall: {
    ...textStyles.h3,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: spacing.lg,
  },
  sectionTitle: {
    ...textStyles.h3,
    marginBottom: spacing.md,
  },
  faqCard: {
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  question: {
    ...textStyles.body,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  answer: {
    ...textStyles.bodySmall,
    lineHeight: 20,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: spacing.lg,
    gap: spacing.md,
  },
  contactText: {
    flex: 1,
  },
  contactTitle: {
    ...textStyles.body,
    fontWeight: '600',
    marginBottom: spacing.xs / 2,
  },
  contactDescription: {
    ...textStyles.caption,
  },
});
