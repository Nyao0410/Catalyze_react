/**
 * Catalyze AI - Color System
 * アプリ全体で使用する色の定義
 */

export const colors = {
  // Primary Colors
  primary: '#2563EB', // Blue (base)
  primaryDark: '#1D4ED8',
  primaryLight: '#60A5FA',

  // Secondary Colors
  secondary: '#06B6D4', // Cyan/teal as complementary blue
  secondaryDark: '#0E7490',
  secondaryLight: '#7DD3FC',

  // Accent Colors
  accent: '#0EA5E9', // Sky / accent blue
  accentDark: '#0284C7',
  accentLight: '#7DD3FC',

  // Status Colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#2563EB',

  // Neutral Colors
  text: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  textInverse: '#FFFFFF',
  white: '#FFFFFF',
  black: '#000000',

  // Background Colors
  background: '#F8FAFF', // very light blue background
  backgroundSecondary: '#EEF2FF',
  backgroundTertiary: '#EEF6FF',

  // Border Colors
  border: '#E6EEF8',
  borderDark: '#CBD5E1',

  // Card & Surface
  card: '#FFFFFF',
  cardShadow: 'rgba(37, 99, 235, 0.08)',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',

  // Difficulty Colors
  difficultyEasy: '#60A5FA',
  difficultyNormal: '#2563EB',
  difficultyHard: '#1E40AF',
  difficultyVeryHard: '#EF4444',

  // Progress Colors
  progressTrack: '#E6EEF8',
  progressFill: '#2563EB',

  // Chart Colors
  chart1: '#2563EB',
  chart2: '#06B6D4',
  chart3: '#0EA5E9',
  chart4: '#60A5FA',
  chart5: '#93C5FD',
} as const;

// Keep the existing `colors` export for backward compatibility (light theme).
export type ColorKey = keyof typeof colors;

// Dark theme counterpart. Keys intentionally match `colors` so `ColorKey` remains valid.
export const darkColors = {
  // Primary Colors
  primary: '#60A5FA', // lighter blue for emphasis on dark BG
  primaryDark: '#93C5FD',
  primaryLight: '#93C5FD',

  // Secondary Colors
  secondary: '#06B6D4',
  secondaryDark: '#0E7490',
  secondaryLight: '#7DD3FC',

  // Accent Colors
  accent: '#38BDF8',
  accentDark: '#0EA5E9',
  accentLight: '#60A5FA',

  // Status Colors
  success: '#34D399',
  warning: '#F59E0B',
  error: '#F87171',
  info: '#93C5FD',

  // Neutral Colors
  text: '#E6EEF8',
  textSecondary: '#CBD5E1',
  textTertiary: '#94A3B8',
  textInverse: '#0F172A',
  white: '#0F172A',
  black: '#000000',

  // Background Colors
  background: '#0B1220',
  backgroundSecondary: '#071126',
  backgroundTertiary: '#061025',

  // Border Colors
  border: '#142032',
  borderDark: '#0B1220',

  // Card & Surface
  card: '#0F172A',
  cardShadow: 'rgba(0, 0, 0, 0.6)',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.6)',

  // Difficulty Colors
  difficultyEasy: '#60A5FA',
  difficultyNormal: '#93C5FD',
  difficultyHard: '#2563EB',
  difficultyVeryHard: '#FB7185',

  // Progress Colors
  progressTrack: '#0B1220',
  progressFill: '#60A5FA',

  // Chart Colors
  chart1: '#60A5FA',
  chart2: '#06B6D4',
  chart3: '#38BDF8',
  chart4: '#2563EB',
  chart5: '#93C5FD',
} as const;

/**
 * Get a color palette by theme.
 *
 * Usage example:
 * import { useColorScheme } from 'react-native';
 * import { getColors } from './theme/colors';
 *
 * const scheme = useColorScheme();
 * const themeColors = getColors(scheme === 'dark' ? 'dark' : 'light');
 */
export function getColors(theme: 'light' | 'dark' = 'light') {
  return theme === 'dark' ? darkColors : colors;
}
