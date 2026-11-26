/** The languages of the suite. French is the default. */
export const locales = {
  fr: { tag: "fr", name: "Français", dir: "ltr" },
  en: { tag: "en", name: "English", dir: "ltr" },
  zh: { tag: "zh-Hans", name: "中文", dir: "ltr" },
  hi: { tag: "hi", name: "हिन्दी", dir: "ltr" },
  ar: { tag: "ar", name: "العربية", dir: "rtl" },
} as const;

export type Locale = keyof typeof locales;
export const localeCodes = Object.keys(locales) as Locale[];
export const defaultLocale: Locale = "fr";

/** The first of the visitor's languages the suite speaks, else French. */
export function preferredLocale(languages: readonly string[] = typeof navigator === "undefined" ? [] : navigator.languages): Locale {
  for (const language of languages) {
    const base = language.toLowerCase().split("-")[0] as Locale;
    if (base in locales) return base;
  }
  return defaultLocale;
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && value in locales;
}
