import { useState } from "preact/hooks";
import { useI18n } from "../i18n/I18n.tsx";

export type Theme = "system" | "light" | "dark";
const key = "syli.theme";

const read = (): Theme => {
  try {
    const value = localStorage.getItem(key);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
};

/** Applies a theme to the page: data-theme on <html>, or the system's. */
export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") delete root.dataset.theme;
  else root.dataset.theme = theme;
}

/** Call once at start, before the first paint, to avoid a flash. */
export function restoreTheme() {
  applyTheme(read());
}

/**
 * The theme of this device: system (default), light or dark. A choice of
 * three radios in a group, remembered on the device.
 */
export function ThemeToggle({ label }: { label?: string }) {
  const { t } = useI18n();
  const [theme, setThemeState] = useState<Theme>(read);
  const setTheme = (next: Theme) => {
    setThemeState(next);
    applyTheme(next);
    try {
      if (next === "system") localStorage.removeItem(key);
      else localStorage.setItem(key, next);
    } catch {
      /* Private mode: the choice lasts the session. */
    }
  };
  const options: [Theme, string][] = [
    ["system", t("themeSystem")],
    ["light", t("themeLight")],
    ["dark", t("themeDark")],
  ];
  return (
    <fieldset class="sy-theme">
      <legend class="sy-theme__legend">{label ?? t("theme")}</legend>
      {options.map(([value, text]) => (
        <label class="sy-theme__option" key={value}>
          <input type="radio" name="sy-theme" value={value} checked={theme === value} onChange={() => setTheme(value)} />
          <span>{text}</span>
        </label>
      ))}
    </fieldset>
  );
}
