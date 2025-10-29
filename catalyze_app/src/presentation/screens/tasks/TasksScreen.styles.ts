/**
 * TasksScreen関連のスタイル定義
 */

import { StyleSheet } from 'react-native';
import { spacing, textStyles, colors as defaultColors } from '../../theme';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: defaultColors.background,
    paddingVertical: spacing.lg,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: defaultColors.background,
  },
  header: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    backgroundColor: defaultColors.card,
    borderBottomWidth: 1,
    borderBottomColor: defaultColors.border,
  },
  dateText: {
    ...textStyles.body,
    color: defaultColors.textSecondary,
    marginTop: spacing.xs,
  },
  summaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: defaultColors.card,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginVertical: spacing.xs,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  summaryTextContainer: {
    alignItems: 'center',
  },
  summaryValue: {
    ...textStyles.h2,
    color: defaultColors.primary,
  },
  summaryLabel: {
    ...textStyles.caption,
    color: defaultColors.textSecondary,
  },
  dateHeader: {
    ...textStyles.h4,
    color: defaultColors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  tasksSection: {
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  listContent: {
    paddingBottom: spacing.xl * 2,
  },
  dateGroup: {
    marginBottom: spacing.lg,
  },
  sessionCard: {
    backgroundColor: defaultColors.card,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: defaultColors.border,
    marginBottom: spacing.sm,
    marginHorizontal: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  planTitle: {
    ...textStyles.h4,
    color: defaultColors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  menuButton: {
    padding: spacing.xs,
  },
  sessionTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sessionTimeText: {
    ...textStyles.caption,
    color: defaultColors.textSecondary,
  },
  performanceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  performanceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  performanceText: {
    ...textStyles.caption,
    color: defaultColors.textSecondary,
    fontWeight: '600',
  },
  sessionContent: {
    gap: spacing.sm,
  },
  sessionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sessionStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sessionStatText: {
    ...textStyles.caption,
    color: defaultColors.text,
    fontWeight: '500',
  },
  sessionQuality: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sessionQualityLabel: {
    ...textStyles.caption,
    color: defaultColors.textSecondary,
    minWidth: 50,
  },
  concentrationBar: {
    flex: 1,
    height: 6,
    backgroundColor: defaultColors.background,
    borderRadius: 3,
    overflow: 'hidden',
  },
  concentrationFill: {
    height: '100%',
    backgroundColor: defaultColors.primary,
    borderRadius: 3,
  },
  concentrationText: {
    ...textStyles.caption,
    color: defaultColors.textSecondary,
    fontWeight: '600',
    minWidth: 35,
    textAlign: 'right',
  },
  // メニューModal
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  menuModal: {
    backgroundColor: defaultColors.card,
    borderRadius: 12,
    padding: spacing.sm,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  menuItemText: {
    ...textStyles.body,
    color: defaultColors.text,
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    backgroundColor: defaultColors.border,
    marginHorizontal: spacing.sm,
  },
  // Split view for tablet
  splitContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: defaultColors.background,
  },
  leftPaneCalendar: {
    width: '36%',
    borderRightWidth: 1,
    borderRightColor: defaultColors.border,
    backgroundColor: defaultColors.card,
  },
  rightPaneTasks: {
    flex: 1,
    backgroundColor: defaultColors.background,
  },
  calendarContainer: {
    padding: spacing.md,
  },
});
