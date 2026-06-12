import { format, formatRelative, parseISO } from "date-fns"
import { formatInTimeZone, toZonedTime } from "date-fns-tz"
import { LOCALE_MAP, resolveSupportedLocale } from "./init"
import { localDateToIsoDate, localDateToIsoDateMidOfDay } from "./convert"
import { isoDateIsSameDay } from "./compare"
import type { IsoDate, LocalDate, LocalTime, RelativeTime, TimeFormat, TranslationFunction } from "../types"

/** @see https://date-fns.org/v3.6.0/docs/format */
const FORMAT_MAP: Record<TimeFormat, string> = {
  "10:30 AM": "p",
  "10:30": "HH:mm",
  "2024/12/31": "P",
  "2024/12/31, 10:30 AM": "PPp",
  "Mar 3, 2023": "PP",
  "Sat, Mar 3, 2023": "EEE, PP",
  "Saturday, Mar 3, 2023": "EEEE, PP",
  "Mar 3, 2023, 10:30 AM": "PP, p",
  "2024-12-31": "yyyy-MM-dd",
  "31": "d",
  Mar: "LLL",
  March: "LLLL",
  "2024": "yyyy",
  "March 3": "MMMM d",
  "March 2023": "MMMM yyyy",
  "Mar '23": "MMM yy",
  "Feb 2024": "MMM yyyy",
  "12 Feb": "dd, LLL",
  Mon: "EEE",
  Monday: "EEEE",
  Mo: "EEEEEE",
}

/** Formats a UTC ISO string into a human-readable string in the given timezone and locale. */
export function formatIsoDate(options: {
  isoDate: IsoDate
  timezone: string
  format: TimeFormat
  locale: string
}): string {
  const locale = LOCALE_MAP[resolveSupportedLocale(options.locale)]
  return formatInTimeZone(parseISO(options.isoDate), options.timezone, FORMAT_MAP[options.format], { locale })
}

/** Formats a `Date` object into a human-readable string in the given timezone and locale. */
export function formatDate(options: {
  date: Date
  timezone: string
  format: TimeFormat
  locale: string
}): string {
  return formatIsoDate({ ...options, isoDate: options.date.toISOString() })
}

/** Formats a local date (yyyy-MM-dd) into a human-readable string in the given timezone and locale. */
export function formatLocalDate(options: {
  localDate: LocalDate
  timezone: string
  format: TimeFormat
  locale: string
}): string {
  // Defensive guard: if someone accidentally passes an ISO instant, use it directly.
  const isoDate = options.localDate.includes("Z") || options.localDate.includes("+")
    ? options.localDate
    : localDateToIsoDateMidOfDay({ localDate: options.localDate, timezone: options.timezone })
  return formatIsoDate({ isoDate, format: options.format, timezone: options.timezone, locale: options.locale })
}

/**
 * Formats a local time (HH:mm) into a display string.
 * Uses a fixed reference date and timezone since only the time portion matters.
 */
export function formatLocalTime(options: {
  localTime: LocalTime
  format: Extract<TimeFormat, "10:30 AM">
  locale: string
}): string {
  const isoDate = localDateToIsoDate({
    localDate: "2000-01-01",
    localTime: options.localTime,
    timezone: "UTC",
  })
  return formatIsoDate({ isoDate, format: options.format, timezone: "UTC", locale: options.locale })
}

/**
 * Formats a start–end ISO date pair as a time range or date range string.
 *
 * - `"00:00 — 00:00"`: both times formatted as locale time, separated by "—"
 * - `"Tomorrow, Feb 16, 2024 | Monday, Feb 17, 2024 | Feb 17, 2024 — Feb 23, 2024"`:
 *   same day → single date; different days → "date — date"
 */
export function formatStartToEndTime(options: {
  startTime: IsoDate
  endTime: IsoDate
  timezone: string
  locale: string
  format?: "00:00 — 00:00" | "Tomorrow, Feb 16, 2024 | Monday, Feb 17, 2024 | Feb 17, 2024 — Feb 23, 2024"
}): string {
  const { startTime, endTime, timezone, locale, format: fmt } = options
  const localeObj = LOCALE_MAP[resolveSupportedLocale(locale)]

  if (!fmt || fmt === "00:00 — 00:00") {
    const s = formatIsoDate({ isoDate: startTime, timezone, format: "10:30 AM", locale })
    const e = formatIsoDate({ isoDate: endTime, timezone, format: "10:30 AM", locale })
    return `${s} — ${e}`
  }

  if (isoDateIsSameDay({ isoDate: startTime, isoDateToCompare: endTime, timezone })) {
    return formatInTimeZone(parseISO(startTime), timezone, "PP", { locale: localeObj })
  }

  const s = formatInTimeZone(parseISO(startTime), timezone, "PP", { locale: localeObj })
  const e = formatInTimeZone(parseISO(endTime), timezone, "PP", { locale: localeObj })
  return `${s} — ${e}`
}

