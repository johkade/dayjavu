# dayjavu

Type-safe date utilities with timezone and locale enforcement. Built on top of `date-fns`.

## Installation

```bash
npm install dayjavu date-fns date-fns-tz
```

`date-fns` and `date-fns-tz` are peer dependencies and must be installed alongside the package.

## Usage

```ts
import dayjavu from "dayjavu"

const tz = dayjavu.getUserTimezone()          // "Europe/Berlin"
const today = dayjavu.localDateNow({ timezone: tz }) // "2024-03-15"
```

Every public function lives on the `dayjavu` object. No named imports needed.

## Core concepts

The library operates with three distinct date representations. Choosing the right one prevents entire classes of bugs.

| Type | Format | When to use |
|---|---|---|
| `IsoDate` | `2024-03-15T10:30:00.000Z` | Storing, transmitting, comparing moments in time |
| `LocalDate` | `2024-03-15` | Calendar days that belong to a specific user, not a UTC clock |
| `LocalTime` | `10:30` | Time-of-day without a date or timezone |

**Never mix them.** The function names tell you which type they work with — `isoDateToLocalDate`, `formatLocalDate`, `diffIso`, etc.

## Design principles

**1. Timezone is always explicit.**
Every function that interprets a moment as a calendar day requires a `timezone` string. There are no implicit defaults. Use `dayjavu.getUserTimezone()` to read the device timezone.

```ts
const tz = dayjavu.getUserTimezone() // "Europe/Berlin"
const today = dayjavu.localDateNow({ timezone: tz }) // "2024-03-15"
```

**2. All functions take a single options object.**
No positional arguments. This makes call sites self-documenting and allows optional fields to be added without breaking existing callers.

```ts
// ✓
dayjavu.formatIsoDate({ isoDate, format: "Mar 3, 2023", timezone, locale })

// ✗ — not how this library works
dayjavu.formatIsoDate(isoDate, "Mar 3, 2023", timezone, locale)
```

**3. Format tokens are example outputs, not format strings.**
The `TimeFormat` type uses the *result* as the token name. You see what you get.

```ts
dayjavu.formatIsoDate({ isoDate, format: "10:30 AM", timezone, locale }) // → "3:45 PM"
dayjavu.formatIsoDate({ isoDate, format: "Mar 3, 2023", timezone, locale }) // → "Jan 12, 2025"
dayjavu.formatIsoDate({ isoDate, format: "2024-12-31", timezone, locale }) // → "2025-01-12"
```

**4. Unit strings are unambiguous.**
Add/subtract functions use short codes: `"h"` (hours), `"d"` (days), `"w"` (weeks), `"month"`, `"y"` (years), `"min"` (minutes), `"s"` (seconds), `"ms"` (milliseconds). There is no `"m"` — it would be ambiguous between minutes and months.

```ts
dayjavu.addToIsoDate({ isoDate, amount: 3, unit: "month" })
dayjavu.addToIsoDate({ isoDate, amount: 30, unit: "min" })
```

## Common usage

```ts
import dayjavu from "dayjavu"

const tz = dayjavu.getUserTimezone()

// Convert a UTC timestamp to a local calendar day
const localDate = dayjavu.isoDateToLocalDate({ isoDate: event.startsAt, timezone: tz })
// → "2024-03-15"

// Format for display
dayjavu.formatIsoDate({ isoDate: event.startsAt, format: "Sat, Mar 3, 2023", timezone: tz, locale: "en" })
// → "Fri, Mar 15, 2024"

dayjavu.formatLocalDate({ localDate, format: "March 3", timezone: tz, locale: "en" })
// → "March 15"

// Arithmetic
const nextWeek = dayjavu.addToLocalDate({ localDate, amount: 1, unit: "w", timezone: tz })
const inThreeMonths = dayjavu.addToIsoDate({ isoDate: event.startsAt, amount: 3, unit: "month" })

// Comparison
const daysUntil = dayjavu.diffIso({ isoDate: new Date().toISOString(), compareIsoDate: event.startsAt, unit: "d" })
const isHappeningToday = dayjavu.isoDateIsToday({ isoDate: event.startsAt, timezone: tz })

// Build a calendar week
const week = dayjavu.buildWeekAroundLocalDate({ localDate, timezone: tz })
// → ["2024-03-11", "2024-03-12", ..., "2024-03-17"]
```

## Durations

Durations are handled as ISO 8601 strings (`"PT1H30M"`, `"P3D"`, etc.).

```ts
dayjavu.isoDurationToLocalTimeDuration({ isoDuration: "PT1H30M" }) // → "01:30" | "INVALID"
dayjavu.localTimeSpanToIsoDuration({ startTime: "09:00", endTime: "10:30" }) // → "PT1H30M"
dayjavu.addIsoDurationToIsoDate({ isoDate, isoDuration: "PT2H" }) // → ISO string 2 hours later
```

## React Native

`dayjavu.getUserTimezone()` uses `Intl.DateTimeFormat().resolvedOptions().timeZone` and works correctly on:

- ✅ Browsers, Node.js
- ✅ React Native with Hermes (default since RN 0.73 / Expo SDK 50)

On older React Native setups with the JSC engine, `Intl` may return `"UTC"` instead of the real device timezone. In that case, read the timezone from the native layer and pass it in manually:

```ts
// expo-localization
import * as Localization from "expo-localization"
const tz = Localization.getCalendars()[0].timeZone ?? "UTC"

// or react-native-localize
import RNLocalize from "react-native-localize"
const tz = RNLocalize.getTimeZone()

dayjavu.localDateNow({ timezone: tz })
```

All other `dayjavu` functions are pure date arithmetic and work the same in every JavaScript environment.

## Supported locales

`"de"` · `"en"` · `"es"` · `"fr"` · `"it"` · `"nl"` · `"pt"`

Locale affects the output of `formatIsoDate`, `formatLocalDate`, `formatLocalTime`, `formatIsoTimeIntelligently`, and `getDateRelativeToNowFromIso`. For unrecognised locale strings (e.g. `"en-US"`), the library extracts the base tag (`"en"`) and falls back to `"en"` if unsupported.

## TypeScript

Types are available as named imports:

```ts
import type { IsoDate, LocalDate, LocalTime, IsoDuration, TimeFormat, SupportedLocale } from "dayjavu"
```
# dayjavu
