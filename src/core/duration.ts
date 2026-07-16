import { add, parseISO, formatDuration as dateFnsFormatDuration } from "date-fns"
import { parseIsoDuration } from "./arithmetic"
import { localDateToIsoDateMidOfDay } from "./convert"
import { formatIsoDate } from "./format"
import { LOCALE_MAP } from "./init"
import type { IsoDate, IsoDuration, LocalDate, LocalTime, SupportedLocale, TranslationFunction } from "../types"

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

// ─── Human-readable duration formatting ─────────────────────────────────────

export type DurationStyle = "long" | "short" | "tiny"
export type DurationGranularity = "auto" | "minutes" | "roundedToDays"

type DurationUnitKey = "years" | "days" | "hours" | "minutes"

/** Translation keys + English fallback strings for the "short"/"tiny" styles, one entry per unit. */
const UNIT_KEYS: Record<
  DurationUnitKey,
  { long: string; longOne: string; short: string; tiny: string }
> = {
  years:   { long: "common.units.nYears",   longOne: "common.units.nYearsOne",   short: "common.units.nYearsShort",   tiny: "common.units.nYearsTiny" },
  days:    { long: "common.units.nDays",    longOne: "common.units.nDaysOne",    short: "common.units.nDaysShort",    tiny: "common.units.nDaysTiny" },
  hours:   { long: "common.units.nHours",   longOne: "common.units.nHoursOne",   short: "common.units.nHoursShort",   tiny: "common.units.nHoursTiny" },
  minutes: { long: "common.units.nMinutes", longOne: "common.units.nMinutesOne", short: "common.units.nMinutesShort", tiny: "common.units.nMinutesTiny" },
}

const UNIT_DEFAULTS: Record<DurationUnitKey, { long: string; longOne: string; short: string; tiny: string }> = {
  years:   { long: "{{count}} years",   longOne: "{{count}} year",   short: "{{count}} y",   tiny: "{{count}} y" },
  days:    { long: "{{count}} days",    longOne: "{{count}} day",    short: "{{count}} d",   tiny: "{{count}} d" },
  hours:   { long: "{{count}} hours",   longOne: "{{count}} hour",   short: "{{count}} h",   tiny: "{{count}} h" },
  minutes: { long: "{{count}} minutes", longOne: "{{count}} minute", short: "{{count}} min", tiny: "{{count}} m" },
}

/** Renders a single unit via date-fns's own locale strings (used for `style: "long"`). */
function renderUnitLong(unit: DurationUnitKey, count: number, locale: SupportedLocale): string {
  return dateFnsFormatDuration({ [unit]: count }, { locale: LOCALE_MAP[locale], format: [unit], zero: true })
}

/** Renders a single unit via a consumer-supplied translation function (used for `style: "short" | "tiny"`). */
function renderUnitShortTiny(unit: DurationUnitKey, count: number, style: "short" | "tiny", t: TranslationFunction): string {
  const keys = UNIT_KEYS[unit]
  const defaults = UNIT_DEFAULTS[unit]
  return style === "tiny"
    ? t(keys.tiny, { default: defaults.tiny, count })
    : t(keys.short, { default: defaults.short, count })
}

function renderUnit(unit: DurationUnitKey, count: number, style: DurationStyle, locale: SupportedLocale, t?: TranslationFunction): string {
  if (style === "long") return renderUnitLong(unit, count, locale)
  if (!t) throw new Error(`formatDurationMs: "t" is required for style "${style}"`)
  return renderUnitShortTiny(unit, count, style, t)
}

/**
 * Best-effort German dative-plural adjustment ("Tage" -> "Tagen", "Jahre" -> "Jahren").
 * Generic across units/styles: applied to whatever unit string was rendered, not hardcoded to days.
 * Not a full grammar engine — only handles the common "ends in -e" weak-declension case.
 */
function applyCaseAdjustment(text: string, locale: SupportedLocale, caseAdjusted: boolean): string {
  if (!caseAdjusted || locale !== "de") return text
  return /e$/.test(text) ? `${text}n` : text
}

const UNIT_ORDER: DurationUnitKey[] = ["years", "days", "hours", "minutes"]

