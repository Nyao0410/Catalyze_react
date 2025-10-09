/**
 * AboutScreen - アプリについて画面
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { spacing, textStyles } from '../theme';

export const AboutScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
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
        <Text style={[styles.headerTitleSmall, { color: colors.text }]}>アプリについて</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoEmoji}>📚</Text>
          <Text style={[styles.appName, { color: colors.text }]}>StudyNext</Text>
          <Text style={[styles.version, { color: colors.textSecondary }]}>Version 1.0.0</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>アプリについて</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            StudyNext は、あなたの学習を効率的にサポートする学習管理アプリです。
            科学的な学習メソッドに基づいた機能で、目標達成をサポートします。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>主な機能</Text>
          <View style={[styles.featureCard, { backgroundColor: colors.card }]}>
            <Ionicons name="calendar-outline" size={24} color={colors.primary} />
            <View style={styles.featureText}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>学習計画管理</Text>
              <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                目標に合わせた計画を作成・管理
              </Text>
            </View>
          </View>

          <View style={[styles.featureCard, { backgroundColor: colors.card }]}>
            <Ionicons name="analytics-outline" size={24} color={colors.primary} />
            <View style={styles.featureText}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>進捗の可視化</Text>
              <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                学習状況をグラフで確認
              </Text>
            </View>
          </View>

          <View style={[styles.featureCard, { backgroundColor: colors.card }]}>
            <Ionicons name="repeat-outline" size={24} color={colors.primary} />
            <View style={styles.featureText}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>復習リマインダー</Text>
              <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                最適なタイミングで復習を通知
              </Text>
            </View>
          </View>

          <View style={[styles.featureCard, { backgroundColor: colors.card }]}>
            <Ionicons name="people-outline" size={24} color={colors.primary} />
            <View style={styles.featureText}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>ソーシャル機能</Text>
              <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                友達と一緒に学習目標を達成
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>開発者情報</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            © 2025 StudyNext Development Team
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>リンク</Text>
          <TouchableOpacity
            style={[styles.linkCard, { backgroundColor: colors.card }]}
            onPress={() => Linking.openURL('https://uujii-vercy.github.io/vercy.github.io/')}
          >
            <Ionicons name="globe-outline" size={24} color={colors.primary} />
            <Text style={[styles.linkText, { color: colors.text }]}>公式ウェブサイト</Text>
            <Ionicons name="open-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.linkCard, { backgroundColor: colors.card }]}
            onPress={() => Linking.openURL('https://github.com/Nyao0410')}
          >
            <Ionicons name="logo-github" size={24} color={colors.primary} />
            <Text style={[styles.linkText, { color: colors.text }]}>GitHub</Text>
            <Ionicons name="open-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.copyright, { color: colors.textSecondary }]}>
            Made with ❤️ for learners worldwide
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
  logoContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  logoEmoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  appName: {
    ...textStyles.h1,
    marginBottom: spacing.xs,
  },
  version: {
    ...textStyles.body,
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
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    ...textStyles.body,
    fontWeight: '600',
    marginBottom: spacing.xs / 2,
  },
  featureDescription: {
    ...textStyles.caption,
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  linkText: {
    ...textStyles.body,
    fontWeight: '600',
    flex: 1,
  },
  copyright: {
    ...textStyles.caption,
    textAlign: 'center',
  },
});
