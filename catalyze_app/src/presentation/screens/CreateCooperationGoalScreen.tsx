/**
 * StudyNext - Create Cooperation Goal Screen
 * 協力目標作成画面
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, textStyles } from '../theme';
import type { MainTabScreenProps } from '../navigation/types';
import { useFriends, useCreateCooperationGoal } from '../hooks';
import { useTopToast } from '../hooks/useTopToast';

const CURRENT_USER_ID = 'user-001';

// 期限の選択肢（日数）
const DEADLINE_OPTIONS = [
  { label: '1週間後', days: 7 },
  { label: '2週間後', days: 14 },
  { label: '1ヶ月後', days: 30 },
  { label: '2ヶ月後', days: 60 },
  { label: '3ヶ月後', days: 90 },
];

export const CreateCooperationGoalScreen: React.FC<MainTabScreenProps<'Social'>> = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetProgress, setTargetProgress] = useState('100');
  const [selectedDeadlineDays, setSelectedDeadlineDays] = useState(30);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

  const { data: friends = [], isLoading: isLoadingFriends } = useFriends(CURRENT_USER_ID);
  const createGoalMutation = useCreateCooperationGoal();
  const toast = useTopToast();

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriends(prev => 
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleCreateGoal = async () => {
    if (!title.trim()) {
      Alert.alert('エラー', 'タイトルを入力してください');
      return;
    }

    if (selectedFriends.length === 0) {
      Alert.alert('エラー', '少なくとも1人のフレンドを選択してください');
      return;
    }

    try {
      const deadline = new Date(Date.now() + selectedDeadlineDays * 24 * 60 * 60 * 1000);
      
      const goal = {
        title: title.trim(),
        description: description.trim(),
        creatorId: CURRENT_USER_ID,
        participantIds: [CURRENT_USER_ID, ...selectedFriends],
        currentProgress: 0,
        targetProgress: parseInt(targetProgress) || 100,
        deadline,
      };

  await createGoalMutation.mutateAsync(goal);
  // 成功時は画面上部にトーストを表示して戻る
  toast.show('協力目標を作成しました');
  navigation.goBack();
    } catch (error) {
      Alert.alert('エラー', '協力目標の作成に失敗しました');
      console.error('Create goal error:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>協力目標を作成</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          {/* タイトル */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>タイトル *</Text>
            <TextInput
              style={styles.input}
              placeholder="例: みんなで100時間勉強チャレンジ"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* 説明 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>説明</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="目標の内容を入力してください"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />
          </View>

          {/* 目標値 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>目標値（時間）*</Text>
            <TextInput
              style={styles.input}
              placeholder="100"
              value={targetProgress}
              onChangeText={setTargetProgress}
              keyboardType="numeric"
            />
          </View>

          {/* 期限 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>期限 *</Text>
            <View style={styles.deadlineOptions}>
              {DEADLINE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.days}
                  style={[
                    styles.deadlineOption,
                    selectedDeadlineDays === option.days && styles.deadlineOptionSelected,
                  ]}
                  onPress={() => setSelectedDeadlineDays(option.days)}
                >
                  <Text
                    style={[
                      styles.deadlineOptionText,
                      selectedDeadlineDays === option.days && styles.deadlineOptionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.deadlineHint}>
              期限: {new Date(Date.now() + selectedDeadlineDays * 24 * 60 * 60 * 1000).toLocaleDateString('ja-JP')}
            </Text>
          </View>

          {/* 参加者選択 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>参加者を選択 *</Text>
            {isLoadingFriends ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : friends.length === 0 ? (
              <View style={styles.emptyFriends}>
                <Text style={styles.emptyText}>フレンドがいません</Text>
                <TouchableOpacity 
                  style={styles.addFriendButton}
                  // ネストされたタブの Social を開くには MainTabs を経由して指定する
                  onPress={() => navigation.navigate('MainTabs', { screen: 'Social' } as any)}
                >
                  <Text style={styles.addFriendButtonText}>フレンドを追加</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.friendsList}>
                {friends.map((friend) => (
                  <TouchableOpacity
                    key={friend.id}
                    style={[
                      styles.friendItem,
                      selectedFriends.includes(friend.userId) && styles.friendItemSelected,
                    ]}
                    onPress={() => toggleFriendSelection(friend.userId)}
                  >
                    <View style={styles.friendItemLeft}>
                      <Text style={styles.friendAvatar}>{friend.avatar}</Text>
                      <Text style={styles.friendName}>{friend.name}</Text>
                    </View>
                    {selectedFriends.includes(friend.userId) && (
                      <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* 選択された参加者 */}
          {selectedFriends.length > 0 && (
            <View style={styles.selectedSection}>
              <Text style={styles.selectedTitle}>
                選択中: {selectedFriends.length + 1}人（自分を含む）
              </Text>
              <View style={styles.selectedFriends}>
                <View style={styles.selectedFriend}>
                  <Text style={styles.selectedAvatar}>👤</Text>
                  <Text style={styles.selectedName}>あなた</Text>
                </View>
                {friends
                  .filter(f => selectedFriends.includes(f.userId))
                  .map(friend => (
                    <View key={friend.id} style={styles.selectedFriend}>
                      <Text style={styles.selectedAvatar}>{friend.avatar}</Text>
                      <Text style={styles.selectedName}>{friend.name}</Text>
                    </View>
                  ))
                }
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* 作成ボタン */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.createButton, createGoalMutation.isPending && styles.createButtonDisabled]}
          onPress={handleCreateGoal}
          disabled={createGoalMutation.isPending}
        >
          {createGoalMutation.isPending ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Ionicons name="add-circle-outline" size={24} color={colors.white} />
              <Text style={styles.createButtonText}>作成する</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    ...textStyles.h2,
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  inputGroup: {
    gap: spacing.sm,
  },
  label: {
    ...textStyles.body,
    color: colors.text,
    fontWeight: '600',
  },
  input: {
    ...textStyles.body,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    color: colors.text,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  deadlineOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  deadlineOption: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
  },
  deadlineOptionSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  deadlineOptionText: {
    ...textStyles.body,
    color: colors.text,
  },
  deadlineOptionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  deadlineHint: {
    ...textStyles.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  emptyFriends: {
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyText: {
    ...textStyles.body,
    color: colors.textSecondary,
  },
  addFriendButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
  },
  addFriendButtonText: {
    ...textStyles.body,
    color: colors.primary,
    fontWeight: '600',
  },
  friendsList: {
    gap: spacing.sm,
  },
  friendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
  },
  friendItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  friendItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  friendAvatar: {
    fontSize: 24,
  },
  friendName: {
    ...textStyles.body,
    color: colors.text,
    fontWeight: '600',
  },
  selectedSection: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  selectedTitle: {
    ...textStyles.body,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  selectedFriends: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  selectedFriend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primaryLight,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 16,
  },
  selectedAvatar: {
    fontSize: 16,
  },
  selectedName: {
    ...textStyles.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: spacing.md,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    ...textStyles.body,
    color: colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
});
