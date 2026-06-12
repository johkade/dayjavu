import {
  add,
  addDays,
  addHours,
  addMilliseconds,
  addMinutes,
  addMonths,
  addSeconds,
  addWeeks,
  addYears,
  differenceInDays,
  differenceInHours,
  differenceInMilliseconds,
  differenceInMinutes,
  differenceInMonths,
  differenceInSeconds,
  differenceInWeeks,
  differenceInYears,
  format,
  formatDistanceToNow,
  parseISO,
  sub,
} from "date-fns"
import { localDateToIsoDateMidOfDay } from "./convert"
import { formatIsoDate } from "./format"
import { LOCALE_MAP, resolveSupportedLocale } from "./init"
import type { IsoDate, LocalDate, LocalTime } from "../types"

export function addToIsoDate(options: {
  unit: "h" | "d" | "w" | "month" | "y" | "ms" | "min" | "s"
  amount: number
  isoDate: IsoDate
}): IsoDate {
  const { unit, amount, isoDate } = options
  switch (unit) {
    case "h":     return addHours(isoDate, amount).toISOString()
    case "d":     return addDays(isoDate, amount).toISOString()
    case "w":     return addWeeks(isoDate, amount).toISOString()
    case "month": return addMonths(isoDate, amount).toISOString()
    case "y":     return addYears(isoDate, amount).toISOString()
    case "ms":    return addMilliseconds(isoDate, amount).toISOString()
    case "min":   return addMinutes(isoDate, amount).toISOString()
    case "s":     return addSeconds(isoDate, amount).toISOString()
  }
}

export function subtractFromIsoDate(options: {
  unit: "h" | "d" | "w" | "month" | "y" | "ms" | "min" | "s"
  amount: number
  isoDate: IsoDate
}): IsoDate {
  return addToIsoDate({ ...options, amount: -options.amount })
}

export function addToLocalDate(options: {
  unit: "d" | "w" | "month" | "y"
  amount: number
  localDate: LocalDate
  timezone: string
}): LocalDate {
  const isoDate = localDateToIsoDateMidOfDay({ localDate: options.localDate, timezone: options.timezone })
  const updated = addToIsoDate({ unit: options.unit, amount: options.amount, isoDate })
  return formatIsoDate({ format: "2024-12-31", isoDate: updated, locale: "en", timezone: options.timezone })
}

export function subtractFromLocalDate(options: {
  unit: "d" | "w" | "month" | "y"
  amount: number
  localDate: LocalDate
  timezone: string
}): LocalDate {
  return addToLocalDate({ ...options, amount: -options.amount })
}

/** Adds an amount to a `Date` object and returns the resulting `Date`. */
export function addToDate(options: {
  unit: "h" | "d" | "w" | "month" | "y" | "ms" | "min" | "s"
  amount: number
  date: Date
}): Date {
  return new Date(addToIsoDate({ unit: options.unit, amount: options.amount, isoDate: options.date.toISOString() }))
}

/** Subtracts an amount from a `Date` object and returns the resulting `Date`. */
export function subtractFromDate(options: {
  unit: "h" | "d" | "w" | "month" | "y" | "ms" | "min" | "s"
  amount: number
  date: Date
}): Date {
  return addToDate({ ...options, amount: -options.amount })
}

export function isoDateIsWithinLastNHours(options: {
  isoDate: IsoDate
  hours: number
}): boolean {
  return differenceInHours(new Date(), parseISO(options.isoDate)) <= options.hours
}

/**
 * Returns the millisecond duration of a local time range.
 * Handles overnight spans (e.g. "22:00" → "06:00" adds one day to the end time).
 */
export function localTimeSpanToMs(options: {
  startTime: LocalTime
  endTime: LocalTime
}): number {
  const start = parseISO(`2000-01-01T${options.startTime}`)
  let end = parseISO(`2000-01-01T${options.endTime}`)
  if (end <= start) end = add(end, { days: 1 })
  return differenceInMilliseconds(end, start)
}

/** Returns the number of milliseconds elapsed from the given ISO date until now. */
export function isoDateToMsAgo(options: { isoDate: IsoDate }): number {
  return differenceInMilliseconds(new Date(), parseISO(options.isoDate))
}

/** Returns the age in full years from a date-of-birth ISO string. */
export function isoDateToAge(options: {
  dateOfBirth: IsoDate
  timezone?: string
}): number {
  const birthDate = new Date(options.dateOfBirth)
  if (isNaN(birthDate.getTime())) return 0
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--
  return age
}

/** Returns a relative string like "3 days ago" or "in 2 hours" for the given ISO date. */
export function getDateRelativeToNowFromIso(options: {
  isoDate: IsoDate
  locale?: string
}): string {
  const locale = options.locale ? LOCALE_MAP[resolveSupportedLocale(options.locale)] : undefined
  return formatDistanceToNow(parseISO(options.isoDate), { addSuffix: true, locale })
}