/** Splits a millisecond span into whole days/hours/minutes (no weeks/months — see module docs). */
function msToDayHourMinuteParts(ms: number): { days: number; hours: number; minutes: number } {
  const days = Math.floor(ms / MS.day)
  const hours = Math.floor((ms - days * MS.day) / MS.hour)
  const minutes = Math.floor((ms - days * MS.day - hours * MS.hour) / MS.minute)
  return { days, hours, minutes }
}

/**
 * Single shared renderer: given a sparse map of unit -> count, renders every non-zero
 * unit (in `UNIT_ORDER`) and joins them. If every provided unit is zero, falls back to
 * rendering the smallest provided unit as zero (e.g. "0 minutes") instead of an empty string.
 * `formatDurationMs` and `formatIsoDuration` both reduce their input down to this shape
 * and delegate here — neither re-implements the render/join logic itself.
 */
function formatDurationFromParts(
  parts: Partial<Record<DurationUnitKey, number>>,
  options: { style: DurationStyle; locale: SupportedLocale; caseAdjusted: boolean; t?: TranslationFunction },
): string {
  const { style, locale, caseAdjusted, t } = options
  const present = UNIT_ORDER.filter((unit) => parts[unit] !== undefined)
  const nonZero = present.filter((unit) => parts[unit])
  const unitsToRender = nonZero.length > 0 ? nonZero : present.slice(-1)
  return unitsToRender
    .map((unit) => applyCaseAdjustment(renderUnit(unit, parts[unit] ?? 0, style, locale, t), locale, caseAdjusted))
    .join(" ")
}

/**
 * Formats a millisecond duration as a human-readable string.
 *
 * `style: "long"` (default) uses date-fns's own per-locale duration strings — correct
 * pluralization/grammar for all 7 supported locales, no translation keys needed.
 * `style: "short" | "tiny"` has no date-fns equivalent, so a `t: TranslationFunction` is
 * required and drives the wording (see `UNIT_KEYS` for the expected translation keys).
 */
export function formatDurationMs(options: {
  ms: number
  locale: SupportedLocale
  style?: DurationStyle
  granularity?: DurationGranularity
  /** German dative-plural adjustment for whichever unit is rendered, e.g. "2 Tage" -> "2 Tagen". */
  caseAdjusted?: boolean
  /** Required for style "short" | "tiny". Unused for "long" (date-fns locale strings are used instead). */
  t?: TranslationFunction
}): string {
  const { ms, locale, style = "long", granularity = "auto", caseAdjusted = false, t } = options
  const safeMs = Number.isFinite(ms) && ms > 0 ? ms : 0
  const renderOptions = { style, locale, caseAdjusted, t }

  if (granularity === "minutes")
    return formatDurationFromParts({ minutes: Math.floor(safeMs / MS.minute) }, renderOptions)
  if (granularity === "roundedToDays")
    return formatDurationFromParts({ days: Math.round(safeMs / MS.day) }, renderOptions)

  return formatDurationFromParts(msToDayHourMinuteParts(safeMs), renderOptions)
}

/**
 * Formats an ISO 8601 duration string as a human-readable string.
 * Reuses `parseIsoDuration`, so unlike a regex-per-shape approach it handles any
 * combination of years/months/weeks/days/hours/minutes/seconds (e.g. "P1Y2M3W4D").
 *
 * Only `years`, `days`, `hours`, and `minutes` are ever rendered — weeks and months are
 * folded into days (weeks exactly; months using the same 30-day approximation as
 * `isoDurationToMs`) rather than shown as their own unit.
 */
export function formatIsoDuration(options: {
  isoDuration: IsoDuration
  locale: SupportedLocale
  style?: DurationStyle
  caseAdjusted?: boolean
  t?: TranslationFunction
}): string {
  const { isoDuration, locale, style = "long", caseAdjusted = false, t } = options
  const { years, months, weeks, days, hours, minutes, seconds } = parseIsoDuration(isoDuration)
  const subYearMs =
    months * MS.month + weeks * MS.week + days * MS.day + hours * MS.hour + minutes * MS.minute + seconds * MS.second
  return formatDurationFromParts(
    { years, ...msToDayHourMinuteParts(subYearMs) },
    { style, locale, caseAdjusted, t },
  )
}
