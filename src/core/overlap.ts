import type { LocalTime } from "../types"

type DateLike = Date | string

const toMs = (d: DateLike) => new Date(d).getTime()
// Truncate to second precision to avoid floating-point noise in comparisons.
const truncSec = (d: DateLike) => Math.floor(toMs(d) / 1000) * 1000

/**
 * Returns true if two date ranges overlap. Continuous ranges (where one ends
 * exactly when the other starts) are not counted as overlapping.
 * Accepts both `Date` objects and ISO date strings.
 */
export function isOverlapping(options: {
  range1: { startTime: DateLike; endTime: DateLike }
  range2: { startTime: DateLike; endTime: DateLike }
}): boolean {
  const { range1, range2 } = options
  const r1s = truncSec(range1.startTime)
  const r1e = truncSec(range1.endTime)
  const r2s = truncSec(range2.startTime)
  const r2e = truncSec(range2.endTime)
  const overlaps = r1s <= r2e && r2s <= r1e
  const isContinuous = r1e === r2s || r1s === r2e
  return overlaps && !isContinuous
}

/**
 * Returns true if the local time range spans midnight
 * (i.e. the end time is on the next calendar day).
 */
export function isLocalTimeRangeOverlappingDays(options: {
  localStartTime: LocalTime
  localEndTime: LocalTime
}): boolean {
  const normalize = (t: string) => {
    const [h = "00", m = "00"] = t.split(":")
    return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`
  }
  return normalize(options.localEndTime) <= normalize(options.localStartTime)
}
