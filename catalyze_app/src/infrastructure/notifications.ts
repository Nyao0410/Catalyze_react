/**
 * Notification utilities
 * 通知の許可リクエストと管理
 */

import { Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const NOTIFICATION_TOKEN_KEY = '@studynext:notificationToken';

/**
 * 通知の設定（フォアグラウンド時の挙動）
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * 通知の許可をリクエスト
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      Alert.alert(
        '通知が無効です',
        '通知を受け取るには、設定で通知を有効にしてください。',
        [{ text: 'OK' }]
      );
      return false;
    }

    // プッシュトークンの取得は、Expo Go（開発用クライアント）では正しく動作しないため
    // expo dev client / standalone build の場合のみ取得する。
    // Constants.appOwnership === 'expo' のときは Expo Go 上で動作している。
    if (Platform.OS !== 'web' && Constants.appOwnership !== 'expo') {
      try {
        const token = (await Notifications.getExpoPushTokenAsync()).data;
        await AsyncStorage.setItem(NOTIFICATION_TOKEN_KEY, token);
        console.log('Push token:', token);
      } catch (err) {
        // push token の取得は環境依存なので失敗しても処理を続ける
        console.warn('Could not get Expo push token (dev environment?):', err);
      }
    } else {
      console.log('Skipping push token registration in Expo Go / web environment');
    }

    return true;
  } catch (error) {
    console.error('Failed to get notification permissions:', error);
    return false;
  }
}

/**
 * 現在の通知許可状態を取得
 */
export async function getNotificationPermissionStatus(): Promise<boolean> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Failed to get notification permission status:', error);
    return false;
  }
}

/**
 * デイリーリマインダーをスケジュール
 */
export async function scheduleDailyReminder(hour: number = 20, minute: number = 0): Promise<void> {
  try {
    // 既存のリマインダーをキャンセル
    await Notifications.cancelAllScheduledNotificationsAsync();

    // 新しいリマインダーをスケジュール
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📚 学習の時間です',
        body: '今日の学習目標を達成しましょう！',
        data: { type: 'daily_reminder' },
      },
      trigger: ({
        type: 'calendar',
        hour,
        minute,
        repeats: true,
      } as any),
    });

    console.log(`Daily reminder scheduled at ${hour}:${minute}`);
  } catch (error) {
    console.error('Failed to schedule daily reminder:', error);
  }
}

/**
 * すべてのスケジュール済み通知をキャンセル
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('All notifications cancelled');
  } catch (error) {
    console.error('Failed to cancel notifications:', error);
  }
}

/**
 * テスト通知を送信
 */
export async function sendTestNotification(): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'テスト通知',
        body: '通知機能が正常に動作しています！',
        data: { type: 'test' },
      },
        trigger: ({ seconds: 1 } as any),
    });
  } catch (error) {
    console.error('Failed to send test notification:', error);
  }
}
