import { h } from "preact";
import "../src/styles.css";
import { I18nProvider, loadFonts } from "../src/i18n/I18n.tsx";
import { isLocale, locales } from "../src/i18n/locales.ts";

export default {
  parameters: {
    // Any axe violation fails the story in the catalog.
    a11y: { test: "error" },
    layout: "fullscreen",
  },
  globalTypes: {
    theme: {
      description: "Thème",
      toolbar: { icon: "contrast", items: [{ value: "system", title: "Système" }, { value: "light", title: "Clair" }, { value: "dark", title: "Sombre" }] },
    },
    locale: {
      description: "Langue (l'arabe passe de droite à gauche)",
      toolbar: { icon: "globe", items: Object.entries(locales).map(([value, { name }]) => ({ value, title: name })) },
    },
  },
  initialGlobals: { theme: "system", locale: "fr" },
  decorators: [
    (Story, context) => {
      const root = document.documentElement;
      const params = new URLSearchParams(location.search);
      const theme = params.get("theme") ?? context.globals.theme;
      if (theme === "light" || theme === "dark") root.dataset.theme = theme;
      else delete root.dataset.theme;
      // ?locale= for the browser audits, else the toolbar.
      const asked = params.get("locale") ?? context.globals.locale;
      const locale = isLocale(asked) ? asked : "fr";
      root.lang = locales[locale].tag;
      root.dir = locales[locale].dir;
      loadFonts(locale);
      return h(I18nProvider, { locale }, Story());
    },
  ],
};
