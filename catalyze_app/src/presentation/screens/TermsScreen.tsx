/**
 * TermsScreen - 利用規約画面
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { spacing, textStyles } from '../theme';

export const TermsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

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
        <Text style={[styles.headerTitleSmall, { color: colors.text }]}>利用規約</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={[styles.lastUpdated, { color: colors.textSecondary }]}>
          最終更新日: 2025年1月1日
        </Text>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>1. はじめに</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            本利用規約（以下「本規約」）は、StudyNext（以下「本サービス」）の利用条件を定めるものです。
            本サービスをご利用いただく際には、本規約に同意いただく必要があります。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>2. アカウント</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            ユーザーは、本サービスを利用するためにアカウントを作成する必要があります。
            アカウント情報は正確かつ最新の状態に保つ責任があります。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>3. ユーザーの責任</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            ユーザーは、本サービスの利用にあたり、法令および本規約を遵守する必要があります。
            不正な利用や他のユーザーへの迷惑行為は禁止されています。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>4. データの取り扱い</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            本サービスで記録された学習データは、ユーザーの同意なく第三者に提供されることはありません。
            詳細はプライバシーポリシーをご確認ください。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>5. サービスの変更・終了</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            本サービスは、予告なく内容を変更または終了する場合があります。
            これによりユーザーに生じた損害について、当社は責任を負いません。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>6. 免責事項</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            本サービスは「現状有姿」で提供され、明示的または黙示的な保証はありません。
            本サービスの利用により生じた損害について、当社は一切の責任を負いません。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>7. 規約の変更</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            本規約は予告なく変更される場合があります。
            変更後も本サービスを継続して利用する場合、変更内容に同意したものとみなされます。
          </Text>
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
    paddingVertical: spacing.sm,
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
  content: {
    padding: spacing.lg,
  },
  lastUpdated: {
    ...textStyles.caption,
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...textStyles.h3,
    marginBottom: spacing.md,
  },
  paragraph: {
    ...textStyles.body,
    lineHeight: 24,
  },
});
