import { de, enUS, es, fr, it, nl, pt } from "date-fns/locale"
import type { SupportedLocale } from "../types"

export const LOCALE_MAP = { de, en: enUS, es, fr, it, nl, pt } as const

export function resolveSupportedLocale(locale: string): SupportedLocale {
  const short = locale.split("-")[0] ?? "en"
  return (["en", "de", "es", "fr", "it", "nl", "pt"].includes(short) ? short : "en") as SupportedLocale
}

/**
 * Returns the IANA timezone string for the current device/environment
 * (e.g. `"Europe/Berlin"`).
 *
 * **Compatibility:**
 * - ✅ Browsers, Node.js, Bun, Deno — works reliably.
 * - ✅ React Native with Hermes (default since RN 0.73 / Expo SDK 50).
 * - ⚠️ React Native with JSC (older RN / pre-Expo 50) — `Intl` may exist but
 *   return `"UTC"` or an empty string instead of the real device timezone.
 *   In that environment use `expo-localization`:
 *   `import * as Localization from "expo-localization"`
 *   `Localization.getCalendars()[0].timeZone ?? "UTC"`
 *   or `react-native-localize`:
 *   `import RNLocalize from "react-native-localize"`
 *   `RNLocalize.getTimeZone()`
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}
