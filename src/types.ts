export type SupportedLocale = "de" | "en" | "es" | "fr" | "it" | "nl" | "pt"

/** yyyy-MM-dd */
export type LocalDate = string

/** HH:mm */
export type LocalTime = string

/** ISO 8601 instant string */
export type IsoDate = string

/** ISO 8601 duration string, e.g. "PT1H30M" */
export type IsoDuration = string

export type LocalDateWeek = LocalDate[]
export type LocalDateMonth = LocalDate[]
export type LocalMonthYear = LocalDate[]

/**
 * Human-readable format token — maps to a concrete date-fns format string.
 * The token is an example of the output, not the format string itself.
 */
export type TimeFormat =
  // time
  | "10:30 AM"
  | "10:30"
  // date (locale-aware)
  | "2024/12/31"
  | "2024/12/31, 10:30 AM"
  | "Mar 3, 2023"
  | "Sat, Mar 3, 2023"
  | "Saturday, Mar 3, 2023"
  | "Mar 3, 2023, 10:30 AM"
  // "Today, 10:30 AM" / "Yesterday, 10:30 AM" / "2024/12/31, 10:30 AM".
  | "Today, 10:30 AM"
  // date (fixed format)
  | "2024-12-31"
  // partial date
  | "31"
  | "Mar"
  | "March"
  | "2024"
  | "March 3"
  | "March 2023"
  | "Mar '23"
  | "Feb 2024"
  | "12 Feb"
  // weekday
  | "Mon"
  | "Monday"
  | "Mo"

/** Relative time anchor for formatRelativeTime. */
export type RelativeTime =
  | "now"
  | "yesterday"
  | "tomorrow"
  | "nextWeek"
  | "lastWeek"

/**
 * A function that resolves a translation key to a localised string.
 * Compatible with i18next, react-intl, and custom i18n solutions.
 * `default` is always required so missing keys degrade to the fallback string.
 * Extra keys (e.g. `count`) are treated as template variables.
 */
export type TranslationFunction = (
  key: string,
  options: { default: string; [variable: string]: string | number },
) => string
