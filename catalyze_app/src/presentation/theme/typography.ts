/**
 * StudyNext - Typography System
 * テキストスタイルの定義
 */

export const typography = {
  // Font Sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },

  // Font Weights
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  // Line Heights
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

// Text Style Presets
export const textStyles = {
  h1: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    // lineHeight should be pixel value; multiply by font size
    lineHeight: Math.round(typography.fontSize['3xl'] * typography.lineHeight.tight),
  },
  h2: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    lineHeight: Math.round(typography.fontSize['2xl'] * typography.lineHeight.tight),
  },
  h3: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: Math.round(typography.fontSize.xl * typography.lineHeight.tight),
  },
  h4: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: Math.round(typography.fontSize.lg * typography.lineHeight.normal),
  },
  body: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.regular,
    lineHeight: Math.round(typography.fontSize.base * typography.lineHeight.normal),
  },
  bodySmall: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
    lineHeight: Math.round(typography.fontSize.sm * typography.lineHeight.normal),
  },
  caption: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.regular,
    lineHeight: Math.round(typography.fontSize.xs * typography.lineHeight.normal),
  },
  button: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: Math.round(typography.fontSize.base * typography.lineHeight.normal),
  },
} as const;