/**
 * Returns the weekday label for the given 0-based index (0 = Monday)
 * using a consumer-provided translation function.
 */
export function formatWeekdayFromIndex(options: {
  /** 0 = Monday, 6 = Sunday */
  index: number
  format: "M" | "Mo" | "Mon" | "Monday"
  t: TranslationFunction
}): string {
  const { format: fmt, index, t } = options

  type Map = Record<number, string>

  if (fmt === "M") {
    const map: Map = {
      0: t("common.terms.mondaySingleLetter", { default: "M" }),
      1: t("common.terms.tuesdaySingleLetter", { default: "T" }),
      2: t("common.terms.wednesdaySingleLetter", { default: "W" }),
      3: t("common.terms.thursdaySingleLetter", { default: "T" }),
      4: t("common.terms.fridaySingleLetter", { default: "F" }),
      5: t("common.terms.saturdaySingleLetter", { default: "S" }),
      6: t("common.terms.sundaySingleLetter", { default: "S" }),
    }
    return map[index] ?? "?"
  }

  if (fmt === "Mo") {
    const map: Map = {
      0: t("common.terms.mondayTwoLetters", { default: "Mo" }),
      1: t("common.terms.tuesdayTwoLetters", { default: "Tu" }),
      2: t("common.terms.wednesdayTwoLetters", { default: "We" }),
      3: t("common.terms.thursdayTwoLetters", { default: "Th" }),
      4: t("common.terms.fridayTwoLetters", { default: "Fr" }),
      5: t("common.terms.saturdayTwoLetters", { default: "Sa" }),
      6: t("common.terms.sundayTwoLetters", { default: "Su" }),
    }
    return map[index] ?? "?"
  }

  if (fmt === "Mon") {
    const map: Map = {
      0: t("common.terms.mondayMedium", { default: "Mon" }),
      1: t("common.terms.tuesdayMedium", { default: "Tue" }),
      2: t("common.terms.wednesdayMedium", { default: "Wed" }),
      3: t("common.terms.thursdayMedium", { default: "Thu" }),
      4: t("common.terms.fridayMedium", { default: "Fri" }),
      5: t("common.terms.saturdayMedium", { default: "Sat" }),
      6: t("common.terms.sundayMedium", { default: "Sun" }),
    }
    return map[index] ?? "?"
  }

  const map: Map = {
    0: t("common.terms.monday", { default: "Monday" }),
    1: t("common.terms.tuesday", { default: "Tuesday" }),
    2: t("common.terms.wednesday", { default: "Wednesday" }),
    3: t("common.terms.thursday", { default: "Thursday" }),
    4: t("common.terms.friday", { default: "Friday" }),
    5: t("common.terms.saturday", { default: "Saturday" }),
    6: t("common.terms.sunday", { default: "Sunday" }),
  }
  return map[index] ?? "?"
}

/** Returns a formatted date for a relative time anchor ("now", "yesterday", "tomorrow", etc.). */
export function formatRelativeTime(options: {
  relativeTime: RelativeTime
  format: TimeFormat
  locale: string
  timezone: string
}): string {
  const MS_PER_DAY = 24 * 60 * 60 * 1000
  let date: Date
  switch (options.relativeTime) {
    case "now":       date = new Date(); break
    case "yesterday": date = new Date(Date.now() - MS_PER_DAY); break
    case "tomorrow":  date = new Date(Date.now() + MS_PER_DAY); break
    case "nextWeek":  date = new Date(Date.now() + 7 * MS_PER_DAY); break
    case "lastWeek":  date = new Date(Date.now() - 7 * MS_PER_DAY); break
  }
  return formatIsoDate({ isoDate: date.toISOString(), format: options.format, timezone: options.timezone, locale: options.locale })
}

/**
 * Formats an ISO date intelligently relative to now using locale-aware labels.
 * Returns strings like "today at 3:00 PM", "tomorrow at 11:00 AM", "Sunday at 2:30 PM",
 * or a full date for anything further away — all driven by the locale, no custom
 * translation keys required.
 *
 * Powered by date-fns `formatRelative`.
 */
export function formatIsoTimeIntelligently(options: {
  isoDate: IsoDate
  timezone: string
  locale: string
}): string {
  const localeObj = LOCALE_MAP[resolveSupportedLocale(options.locale)]
  // Shift both dates into the target timezone so formatRelative compares
  // calendar days correctly rather than UTC days.
  const date = toZonedTime(parseISO(options.isoDate), options.timezone)
  const now  = toZonedTime(new Date(), options.timezone)
  return formatRelative(date, now, { locale: localeObj })
}
