import { applyLocale, isLocale, preferredLocale, type Locale } from "@syli/ui";

const key = "syli.locale";

/** The language chosen on this device, else the visitor's, else French. */
export function savedLocale(): Locale {
  try {
    const saved = localStorage.getItem(key);
    if (isLocale(saved)) return saved;
  } catch {
    /* Private mode. */
  }
  return preferredLocale();
}

export function saveLocale(locale: Locale) {
  applyLocale(locale);
  try {
    localStorage.setItem(key, locale);
  } catch {
    /* Private mode: the choice lasts the session. */
  }
}
