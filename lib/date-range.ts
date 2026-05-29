import { getDateKey } from "@/lib/usage";

export type HoroscopeRange = "day" | "week" | "month" | "3m" | "6m" | "12m";

const RANGE_ORDER: HoroscopeRange[] = ["day", "week", "month", "3m", "6m", "12m"];

export function getHoroscopeRanges(): HoroscopeRange[] {
  return [...RANGE_ORDER];
}

function toLocalDate(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getMonday(d: Date): Date {
  const date = toLocalDate(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
}

function getMonthStart(d: Date): Date {
  const date = toLocalDate(d);
  date.setDate(1);
  return date;
}

function addMonths(d: Date, months: number): Date {
  const out = new Date(d);
  out.setMonth(out.getMonth() + months);
  return out;
}

/** Date string (YYYY-MM-DD) to pass to the horoscope API for the given range. */
export function getRangeApiDate(range: HoroscopeRange, now = new Date()): string {
  const d = toLocalDate(now);
  switch (range) {
    case "day":
      return getDateKey(d);
    case "week": {
      const monday = getMonday(d);
      return getDateKey(monday);
    }
    case "month":
      return getDateKey(getMonthStart(d));
    case "3m": {
      const start = getMonthStart(addMonths(d, -2));
      return getDateKey(start);
    }
    case "6m": {
      const start = getMonthStart(addMonths(d, -5));
      return getDateKey(start);
    }
    case "12m": {
      const start = getMonthStart(addMonths(d, -11));
      return getDateKey(start);
    }
    default:
      return getDateKey(d);
  }
}

/** Cache key for the given range (includes range suffix so day vs week don't collide). */
export function getRangeCacheKey(range: HoroscopeRange, now = new Date()): string {
  const apiDate = getRangeApiDate(range, now);
  if (range === "day") {
    return apiDate;
  }
  return `${apiDate}-${range}`;
}

const RANGE_LABELS_EN: Record<HoroscopeRange, string> = {
  day: "Today",
  week: "This week",
  month: "This month",
  "3m": "Next 3 months",
  "6m": "Next 6 months",
  "12m": "This year",
};

const RANGE_LABELS_ES: Record<HoroscopeRange, string> = {
  day: "Hoy",
  week: "Esta semana",
  month: "Este mes",
  "3m": "Próximos 3 meses",
  "6m": "Próximos 6 meses",
  "12m": "Este año",
};

export function getRangeLabel(range: HoroscopeRange, language: "en" | "es"): string {
  return language === "es" ? RANGE_LABELS_ES[range] : RANGE_LABELS_EN[range];
}

export function isValidHoroscopeRange(value: unknown): value is HoroscopeRange {
  return typeof value === "string" && RANGE_ORDER.includes(value as HoroscopeRange);
}
