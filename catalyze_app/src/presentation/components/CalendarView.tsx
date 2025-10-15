import React from 'react';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { colors as defaultColors } from '../theme';
import { useTheme } from '../theme/ThemeProvider';
import { buildMarkedDates } from './calendar-utils';

// 日本語化設定（ファイル単位で一度だけ設定される想定）
LocaleConfig.locales['ja'] = {
  monthNames: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],
  monthNamesShort: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],
  dayNames: ['日曜日','月曜日','火曜日','水曜日','木曜日','金曜日','土曜日'],
  dayNamesShort: ['日','月','火','水','木','金','土'],
  today: '今日'
};
LocaleConfig.defaultLocale = 'ja';

type Props = {
  selectedDate: Date;
  onDayPress: (day: { dateString: string }) => void;
  markedDates: { [key: string]: any };
};

export const CalendarView: React.FC<Props> = ({ selectedDate, onDayPress, markedDates }) => {
  const selectedKey = format(selectedDate, 'yyyy-MM-dd');
  const { colors } = useTheme();

  // build marked dates with debug logs
  const dates = buildMarkedDates(Object.keys(markedDates).length ? Object.keys(markedDates).map(k => ({ date: new Date(k), ...markedDates[k] })) : [], new Date(selectedKey));

  return (
    <Calendar
      current={format(new Date(), 'yyyy-MM-dd')}
      markedDates={dates}
      onDayPress={onDayPress}
      theme={{
        backgroundColor: colors.white,
        calendarBackground: colors.white,
        textSectionTitleColor: colors.text,
        selectedDayBackgroundColor: colors.primary,
        selectedDayTextColor: colors.white,
        todayTextColor: colors.primary,
        dayTextColor: colors.text,
        textDisabledColor: colors.textSecondary,
        dotColor: colors.primary,
        selectedDotColor: colors.white,
        arrowColor: colors.primary,
        monthTextColor: colors.text,
        indicatorColor: colors.primary,
        textDayFontFamily: 'System',
        textMonthFontFamily: 'System',
        textDayHeaderFontFamily: 'System',
        textDayFontSize: 16,
        textMonthFontSize: 18,
        textDayHeaderFontSize: 14,
      }}
    />
  );
};

export default CalendarView;
