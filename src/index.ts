import * as _convert    from "./core/convert"
import * as _format     from "./core/format"
import * as _compare    from "./core/compare"
import * as _arithmetic from "./core/arithmetic"
import * as _duration   from "./core/duration"
import * as _overlap    from "./core/overlap"
import * as _ranges     from "./core/ranges"
import { getUserTimezone, resolveSupportedLocale } from "./core/init"

export const dayjavu = {
  ..._convert,
  ..._format,
  ..._compare,
  ..._arithmetic,
  ..._duration,
  ..._overlap,
  ..._ranges,
  getUserTimezone,
  resolveSupportedLocale,
}

export default dayjavu

export type { BetweenBehavior } from "./core/compare"
export type {
  SupportedLocale,
  LocalDate,
  LocalTime,
  IsoDate,
  IsoDuration,
  LocalDateWeek,
  LocalDateMonth,
  LocalMonthYear,
  TimeFormat,
  RelativeTime,
  TranslationFunction,
} from "./types"