/**
 * Returns the latest HH:mm string from an array.
 * Works via lexicographic comparison which is correct for zero-padded HH:mm strings.
 */
export function getLatestTime(options: {
  times: LocalTime[]
}): LocalTime {
  return options.times.reduce((latest, t) => (t > latest ? t : latest), "00:00")
}

/** Adds an ISO duration to a HH:mm start time and returns the resulting HH:mm end time. */
export function getEndTimeFromStartTime(options: {
  time: LocalTime
  isoDuration: string
}): LocalTime {
  const { years, months, days, hours, minutes, seconds } = parseIsoDuration(options.isoDuration)
  const result = add(parseISO(`2000-01-01T${options.time}`), { years, months, days, hours, minutes, seconds })
  return format(result, "HH:mm")
}

/** Subtracts an ISO duration from a HH:mm end time and returns the resulting HH:mm start time. */
export function getStartTimeFromEndTime(options: {
  time: LocalTime
  isoDuration: string
}): LocalTime {
  const { years, months, days, hours, minutes, seconds } = parseIsoDuration(options.isoDuration)
  const result = sub(parseISO(`2000-01-01T${options.time}`), { years, months, days, hours, minutes, seconds })
  return format(result, "HH:mm")
}

/**
 * Difference between two ISO dates in the given unit.
 * Returns an absolute value by default; pass `allowNegatives: true` for signed results.
 */
export function diffIso(options: {
  isoDate: IsoDate
  compareIsoDate: IsoDate
  unit: "d" | "h" | "min" | "ms" | "y" | "s" | "month" | "w"
  allowNegatives?: boolean
}): number {
  const d1 = parseISO(options.isoDate)
  const d2 = parseISO(options.compareIsoDate)
  const abs = (v: number) => options.allowNegatives ? v : Math.abs(v)
  switch (options.unit) {
    case "d":     return abs(differenceInDays(d1, d2))
    case "h":     return abs(differenceInHours(d1, d2))
    case "min":   return abs(differenceInMinutes(d1, d2))
    case "ms":    return abs(differenceInMilliseconds(d1, d2))
    case "y":     return abs(differenceInYears(d1, d2))
    case "s":     return abs(differenceInSeconds(d1, d2))
    case "month": return abs(differenceInMonths(d1, d2))
    case "w":     return abs(differenceInWeeks(d1, d2))
  }
}

/**
 * Difference between two `Date` objects in the given unit.
 * Returns an absolute value by default; pass `allowNegatives: true` for signed results.
 */
export function diffDate(options: {
  date: Date
  compareDate: Date
  unit: "d" | "h" | "min" | "ms" | "y" | "s" | "month" | "w"
  allowNegatives?: boolean
}): number {
  return diffIso({
    isoDate: options.date.toISOString(),
    compareIsoDate: options.compareDate.toISOString(),
    unit: options.unit,
    allowNegatives: options.allowNegatives,
  })
}

/**
 * Difference between two local dates in the given unit.
 * Returns an absolute value by default; pass `allowNegatives: true` for signed results.
 */
export function diffLocalDate(options: {
  localDate: LocalDate
  compareLocalDate: LocalDate
  unit: "d" | "h" | "min" | "ms" | "y" | "s" | "month" | "w"
  allowNegatives?: boolean
}): number {
  const d1 = parseISO(`${options.localDate}T12:00:00.000Z`)
  const d2 = parseISO(`${options.compareLocalDate}T12:00:00.000Z`)
  const abs = (v: number) => options.allowNegatives ? v : Math.abs(v)
  switch (options.unit) {
    case "d":     return abs(differenceInDays(d1, d2))
    case "h":     return abs(differenceInHours(d1, d2))
    case "min":   return abs(differenceInMinutes(d1, d2))
    case "ms":    return abs(differenceInMilliseconds(d1, d2))
    case "y":     return abs(differenceInYears(d1, d2))
    case "s":     return abs(differenceInSeconds(d1, d2))
    case "month": return abs(differenceInMonths(d1, d2))
    case "w":     return abs(differenceInWeeks(d1, d2))
  }
}

// ─── Utilities ───────────────────────────────────────────────────────────────

/** Parses an ISO 8601 duration string (e.g. "P1Y2M3DT4H5M6S") into its numeric components. */
export function parseIsoDuration(isoDuration: string): {
  years: number; months: number; weeks: number; days: number
  hours: number; minutes: number; seconds: number
} {
  const match = isoDuration.match(
    /^P(?:(\d+(?:\.\d+)?)Y)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)W)?(?:(\d+(?:\.\d+)?)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/,
  )
  const n = (i: number) => parseFloat(match?.[i] ?? "0") || 0
  return { years: n(1), months: n(2), weeks: n(3), days: n(4), hours: n(5), minutes: n(6), seconds: n(7) }
}
