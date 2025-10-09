/**
 * StudyNext - Friends List Screen
 * フレンド一覧・追加・削除画面
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, textStyles } from '../theme';
import type { MainTabScreenProps } from '../navigation/types';
import { useFriends, useAddFriend, useInitializeSocialMockData } from '../hooks';

const CURRENT_USER_ID = 'user-001';

// ランダムなアバターを生成
const AVATAR_OPTIONS = ['👨', '👩', '👨‍💼', '👩‍💼', '👨‍🎓', '👩‍🎓', '🧑', '👦', '👧'];

const getRandomAvatar = () => {
  return AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)];
};

export const FriendsListScreen: React.FC<MainTabScreenProps<'Social'>> = ({ navigation }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [friendName, setFriendName] = useState('');
  const [friendId, setFriendId] = useState('');
  const insets = useSafeAreaInsets();
  
  const { data: friends = [], isLoading, refetch } = useFriends(CURRENT_USER_ID);
  const addFriendMutation = useAddFriend();
  const initMockData = useInitializeSocialMockData();

  const handleAddFriend = async () => {
    if (!friendName.trim()) {
      Alert.alert('エラー', 'フレンドの名前を入力してください');
      return;
    }

    try {
      const newFriend = {
        id: friendId.trim() || `friend-${Date.now()}`,
        name: friendName.trim(),
        avatar: getRandomAvatar(),
        level: 1,
        points: 0,
        status: 'offline' as const,
      };

      await addFriendMutation.mutateAsync({
        userId: CURRENT_USER_ID,
        friend: newFriend,
      });

      setShowAddModal(false);
      setFriendName('');
      setFriendId('');
      Alert.alert('成功', `${friendName}さんをフレンドに追加しました！`);
    } catch (error) {
      Alert.alert('エラー', 'フレンドの追加に失敗しました');
      console.error('Add friend error:', error);
    }
  };

  const handleInitMockData = async () => {
    try {
      await initMockData.mutateAsync(CURRENT_USER_ID);
      refetch();
      Alert.alert('成功', 'モックデータを初期化しました');
    } catch (error) {
      Alert.alert('エラー', 'モックデータの初期化に失敗しました');
      console.error('Init mock data error:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <View style={[styles.header, { paddingTop: insets.top }]}> 
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitleSmall}>フレンド</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addButton}>
          <Ionicons name="person-add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* フレンド一覧 */}
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>フレンド一覧</Text>
            <Text style={styles.friendCount}>{friends.length}人</Text>
          </View>

          {friends.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyStateText}>まだフレンドがいません</Text>
              <TouchableOpacity 
                style={styles.mockDataButton}
                onPress={handleInitMockData}
              >
                <Text style={styles.mockDataButtonText}>モックデータを読み込む</Text>
              </TouchableOpacity>
            </View>
          ) : (
            friends.map((friend) => (
              <View key={friend.id} style={styles.friendCard}>
                <View style={styles.friendLeft}>
                  <View style={styles.avatarContainer}>
                    <Text style={styles.avatar}>{friend.avatar}</Text>
                    {friend.status === 'online' && (
                      <View style={styles.onlineIndicator} />
                    )}
                  </View>
                  
                  <View style={styles.friendInfo}>
                    <Text style={styles.friendName}>{friend.name}</Text>
                    <View style={styles.statsRow}>
                      <View style={styles.stat}>
                        <Ionicons name="star" size={14} color={colors.warning} />
                        <Text style={styles.statText}>Lv.{friend.level}</Text>
                      </View>
                      <View style={styles.stat}>
                        <Ionicons name="trophy" size={14} color={colors.primary} />
                        <Text style={styles.statText}>{friend.points}pt</Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.friendActions}>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="chatbubble-outline" size={20} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => {
                      Alert.alert(
                        'フレンド削除',
                        `${friend.name}さんをフレンドから削除しますか?`,
                        [
                          { text: 'キャンセル', style: 'cancel' },
                          { 
                            text: '削除', 
                            style: 'destructive',
                            onPress: () => {
                              // TODO: 削除機能の実装
                              Alert.alert('未実装', 'フレンド削除機能は未実装です');
                            }
                          },
                        ]
                      );
                    }}
                  >
                    <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* フレンド追加モーダル */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>フレンドを追加</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>フレンドの名前</Text>
              <TextInput
                style={styles.input}
                placeholder="例: 田中太郎"
                value={friendName}
                onChangeText={setFriendName}
                autoFocus
              />

              <Text style={styles.inputLabel}>フレンドID（オプション）</Text>
              <TextInput
                style={styles.input}
                placeholder="例: user-002"
                value={friendId}
                onChangeText={setFriendId}
              />

              <Text style={styles.inputHint}>
                IDを入力しない場合は自動生成されます
              </Text>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.addButtonModal]}
                onPress={handleAddFriend}
                disabled={addFriendMutation.isPending}
              >
                {addFriendMutation.isPending ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.addButtonText}>追加</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
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
  headerTitleSmall: {
    ...textStyles.h3,
    color: colors.text,
  },
  addButton: {
    padding: spacing.sm,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...textStyles.h3,
    color: colors.text,
  },
  friendCount: {
    ...textStyles.body,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  emptyStateText: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  mockDataButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
  },
  mockDataButtonText: {
    ...textStyles.body,
    color: colors.primary,
    fontWeight: '600',
  },
  friendCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  friendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    fontSize: 28,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.card,
  },
  friendInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  friendName: {
    ...textStyles.body,
    color: colors.text,
    fontWeight: '600',
    fontSize: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statText: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },
  friendActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    padding: spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: colors.card,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    ...textStyles.h3,
    color: colors.text,
  },
  modalBody: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  inputLabel: {
    ...textStyles.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  input: {
    ...textStyles.body,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    color: colors.text,
  },
  inputHint: {
    ...textStyles.caption,
    color: colors.textSecondary,
    marginTop: -spacing.sm,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    ...textStyles.body,
    color: colors.text,
    fontWeight: '600',
  },
  addButtonModal: {
    backgroundColor: colors.primary,
  },
  addButtonText: {
    ...textStyles.body,
    color: colors.white,
    fontWeight: '600',
  },
});
