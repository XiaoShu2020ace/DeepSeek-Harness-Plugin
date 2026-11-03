import { HolidayUtil, Lunar, Solar } from 'lunar-typescript';

const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
const DAY_MS = 24 * 60 * 60 * 1000;

type SolarDate = ReturnType<typeof Solar.fromDate>;
type LunarDate = ReturnType<SolarDate['getLunar']>;
type HolidayRecord = NonNullable<ReturnType<typeof HolidayUtil.getHoliday>>;

export interface HolidayCountdown {
  name: string;
  days: number;
}

export interface ClockCalendarInfo {
  dateKey: string;
  lunarDate: string;
  weekday: string;
  ganzhi: string;
  solarTerm: string | null;
  festivals: string[];
  highlightedEvent: string | null;
  highlightedEmoji: string;
  eventLines: string[];
  holidayStatus: string;
  nextHoliday: HolidayCountdown;
}

interface DayStatus {
  label: string;
  holidayName?: string;
}

interface HolidayRange {
  name: string;
  start: string;
  end: string;
  statutoryDates: readonly string[];
}

interface YearSchedule {
  holidays: readonly HolidayRange[];
  adjustedWorkdays: readonly string[];
}

// 国务院办公厅公布的 2026 年放假调休安排。
const SCHEDULES: Record<number, YearSchedule> = {
  2026: {
    holidays: [
      { name: '元旦', start: '2026-01-01', end: '2026-01-03', statutoryDates: ['2026-01-01'] },
      { name: '春节', start: '2026-02-15', end: '2026-02-23', statutoryDates: ['2026-02-16', '2026-02-17', '2026-02-18', '2026-02-19'] },
      { name: '清明节', start: '2026-04-04', end: '2026-04-06', statutoryDates: ['2026-04-05'] },
      { name: '劳动节', start: '2026-05-01', end: '2026-05-05', statutoryDates: ['2026-05-01', '2026-05-02'] },
      { name: '端午节', start: '2026-06-19', end: '2026-06-21', statutoryDates: ['2026-06-19'] },
      { name: '中秋节', start: '2026-09-25', end: '2026-09-27', statutoryDates: ['2026-09-25'] },
      { name: '国庆节', start: '2026-10-01', end: '2026-10-07', statutoryDates: ['2026-10-01', '2026-10-02', '2026-10-03'] },
    ],
    adjustedWorkdays: [
      '2026-01-04',
      '2026-02-14',
      '2026-02-28',
      '2026-05-09',
      '2026-09-20',
      '2026-10-10',
    ],
  },
};

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

export function getDateKey(date: Date): string {
  return date.getFullYear() + '-' + pad2(date.getMonth() + 1) + '-' + pad2(date.getDate());
}

function keyFromParts(year: number, month: number, day: number): string {
  return year + '-' + pad2(month) + '-' + pad2(day);
}

function parseDateKey(key: string): { year: number; month: number; day: number } {
  const parts = key.split('-').map(Number);
  return { year: parts[0], month: parts[1], day: parts[2] };
}

function getFestivalEmoji(name: string, isSolarTerm = false): string {
  if (isSolarTerm) {
    return ['霜降', '寒露', '白露', '秋分', '立秋', '立冬'].includes(name) ? '🍁' : '🌱';
  }
  if (name.includes('中秋')) return '🎑';
  if (name.includes('春节') || name.includes('除夕')) return '🧧';
  if (name.includes('端午')) return '🐉';
  if (name.includes('清明')) return '🌿';
  if (name.includes('劳动')) return '✨';
  if (name.includes('元旦') || name.includes('国庆')) return '🎉';
  return '🎊';
}

function getLibraryHoliday(year: number, month: number, day: number): HolidayRecord | null {
  try {
    return HolidayUtil.getHoliday(year, month, day) ?? null;
  } catch {
    return null;
  }
}

function getStatutoryFestivalName(dateKey: string, lunar: LunarDate): string | undefined {
  const parts = parseDateKey(dateKey);
  if (parts.month === 1 && parts.day === 1) return '元旦';
  if (parts.month === 5 && (parts.day === 1 || parts.day === 2)) return '劳动节';
  if (parts.month === 10 && parts.day >= 1 && parts.day <= 3) return '国庆节';

  if (lunar.getMonth() === 1 && lunar.getDay() >= 1 && lunar.getDay() <= 3) return '春节';
  if (lunar.getMonth() === 5 && lunar.getDay() === 5) return '端午节';
  if (lunar.getMonth() === 8 && lunar.getDay() === 15) return '中秋节';
  if (lunar.getJieQi() === '清明') return '清明节';

  // 2025 年起，春节法定假日还包括除夕。
  if (lunar.getMonth() === 12) {
    const nextDate = new Date(parts.year, parts.month - 1, parts.day + 1, 12);
    const nextLunar = Lunar.fromDate(nextDate);
    if (nextLunar.getMonth() === 1 && nextLunar.getDay() === 1) return '春节';
  }
  return undefined;
}

