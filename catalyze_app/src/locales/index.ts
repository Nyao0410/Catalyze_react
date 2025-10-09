/**
 * Catalyze AI - i18n Configuration
 * 国際化設定
 */

import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import ja from './ja';
import en from './en';

// i18nインスタンスを作成
const i18n = new I18n({
  ja,
  en,
});

// デバイスのロケールを設定（言語コードのみ抽出）
const locales = Localization.getLocales();
const deviceLocale = locales[0]?.languageCode || 'ja';
i18n.locale = deviceLocale;

// フォールバックロケールを設定
i18n.enableFallback = true;
i18n.defaultLocale = 'ja';

// 翻訳関数をエクスポート
export const t = (key: string, options?: any) => i18n.t(key, options);

// ロケール変更関数
export const changeLocale = (locale: string) => {
  i18n.locale = locale;
};

// 現在のロケール取得
export const getCurrentLocale = () => i18n.locale;

export default i18n;
