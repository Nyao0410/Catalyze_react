/**
 * PrivacyPolicyScreen - プライバシーポリシー画面
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { spacing, textStyles } from '../theme';

export const PrivacyPolicyScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
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
        <Text style={[styles.headerTitleSmall, { color: colors.text }]}>プライバシーポリシー</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={[styles.lastUpdated, { color: colors.textSecondary }]}>
          最終更新日: 2025年1月1日
        </Text>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>1. 収集する情報</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            本サービスでは、以下の情報を収集します：
          </Text>
          <Text style={[styles.listItem, { color: colors.textSecondary }]}>
            • アカウント情報（メールアドレス、表示名）
          </Text>
          <Text style={[styles.listItem, { color: colors.textSecondary }]}>
            • 学習記録データ（学習時間、進捗状況）
          </Text>
          <Text style={[styles.listItem, { color: colors.textSecondary }]}>
            • 使用端末情報（OS、ブラウザ種類）
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>2. 情報の利用目的</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            収集した情報は以下の目的で利用されます：
          </Text>
          <Text style={[styles.listItem, { color: colors.textSecondary }]}>
            • サービスの提供および改善
          </Text>
          <Text style={[styles.listItem, { color: colors.textSecondary }]}>
            • ユーザーサポート
          </Text>
          <Text style={[styles.listItem, { color: colors.textSecondary }]}>
            • 統計データの作成（個人を特定できない形式）
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>3. 情報の共有</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            ユーザーの個人情報は、以下の場合を除き第三者と共有されません：
          </Text>
          <Text style={[styles.listItem, { color: colors.textSecondary }]}>
            • ユーザーの同意がある場合
          </Text>
          <Text style={[styles.listItem, { color: colors.textSecondary }]}>
            • 法令に基づく場合
          </Text>
          <Text style={[styles.listItem, { color: colors.textSecondary }]}>
            • サービス提供に必要な業務委託先との共有
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>4. データの保管</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            ユーザーデータは、適切なセキュリティ対策を講じた上でクラウドサーバーに保管されます。
            データは暗号化され、不正アクセスから保護されています。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>5. Cookie とトラッキング</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            本サービスでは、ユーザー体験の向上のために Cookie を使用する場合があります。
            ユーザーはブラウザ設定で Cookie を無効にすることができます。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>6. ユーザーの権利</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            ユーザーは以下の権利を有します：
          </Text>
          <Text style={[styles.listItem, { color: colors.textSecondary }]}>
            • 個人情報の開示請求
          </Text>
          <Text style={[styles.listItem, { color: colors.textSecondary }]}>
            • 個人情報の訂正・削除請求
          </Text>
          <Text style={[styles.listItem, { color: colors.textSecondary }]}>
            • データのエクスポート
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>7. お問い合わせ</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            プライバシーに関するお問い合わせは、vercy.app@gmail.com までご連絡ください。
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
    marginBottom: spacing.sm,
  },
  listItem: {
    ...textStyles.body,
    lineHeight: 24,
    paddingLeft: spacing.md,
  },
});