function getDayStatus(date: Date, solar: SolarDate, lunar: LunarDate): DayStatus {
  const key = getDateKey(date);
  const year = date.getFullYear();
  const schedule = SCHEDULES[year];

  if (schedule) {
    if (schedule.adjustedWorkdays.includes(key)) return { label: '调休工作日' };
    const range = schedule.holidays.find((item) => key >= item.start && key <= item.end);
    if (range) {
      return {
        label: range.statutoryDates.includes(key) ? '法定节假日' : '调休放假',
        holidayName: range.name,
      };
    }
    return { label: solar.getWeek() === 0 || solar.getWeek() === 6 ? '周末' : '工作日' };
  }

  const libraryHoliday = getLibraryHoliday(year, date.getMonth() + 1, date.getDate());
  if (libraryHoliday) {
    if (libraryHoliday.isWork()) return { label: '调休工作日' };
    return {
      label: libraryHoliday.getTarget() === key ? '法定节假日' : '调休放假',
      holidayName: libraryHoliday.getName(),
    };
  }

  const statutoryName = getStatutoryFestivalName(key, lunar);
  if (statutoryName) return { label: '法定节假日', holidayName: statutoryName };

  const isWeekend = solar.getWeek() === 0 || solar.getWeek() === 6;
  if (year > 2026) {
    return {
      label: isWeekend ? '周末（年度调休未收录）' : '工作日（年度调休未收录）',
    };
  }
  return { label: isWeekend ? '周末' : '工作日' };
}

function solarDateKey(solar: ReturnType<typeof Solar.fromYmd>): string {
  return keyFromParts(solar.getYear(), solar.getMonth(), solar.getDay());
}

function getQingmingDateKey(year: number): string {
  for (const day of [4, 5, 6]) {
    const lunar = Solar.fromYmd(year, 4, day).getLunar();
    if (lunar.getJieQi() === '清明') return keyFromParts(year, 4, day);
  }
  return keyFromParts(year, 4, 5);
}

function getMajorHolidayDates(year: number): Array<{ name: string; dateKey: string }> {
  return [
    { name: '元旦', dateKey: keyFromParts(year, 1, 1) },
    { name: '春节', dateKey: solarDateKey(Lunar.fromYmd(year, 1, 1).getSolar()) },
    { name: '清明', dateKey: getQingmingDateKey(year) },
    { name: '劳动节', dateKey: keyFromParts(year, 5, 1) },
    { name: '端午节', dateKey: solarDateKey(Lunar.fromYmd(year, 5, 5).getSolar()) },
    { name: '中秋节', dateKey: solarDateKey(Lunar.fromYmd(year, 8, 15).getSolar()) },
    { name: '国庆节', dateKey: keyFromParts(year, 10, 1) },
  ];
}

function daysBetween(fromKey: string, toKey: string): number {
  const from = parseDateKey(fromKey);
  const to = parseDateKey(toKey);
  const fromUtc = Date.UTC(from.year, from.month - 1, from.day);
  const toUtc = Date.UTC(to.year, to.month - 1, to.day);
  return Math.round((toUtc - fromUtc) / DAY_MS);
}

function getNextMajorHoliday(todayKey: string, currentYear: number): HolidayCountdown {
  const candidates = [currentYear, currentYear + 1]
    .flatMap((year) => getMajorHolidayDates(year))
    .filter((holiday) => holiday.dateKey > todayKey)
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  const next = candidates[0];
  if (!next) return { name: '元旦', days: 0 };
  return { name: next.name, days: daysBetween(todayKey, next.dateKey) };
}

export function formatClockDateTime(date: Date): string {
  const solar = Solar.fromDate(date);
  return solar.getYear() + '年' + solar.getMonth() + '月' + solar.getDay() + '日 '
    + pad2(date.getHours()) + ':' + pad2(date.getMinutes()) + ':' + pad2(date.getSeconds());
}

export function getClockCalendarInfo(date: Date): ClockCalendarInfo {
  const solar = Solar.fromDate(date);
  const lunar = solar.getLunar();
  const dateKey = getDateKey(date);
  const solarTerm = lunar.getJieQi() || null;
  const festivals = [...new Set([...solar.getFestivals(), ...lunar.getFestivals()])];
  const status = getDayStatus(date, solar, lunar);
  const firstFestival = festivals[0] ?? status.holidayName ?? null;
  const highlightedEvent = solarTerm ? '今日' + solarTerm : firstFestival;
  const highlightedEmoji = solarTerm
    ? getFestivalEmoji(solarTerm, true)
    : firstFestival
      ? getFestivalEmoji(firstFestival)
      : '';
  const eventLines: string[] = [];

  if (solarTerm) eventLines.push('🍁 今日节气：' + solarTerm);
  if (festivals.length > 0) eventLines.push('🎑 节日：' + festivals.join('、'));
  if (festivals.length === 0 && !solarTerm && status.holidayName) {
    eventLines.push('🎉 假期：' + status.holidayName);
  }

  return {
    dateKey,
    lunarDate: lunar.getMonthInChinese() + '月' + lunar.getDayInChinese(),
    weekday: WEEKDAYS[solar.getWeek()],
    ganzhi: lunar.getYearInGanZhi() + '年 ' + lunar.getMonthInGanZhi() + '月 ' + lunar.getDayInGanZhi() + '日',
    solarTerm,
    festivals,
    highlightedEvent,
    highlightedEmoji,
    eventLines,
    holidayStatus: status.label,
    nextHoliday: getNextMajorHoliday(dateKey, date.getFullYear()),
  };
}
