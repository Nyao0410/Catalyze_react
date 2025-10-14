/**
 * Catalyze AI - Add Friend Screen
 * フレンド追加画面
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { colors, textStyles, spacing } from '../theme';
import { useTheme } from '../theme/ThemeProvider';
import type { RootStackParamList } from '../navigation/types';
import { FirebaseAccountService } from '../../application/services/FirebaseAccountService';
import { FirebaseSocialService } from '../../application/services/FirebaseSocialService';
import { SocialService } from '../../application/services/SocialService';
import { getCurrentUserId } from '../../infrastructure/auth';
import type { UserProfile } from '../../types';

type AddFriendScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const AddFriendScreen: React.FC = () => {
  const navigation = useNavigation<AddFriendScreenNavigationProp>();
  const { colors: themeColors } = useTheme();
  
  const [searchUserId, setSearchUserId] = useState('');
  const [searchResult, setSearchResult] = useState<UserProfile | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchUserId.trim()) {
      setError('ユーザーIDを入力してください');
      return;
    }
    
    setIsSearching(true);
    setError(null);
    setSearchResult(null);
    
    try {
      // FirestoreからユーザーIDで検索
      const user = await FirebaseAccountService.searchUserByUserId(searchUserId.trim());
      
      if (user) {
        const currentUserId = await getCurrentUserId();
        if (user.userId === currentUserId) {
          setError('自分自身をフレンドに追加することはできません');
        } else {
          setSearchResult(user);
        }
      } else {
        setError('ユーザーが見つかりませんでした');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('検索中にエラーが発生しました');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddFriend = async () => {
    if (!searchResult) return;
    
    setIsAdding(true);
    try {
      const currentUserId = await getCurrentUserId();
      
      // FirestoreとAsyncStorageの両方に追加
      await Promise.all([
        FirebaseSocialService.addFriend(currentUserId, searchResult.userId, {
          name: searchResult.displayName,
          avatar: searchResult.avatar,
          level: searchResult.level,
          points: searchResult.totalStudyHours * 10, // 学習時間からポイントを計算
        }),
        SocialService.addFriend(currentUserId, {
          id: searchResult.userId,
          name: searchResult.displayName,
          avatar: searchResult.avatar,
          level: searchResult.level,
          points: searchResult.totalStudyHours * 10,
          status: 'offline',
        }),
      ]);
      
      Alert.alert(
        '成功',
        `${searchResult.displayName}さんをフレンドに追加しました`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (err: any) {
      console.error('Add friend error:', err);
      Alert.alert('エラー', 'フレンドの追加に失敗しました');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: themeColors.card, borderBottomColor: themeColors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>フレンドを追加</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.searchSection}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>ユーザーIDで検索</Text>
          <Text style={[styles.sectionDescription, { color: themeColors.textSecondary }]}>
            追加したいユーザーのIDを入力してください
          </Text>
          
          <View style={styles.searchContainer}>
            <Input
              value={searchUserId}
              onChangeText={(text) => {
                setSearchUserId(text);
                setError(null);
                setSearchResult(null);
              }}
              placeholder="ユーザーIDを入力"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isSearching}
            />
            
            <Button
              title={isSearching ? "検索中..." : "検索"}
              onPress={handleSearch}
              disabled={isSearching || !searchUserId.trim()}
              style={styles.searchButton}
            />
          </View>
          
          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </View>

        {searchResult && (
          <View style={[styles.resultSection, { backgroundColor: themeColors.card }]}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>検索結果</Text>
            
            <View style={styles.userCard}>
              <Text style={styles.userAvatar}>{searchResult.avatar}</Text>
              <View style={styles.userInfo}>
                <Text style={[styles.userName, { color: themeColors.text }]}>{searchResult.displayName}</Text>
                <Text style={[styles.userDetail, { color: themeColors.textSecondary }]}>
                  Level {searchResult.level} • {searchResult.totalStudyHours}時間
                </Text>
                <Text style={[styles.userDetail, { color: themeColors.textSecondary }]}>
                  ID: {searchResult.userId}
                </Text>
              </View>
            </View>
            
            <Button
              title={isAdding ? "追加中..." : "フレンドに追加"}
              onPress={handleAddFriend}
              disabled={isAdding}
              style={styles.addButton}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: spacing.sm,
    marginLeft: -spacing.sm,
  },
  headerTitle: {
    ...textStyles.h2,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  searchSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...textStyles.h3,
    marginBottom: spacing.sm,
  },
  sectionDescription: {
    ...textStyles.body,
    marginBottom: spacing.lg,
  },
  searchContainer: {
    gap: spacing.md,
  },
  searchButton: {
    marginTop: spacing.sm,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: '#FEE',
    borderRadius: 8,
  },
  errorText: {
    ...textStyles.body,
    color: colors.error,
    flex: 1,
  },
  resultSection: {
    padding: spacing.lg,
    borderRadius: 12,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
    borderRadius: 12,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  userAvatar: {
    fontSize: 48,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...textStyles.h3,
    marginBottom: spacing.xs,
  },
  userDetail: {
    ...textStyles.bodySmall,
    marginTop: spacing.xs / 2,
  },
  addButton: {
    marginTop: spacing.md,
  },
});
