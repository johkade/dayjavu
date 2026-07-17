import { isAfter as isAfterFns, isBefore as isBeforeFns, startOfDay, startOfHour, startOfMinute } from "date-fns"
import { toZonedTime } from "date-fns-tz"
import { formatIsoDate } from "./format"
import { localDateToIsoDateEndOfDay, localDateToIsoDateStartOfDay, isoDateToLocalDate } from "./convert"
import type { IsoDate, LocalDate } from "../types"

export function isoDateIsAfter(options: {
  isoDate: IsoDate
  isoDateToCompare: IsoDate
}): boolean {
  return isAfterFns(options.isoDate, options.isoDateToCompare)
}

export function isoDateIsBefore(options: {
  isoDate: IsoDate
  isoDateToCompare: IsoDate
}): boolean {
  return isBeforeFns(options.isoDate, options.isoDateToCompare)
}

export function isoDateIsSameOrAfter(options: {
  isoDate: IsoDate
  isoDateToCompare: IsoDate
}): boolean {
  return !isBeforeFns(options.isoDate, options.isoDateToCompare)
}

export function isoDateIsSameOrBefore(options: {
  isoDate: IsoDate
  isoDateToCompare: IsoDate
}): boolean {
  return !isAfterFns(options.isoDate, options.isoDateToCompare)
}

export function localDateIsAfter(options: {
  localDate: LocalDate
  localDateToCompare: LocalDate
}): boolean {
  return isAfterFns(options.localDate, options.localDateToCompare)
}

export function localDateIsBefore(options: {
  localDate: LocalDate
  localDateToCompare: LocalDate
}): boolean {
  return isBeforeFns(options.localDate, options.localDateToCompare)
}

/** Generic comparator that accepts any date/ISO string. Prefer the typed variants above when the input type is known. */
export function isAfter(options: {
  date: string | Date
  dateToCompare: string | Date
}): boolean {
  return isAfterFns(options.date, options.dateToCompare)
}

/** Generic comparator that accepts any date/ISO string. Prefer the typed variants above when the input type is known. */
export function isBefore(options: {
  date: string | Date
  dateToCompare: string | Date
}): boolean {
  return isBeforeFns(options.date, options.dateToCompare)
}

export function isoDateIsSameDay(options: {
  isoDate: IsoDate
  isoDateToCompare: IsoDate
  timezone: string
}): boolean {
  const fmt = (isoDate: IsoDate) =>
    formatIsoDate({ format: "2024/12/31", isoDate, locale: "en", timezone: options.timezone })
  return fmt(options.isoDate) === fmt(options.isoDateToCompare)
}

export function isoDateIsToday(options: {
  isoDate: IsoDate
  timezone: string
}): boolean {
  return isoDateIsSameDay({
    isoDate: options.isoDate,
    isoDateToCompare: new Date().toISOString(),
    timezone: options.timezone,
  })
}

export function isoDateIsYesterday(options: {
  isoDate: IsoDate
  timezone: string
}): boolean {
  return isoDateIsSameDay({
    isoDate: options.isoDate,
    isoDateToCompare: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    timezone: options.timezone,
  })
}

export function isoDateIsTomorrow(options: {
  isoDate: IsoDate
  timezone: string
}): boolean {
  return isoDateIsSameDay({
    isoDate: options.isoDate,
    isoDateToCompare: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    timezone: options.timezone,
  })
}

/** Returns true if the ISO date falls within the calendar day of the given local date in the given timezone. */
export function isoDateIsOnLocalDate(options: {
  isoDate: IsoDate
  localDate: LocalDate
  timezone: string
}): boolean {
  const start = localDateToIsoDateStartOfDay({ localDate: options.localDate, timezone: options.timezone })
  const end = localDateToIsoDateEndOfDay({ localDate: options.localDate, timezone: options.timezone })
  return options.isoDate >= start && options.isoDate <= end
}

export function isoDateIsInFuture(options: { isoDate: IsoDate }): boolean {
  return new Date(options.isoDate) > new Date()
}

export function localDateIsToday(options: {
  localDate: LocalDate
  timezone: string
}): boolean {
  return isoDateIsOnLocalDate({
    isoDate: new Date().toISOString(),
    localDate: options.localDate,
    timezone: options.timezone,
  })
}

