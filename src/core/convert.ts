import { endOfDay, format, isValid, parseISO, startOfDay } from "date-fns"
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz"
import type { IsoDate, LocalDate, LocalTime } from "../types"

/** Converts a `Date` object to a local date string (yyyy-MM-dd) in the given timezone. */
export function dateToLocalDate(options: {
  date: Date
  timezone: string
}): LocalDate {
  return formatInTimeZone(options.date, options.timezone, "yyyy-MM-dd")
}

/**
 * Returns the local date for yesterday in the given timezone.
 * Yesterday is computed as 24 hours before the current moment — DST-safe for day-level precision.
 */
export function localDateYesterday(options: { timezone: string }): LocalDate {
  return formatInTimeZone(new Date(Date.now() - 24 * 60 * 60 * 1000), options.timezone, "yyyy-MM-dd")
}

/**
 * Returns the JS day-of-week index (0 = Sunday … 6 = Saturday) for a UTC ISO string
 * interpreted in the given timezone.
 */
export function isoDateToDayOfWeek(options: { isoDate: IsoDate; timezone: string }): number {
  return toZonedTime(parseISO(options.isoDate), options.timezone).getDay()
}

/** Returns the JS day-of-week index (0 = Sunday … 6 = Saturday) for a `Date` in the given timezone. */
export function dateToDayOfWeek(options: { date: Date; timezone: string }): number {
  return toZonedTime(options.date, options.timezone).getDay()
}

/** Returns the JS day-of-week index (0 = Sunday … 6 = Saturday) for a local date in the given timezone. */
export function localDateToDayOfWeek(options: { localDate: LocalDate; timezone: string }): number {
  return toZonedTime(fromZonedTime(`${options.localDate}T12:00:00`, options.timezone), options.timezone).getDay()
}

/** Converts a local date to a UTC ISO string at the start of that day (00:00:00) in the given timezone. */
export function localDateToIsoDateStartOfDay(options: {
  localDate: LocalDate
  timezone: string
}): IsoDate {
  const date = new Date(`${options.localDate}T00:00:00`)
  return fromZonedTime(startOfDay(date), options.timezone).toISOString()
}

/** Converts a local date to a UTC ISO string at the end of that day (23:59:59.999) in the given timezone. */
export function localDateToIsoDateEndOfDay(options: {
  localDate: LocalDate
  timezone: string
}): IsoDate {
  const date = new Date(`${options.localDate}T00:00:00`)
  return fromZonedTime(endOfDay(date), options.timezone).toISOString()
}

/**
 * Converts a local date to a UTC ISO string at noon (12:00:00) in the given timezone.
 * Safe anchor for day-level operations that avoids DST edge cases.
 */
export function localDateToIsoDateMidOfDay(options: {
  localDate: LocalDate
  timezone: string
}): IsoDate {
  return fromZonedTime(`${options.localDate}T12:00:00`, options.timezone).toISOString()
}

/** Converts a local date + local time to a UTC ISO string in the given timezone. */
export function localDateToIsoDate(options: {
  localDate: LocalDate
  localTime: LocalTime
  timezone: string
}): IsoDate {
  return fromZonedTime(`${options.localDate}T${options.localTime}:00`, options.timezone).toISOString()
}

/** Converts a UTC ISO string to a local date (yyyy-MM-dd) in the given timezone. */
export function isoDateToLocalDate(options: {
  isoDate: IsoDate
  timezone: string
}): LocalDate {
  return formatInTimeZone(parseISO(options.isoDate), options.timezone, "yyyy-MM-dd")
}

/** Splits a UTC ISO string into local date and local time parts in the given timezone. */
export function isoDateToLocalUnits(options: {
  isoDate: IsoDate
  timezone: string
}): { localDate: LocalDate; localTime: LocalTime } {
  const date = parseISO(options.isoDate)
  return {
    localDate: formatInTimeZone(date, options.timezone, "yyyy-MM-dd"),
    localTime: formatInTimeZone(date, options.timezone, "HH:mm"),
  }
}

/** Returns the current local date (yyyy-MM-dd) in the given timezone. */
export function localDateNow(options: { timezone: string }): LocalDate {
  return formatInTimeZone(new Date(), options.timezone, "yyyy-MM-dd")
}

/** Splits a local date (yyyy-MM-dd) into its year, month, and day string parts. */
export function splitLocalDate(options: {
  localDate: LocalDate
}): { year: string; month: string; day: string } {
  const [year = "", month = "", day = ""] = options.localDate.split("-")
  return { year, month, day }
}

/**
 * Constructs a local date (yyyy-MM-dd) from year, month, and day string parts.
 * If the day is out of bounds for the given month (e.g. Feb 31), it is clamped
 * to the last valid day (e.g. Feb 28/29).
 */
export function getLocalDateFromParts(options: {
  day: string
  month: string
  year: string
  timezone: string
}): LocalDate {
  const { day, month, year } = options
  const m = month.padStart(2, "0")
  const d = day.padStart(2, "0")
  const candidate = `${year}-${m}-${d}`

  if (isValid(parseISO(candidate))) return candidate

  // Day is out of bounds — clamp to the last day of the given month.
  const lastDay = toZonedTime(
    fromZonedTime(`${year}-${m}-01T12:00:00`, options.timezone),
    options.timezone,
  )
  lastDay.setMonth(lastDay.getMonth() + 1, 0)
  return format(lastDay, "yyyy-MM-dd")
}
