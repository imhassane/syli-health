import { createContext, type ComponentChildren } from "preact";
import { useContext, useMemo } from "preact/hooks";
import { defaultLocale, locales, type Locale } from "./locales.ts";
import { catalogs, type Messages, type Plural } from "./messages.ts";

type Key = { [K in keyof Messages]: Messages[K] extends string ? K : never }[keyof Messages];
type PluralKey = { [K in keyof Messages]: Messages[K] extends Plural ? K : never }[keyof Messages];
type Vars = Record<string, string | number>;

const fill = (text: string, vars: Vars = {}) => text.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? `{${name}}`));

export type I18n = {
  locale: Locale;
  /** The BCP 47 tag for lang attributes and Intl ("zh-Hans"). */
  tag: string;
  dir: "ltr" | "rtl";
  t: (key: Key, vars?: Vars) => string;
  /** A count in words: one of the language's plural forms, {n} formatted. */
  plural: (key: PluralKey, n: number, vars?: Vars) => string;
  /** Numbers and dates always in Western digits (0-9), in every language. */
  number: (n: number, options?: Intl.NumberFormatOptions) => string;
  date: (date: Date | string, options?: Intl.DateTimeFormatOptions) => string;
};

export function makeI18n(locale: Locale): I18n {
  const { tag, dir } = locales[locale];
  const messages = catalogs[locale];
  const rules = new Intl.PluralRules(tag);
  const intlTag = `${tag}-u-nu-latn`;
  const number = (n: number, options?: Intl.NumberFormatOptions) => new Intl.NumberFormat(intlTag, options).format(n);
  return {
    locale,
    tag,
    dir,
    t: (key, vars) => fill(messages[key] as string, vars),
    plural: (key, n, vars) => {
      const forms = messages[key] as Plural;
      return fill(forms[rules.select(n)] ?? forms.other, { ...vars, n: number(n) });
    },
    number,
    date: (date, options = { dateStyle: "medium" }) =>
      new Intl.DateTimeFormat(intlTag, options).format(typeof date === "string" ? new Date(`${date}T00:00:00`) : date),
  };
}

const I18nContext = createContext<I18n>(makeI18n(defaultLocale));

/** Gives every component below it the language of the page. */
export function I18nProvider({ locale, children }: { locale: Locale; children: ComponentChildren }) {
  const value = useMemo(() => makeI18n(locale), [locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);

/**
 * The fonts of scripts Latin and Arabic do not cover, declared on demand.
 * Their files then load only for the characters on screen (unicode-range):
 * Noto Sans SC is cut in about a hundred pieces.
 */
export function loadFonts(locale: Locale): Promise<unknown> {
  if (locale === "zh") return Promise.all([import("@fontsource/noto-sans-sc/400.css"), import("@fontsource/noto-sans-sc/600.css")]);
  if (locale === "hi")
    return Promise.all([import("@fontsource/ibm-plex-sans-devanagari/devanagari-400.css"), import("@fontsource/ibm-plex-sans-devanagari/devanagari-600.css")]);
  return Promise.resolve();
}

/** Sets the page's language and direction (<html lang dir>) and its fonts. */
export function applyLocale(locale: Locale) {
  const root = document.documentElement;
  root.lang = locales[locale].tag;
  root.dir = locales[locale].dir;
  return loadFonts(locale);
}