export function localDateIsTomorrow(options: {
  localDate: LocalDate
  timezone: string
}): boolean {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  return isoDateIsOnLocalDate({ isoDate: tomorrow, localDate: options.localDate, timezone: options.timezone })
}

export function localDateIsYesterday(options: {
  localDate: LocalDate
  timezone: string
}): boolean {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  return isoDateIsOnLocalDate({ isoDate: yesterday, localDate: options.localDate, timezone: options.timezone })
}

export function localDateIsInFuture(options: {
  localDate: LocalDate
  timezone: string
}): boolean {
  const end = localDateToIsoDateEndOfDay({ localDate: options.localDate, timezone: options.timezone })
  return end >= new Date().toISOString()
}

/** Returns true if two local dates represent the same calendar day. */
export function localDateIsSame(options: {
  localDate1: LocalDate
  localDate2: LocalDate
}): boolean {
  return options.localDate1 === options.localDate2
}

/** Returns true if two `Date` objects fall on the same calendar day in the given timezone. */
export function dateIsSameDay(options: {
  date: Date
  dateToCompare: Date
  timezone: string
}): boolean {
  const fmt = (d: Date) => formatIsoDate({ format: "2024/12/31", isoDate: d.toISOString(), locale: "en", timezone: options.timezone })
  return fmt(options.date) === fmt(options.dateToCompare)
}

/**
 * Returns true if all dates in the array share the same moment at the given granularity in the given timezone.
 * Granularity "day" checks same calendar day, "hour" same hour, "minute" same minute.
 */
export function datesAreSame(options: {
  dates: Date[]
  unit: "day" | "hour" | "minute"
  timezone: string
}): boolean {
  if (options.dates.length < 2) return options.dates.length === 1
  const truncate = (d: Date) => {
    const local = toZonedTime(d, options.timezone)
    switch (options.unit) {
      case "day":    return startOfDay(local).getTime()
      case "hour":   return startOfHour(local).getTime()
      case "minute": return startOfMinute(local).getTime()
    }
  }
  const ref = truncate(options.dates[0]!)
  return options.dates.every((d) => truncate(d) === ref)
}

export type BetweenBehavior = "includeBoundaries" | "excludeBoundaries" | "includeStartExcludeEnd" | "excludeStartIncludeEnd"

function _isBetween(t: number, start: number, end: number, behavior: BetweenBehavior): boolean {
  switch (behavior) {
    case "includeBoundaries":      return t >= start && t <= end
    case "excludeBoundaries":      return t > start && t < end
    case "includeStartExcludeEnd": return t >= start && t < end
    case "excludeStartIncludeEnd": return t > start && t <= end
  }
}

/** Returns true if `date` falls between `start` and `end` according to the chosen boundary behavior. */
export function dateIsBetween(options: {
  date: Date
  start: Date
  end: Date
  behavior: BetweenBehavior
}): boolean {
  return _isBetween(options.date.getTime(), options.start.getTime(), options.end.getTime(), options.behavior)
}

/** Returns true if the ISO date falls between `start` and `end` according to the chosen boundary behavior. */
export function isoDateIsBetween(options: {
  date: IsoDate
  start: IsoDate
  end: IsoDate
  behavior: BetweenBehavior
}): boolean {
  return _isBetween(
    new Date(options.date).getTime(),
    new Date(options.start).getTime(),
    new Date(options.end).getTime(),
    options.behavior,
  )
}

/** Returns an ISO string at the very start of the calendar day for the given ISO date in the given timezone. */
export function getStartOfIsoDate(options: {
  isoDate: IsoDate
  timezone: string
}): IsoDate {
  const localDate = isoDateToLocalDate({ isoDate: options.isoDate, timezone: options.timezone })
  return localDateToIsoDateStartOfDay({ localDate, timezone: options.timezone })
}

/** Returns an ISO string at the very end of the calendar day for the given ISO date in the given timezone. */
export function getEndOfIsoDate(options: {
  isoDate: IsoDate
  timezone: string
}): IsoDate {
  const localDate = isoDateToLocalDate({ isoDate: options.isoDate, timezone: options.timezone })
  return localDateToIsoDateEndOfDay({ localDate, timezone: options.timezone })
}
