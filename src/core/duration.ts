import { add, parseISO } from "date-fns"
import { parseIsoDuration } from "./arithmetic"
import { localDateToIsoDateMidOfDay } from "./convert"
import { formatIsoDate } from "./format"
import type { IsoDate, IsoDuration, LocalDate, LocalTime } from "../types"

const MS = {
  second: 1000,
  minute: 60 * 1000,
  hour: 60 * 60 * 1000,
  day: 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  /** Approximate — use date-fns `add` for calendar-correct month/year arithmetic. */
  month: 30 * 24 * 60 * 60 * 1000,
  /** Approximate */
  year: 365 * 24 * 60 * 60 * 1000,
} as const

/** Converts an ISO 8601 duration string to milliseconds. Year/month values are approximate (365d / 30d). */
export function isoDurationToMs(options: {
  isoDuration: IsoDuration | null | undefined
}): number {
  if (!options.isoDuration) return 0
  const { years, months, weeks, days, hours, minutes, seconds } = parseIsoDuration(options.isoDuration)
  return (
    years * MS.year +
    months * MS.month +
    weeks * MS.week +
    days * MS.day +
    hours * MS.hour +
    minutes * MS.minute +
    seconds * MS.second
  )
}

/** Converts milliseconds to an ISO 8601 duration string (days / hours / minutes / seconds). */
export function msToIsoDuration(options: { ms: number }): IsoDuration {
  const { ms } = options
  if (ms <= 0) return "PT0S"
  const totalSeconds = Math.floor(ms / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const datePart = days > 0 ? `${days}D` : ""
  const timeParts = [
    hours > 0 ? `${hours}H` : "",
    minutes > 0 ? `${minutes}M` : "",
    seconds > 0 ? `${seconds}S` : "",
  ].join("")
  return `P${datePart}${timeParts ? `T${timeParts}` : ""}`
}

/** Returns the ISO duration between two ISO date strings. */
export function getIsoDurationBetween(options: {
  startDate: IsoDate
  endDate: IsoDate
}): IsoDuration {
  const ms = parseISO(options.endDate).getTime() - parseISO(options.startDate).getTime()
  return msToIsoDuration({ ms })
}

/**
 * Converts a local time span to an ISO duration string.
 * Handles overnight spans (endTime < startTime adds one day).
 */
export function localTimeSpanToIsoDuration(options: {
  startTime: LocalTime
  endTime: LocalTime
}): IsoDuration {
  const start = parseISO(`2000-01-01T${options.startTime}`)
  let end = parseISO(`2000-01-01T${options.endTime}`)
  if (end <= start) end = add(end, { days: 1 })
  return msToIsoDuration({ ms: end.getTime() - start.getTime() })
}

/** Adds an ISO duration to a UTC ISO date string. */
export function addIsoDurationToIsoDate(options: {
  isoDate: IsoDate
  isoDuration: IsoDuration
}): IsoDate {
  const dur = parseIsoDuration(options.isoDuration)
  return add(parseISO(options.isoDate), dur).toISOString()
}

/** Adds an ISO duration to a local date and returns the resulting local date (yyyy-MM-dd). */
export function addIsoDurationToLocalDate(options: {
  localDate: LocalDate
  timezone: string
  isoDuration: IsoDuration
  locale?: string
}): LocalDate {
  const isoDate = localDateToIsoDateMidOfDay({ localDate: options.localDate, timezone: options.timezone })
  const result = addIsoDurationToIsoDate({ isoDate, isoDuration: options.isoDuration })
  return formatIsoDate({ isoDate: result, format: "2024-12-31", timezone: options.timezone, locale: options.locale ?? "en" })
}

/** Rounds to the nearest month if the duration is more granular than months. */
export function isoDurationToMonths(options: { isoDuration: IsoDuration }): number {
  const { years, months, days } = parseIsoDuration(options.isoDuration)
  return Math.round(years * 12 + months + days / 30)
}

/**
 * Parses a "HH:mm" local time duration string (e.g. "01:30") into an ISO duration.
 * Returns `"INVALID"` if the input cannot be parsed.
 */
export function localTimeDurationToIsoDuration(options: {
  localTimeDuration: string
}): { isoDuration: IsoDuration } | "INVALID" {
  const [h, m] = options.localTimeDuration.split(":")
  const hours = parseInt(h ?? "", 10)
  const minutes = parseInt(m ?? "", 10)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return "INVALID"
  return { isoDuration: timeUnitsToIsoDuration({ hours, minutes }) }
}

/**
 * Converts an ISO duration to a "HH:mm" local time duration string.
 * Returns `"INVALID"` if the input cannot be parsed.
 */
export function isoDurationToLocalTimeDuration(options: {
  isoDuration: IsoDuration | null | undefined
}): string | "INVALID" {
  try {
    const ms = isoDurationToMs(options)
    if (!Number.isFinite(ms)) return "INVALID"
    const totalMinutes = Math.floor(ms / 60000)
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
  } catch {
    return "INVALID"
  }
}

/** Converts hours + minutes into an ISO 8601 duration string. */
export function timeUnitsToIsoDuration(options: {
  hours: number
  minutes: number
}): IsoDuration {
  const ms = options.hours * MS.hour + options.minutes * MS.minute
  return msToIsoDuration({ ms })
}
