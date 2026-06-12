import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from "date-fns"
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz"
import { addToLocalDate } from "./arithmetic"
import { formatIsoDate } from "./format"
import { localDateNow } from "./convert"
import type { IsoDate, LocalDate, LocalDateMonth, LocalDateWeek, LocalMonthYear } from "../types"

/**
 * Builds the 7-day week containing the given local date.
 * @param weekStartsOn 0 = Sunday, 1 = Monday (ISO, default)
 */
export function buildWeekAroundLocalDate(options: {
  localDate: LocalDate
  timezone: string
  weekStartsOn?: 0 | 1
}): LocalDateWeek {
  const { localDate, timezone, weekStartsOn = 1 } = options
  const anchor = fromZonedTime(localDate, timezone)
  // getDay() returns 0=Sunday…6=Saturday; adjust to chosen week start
  const rawDay = anchor.getDay() // 0=Sun
  const adjustedDay = weekStartsOn === 1
    ? (rawDay === 0 ? 6 : rawDay - 1) // Mon=0…Sun=6
    : rawDay                            // Sun=0…Sat=6
  const week: LocalDateWeek = []
  for (let i = 0; i < 7; i++) {
    week.push(formatInTimeZone(addDays(anchor, i - adjustedDay), timezone, "yyyy-MM-dd"))
  }
  return week
}

/**
 * Builds a calendar month view around the given local date.
 * `extended` includes leading/trailing days to complete the first and last weeks.
 * `thisMonth` contains only the days belonging to the same calendar month.
 */
export function buildMonthAroundLocalDate(options: {
  localDate: LocalDate
  timezone: string
  weekStartsOn?: 0 | 1
}): { extended: LocalDateMonth; thisMonth: LocalDateMonth } {
  const { localDate, timezone, weekStartsOn = 1 } = options
  const localMonth = localDateToLocalMonth({ localDate })

  const firstOfMonthIso = fromZonedTime(`${localMonth}-01T12:00:00`, timezone).toISOString()
  const lastOfMonthIso = fromZonedTime(
    endOfMonth(toZonedTime(new Date(firstOfMonthIso), timezone)),
    timezone,
  ).toISOString()

  const firstOfMonthLocal = formatIsoDate({ format: "2024-12-31", isoDate: firstOfMonthIso, timezone, locale: "en" })
  const lastOfMonthLocal = formatIsoDate({ format: "2024-12-31", isoDate: lastOfMonthIso, timezone, locale: "en" })

  const firstWeek = buildWeekAroundLocalDate({ localDate: firstOfMonthLocal, timezone, weekStartsOn })
  const lastWeek = buildWeekAroundLocalDate({ localDate: lastOfMonthLocal, timezone, weekStartsOn })

  const start = firstWeek[0]!
  const end = lastWeek[6]!

  const extended: LocalDateMonth = []
  const thisMonth: LocalDateMonth = []
  let cursor = start
  let guard = 0

  while (guard < 60 && cursor <= end) {
    if (cursor.startsWith(localMonth)) thisMonth.push(cursor)
    extended.push(cursor)
    cursor = addToLocalDate({ localDate: cursor, amount: 1, unit: "d", timezone })
    guard++
  }

  return { extended, thisMonth }
}

/**
 * Returns the 12 mid-month sentinel dates (15th) for each month of the year
 * that contains the given local date. Useful for month-level navigation.
 */
export function buildLocalMonthYearAroundLocalDate(options: {
  localDate: LocalDate
  timezone: string
}): LocalMonthYear {
  const [year] = options.localDate.split("-")
  return Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}-15`)
}

/** Extracts the yyyy-MM month prefix from a local date. */
export function localDateToLocalMonth(options: { localDate: LocalDate }): string {
  return options.localDate.substring(0, 7)
}

/**
 * Returns the first day of the week containing `localDate` (defaults to today).
 * @param weekStartsOn 0 = Sunday, 1 = Monday (ISO, default)
 */
export function startOfLocalDateWeek(options: {
  timezone: string
  localDate?: LocalDate
  weekStartsOn?: 0 | 1
}): LocalDate {
  const localDate = options.localDate ?? localDateNow({ timezone: options.timezone })
  return buildWeekAroundLocalDate({ localDate, timezone: options.timezone, weekStartsOn: options.weekStartsOn })[0]!
}

/**
 * Returns the last day of the week containing `localDate` (defaults to today).
 * @param weekStartsOn 0 = Sunday, 1 = Monday (ISO, default)
 */
export function endOfLocalDateWeek(options: {
  timezone: string
  localDate?: LocalDate
  weekStartsOn?: 0 | 1
}): LocalDate {
  const localDate = options.localDate ?? localDateNow({ timezone: options.timezone })
  return buildWeekAroundLocalDate({ localDate, timezone: options.timezone, weekStartsOn: options.weekStartsOn })[6]!
}

/** Returns the first day of the month containing `localDate` (defaults to today). */
export function startOfLocalDateMonth(options: {
  timezone: string
  localDate?: LocalDate
}): LocalDate {
  const localDate = options.localDate ?? localDateNow({ timezone: options.timezone })
  return `${localDateToLocalMonth({ localDate })}-01`
}

/** Returns the last day of the month containing `localDate` (defaults to today). */
export function endOfLocalDateMonth(options: {
  timezone: string
  localDate?: LocalDate
}): LocalDate {
  const localDate = options.localDate ?? localDateNow({ timezone: options.timezone })
  const month = localDateToLocalMonth({ localDate })
  const firstInTz = toZonedTime(fromZonedTime(`${month}-01T12:00:00`, options.timezone), options.timezone)
  return format(endOfMonth(firstInTz), "yyyy-MM-dd")
}

// ─── Timezone-aware ISO accessors for adjacent month/week boundaries ─────────

export function getStartOfNextMonthIso(options: { timezone: string }): IsoDate {
  const nowInTz = toZonedTime(new Date(), options.timezone)
  return fromZonedTime(startOfMonth(addDays(endOfMonth(nowInTz), 1)), options.timezone).toISOString()
}

export function getStartOfLastMonthIso(options: { timezone: string }): IsoDate {
  const nowInTz = toZonedTime(new Date(), options.timezone)
  return fromZonedTime(startOfMonth(subMonths(nowInTz, 1)), options.timezone).toISOString()
}

export function getEndOfLastMonthIso(options: { timezone: string }): IsoDate {
  const nowInTz = toZonedTime(new Date(), options.timezone)
  return fromZonedTime(endOfMonth(subMonths(nowInTz, 1)), options.timezone).toISOString()
}

export function getStartOfLastMonthLocalDate(options: { timezone: string }): LocalDate {
  return format(startOfMonth(subMonths(toZonedTime(new Date(), options.timezone), 1)), "yyyy-MM-dd")
}

export function getEndOfLastMonthLocalDate(options: { timezone: string }): LocalDate {
  return format(endOfMonth(subMonths(toZonedTime(new Date(), options.timezone), 1)), "yyyy-MM-dd")
}

export function getStartOfLastWeekLocalDate(options: { timezone: string }): LocalDate {
  return format(startOfWeek(subWeeks(toZonedTime(new Date(), options.timezone), 1), { weekStartsOn: 1 }), "yyyy-MM-dd")
}

export function getEndOfLastWeekLocalDate(options: { timezone: string }): LocalDate {
  return format(endOfWeek(subWeeks(toZonedTime(new Date(), options.timezone), 1), { weekStartsOn: 1 }), "yyyy-MM-dd")
}
