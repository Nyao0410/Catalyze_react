/**
 * StudyNext - Theme System
 * アプリ全体のテーマをエクスポート
 */

import { colors as colorsImport } from './colors';
import { typography as typographyImport, textStyles as textStylesImport } from './typography';
import { spacing as spacingImport } from './spacing';

export { colors, type ColorKey } from './colors';
export { typography, textStyles } from './typography';
export { spacing, type SpacingKey } from './spacing';

// テーマ全体のオブジェクト
export const theme = {
  colors: colorsImport,
  typography: typographyImport,
  textStyles: textStylesImport,
  spacing: spacingImport,
} as const;

export type Theme = typeof theme;
