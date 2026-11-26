import { describe, expect, test } from "vitest";
import { makeI18n } from "./I18n.tsx";
import { localeCodes, locales, preferredLocale } from "./locales.ts";
import { catalogs, type Plural } from "./messages.ts";

describe("i18n", () => {
  test.each(localeCodes)("%s: every plural message has every form its language uses", (locale) => {
    const categories = new Intl.PluralRules(locales[locale].tag).resolvedOptions().pluralCategories;
    for (const [key, value] of Object.entries(catalogs[locale])) {
      if (typeof value === "string") continue;
      for (const category of categories) expect((value as Plural)[category], `${locale}.${key}.${category}`).toBeTruthy();
    }
  });

  test.each(localeCodes)("%s: the same placeholders as French", (locale) => {
    const names = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");
    for (const [key, value] of Object.entries(catalogs.fr)) {
      const other = (catalogs[locale] as Record<string, unknown>)[key];
      const a = typeof value === "string" ? value : (value as Plural).other;
      const b = typeof other === "string" ? other : (other as Plural).other;
      expect(names(b), `${locale}.${key}`).toBe(names(a));
    }
  });

  test("Arabic counts take their six forms; digits stay Western everywhere", () => {
    const ar = makeI18n("ar");
    expect(ar.plural("results", 1)).toBe("نتيجة واحدة");
    expect(ar.plural("results", 2)).toBe("نتيجتان");
    expect(ar.plural("results", 3)).toBe("3 نتائج");
    expect(ar.plural("results", 11)).toBe("11 نتيجة");
    expect(makeI18n("hi").number(1234567)).toMatch(/^[0-9,]+$/);
    expect(makeI18n("ar").date("2026-11-26")).toMatch(/2026/);
  });

  test("the visitor's language, else French", () => {
    expect(preferredLocale(["zh-CN", "en"])).toBe("zh");
    expect(preferredLocale(["de-DE"])).toBe("fr");
    expect(preferredLocale(["ar-GN"])).toBe("ar");
  });
});
