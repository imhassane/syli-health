# Syli Health

Medical software suite for West Africa (Guinea first). First product: Syli Pharmacie.
Architecture and product decisions (French) live in the claude.ai project « Suite Médicale ».

## Layout

- `packages/ui` (`@syli/ui`): Preact + TypeScript components, themed only through `--sy-*` CSS variables (`src/foundations/tokens.css`).
- `apps/web`: the light client, a PWA (vite-plugin-pwa). `apps/desktop`: the heavy client, Tauri 2 around the same build (`frontendDist: ../../web/dist`); no service worker inside Tauri (`__TAURI_INTERNALS__`).

## Rules

- Code, comments and test names in English.
- **Interface languages: French (default), English, Chinese (Simplified), Hindi, Arabic (right to left).** `@syli/ui` has its own words in `src/i18n/messages.ts` (French the reference, the others typed from it: a missing text fails the build); apps keep theirs the same way (`apps/web/src/text.ts`). Components read the language from `I18nProvider` (`useI18n()`: `t`, `plural`, `number`, `date`); `applyLocale` sets `<html lang dir>` and loads the fonts. Counts are plural messages with every category of `Intl.PluralRules` (Arabic six, Chinese one; checked by `i18n.test.tsx`). Digits stay Western (0–9) in every language. Logical CSS only; amounts, codes and phone numbers in `.sy-ltr` or `<bdi>`. Data in another language than the page carries its own `lang` (`Column.lang`, RGAA 8.7). No letter spacing or forced capitals in Arabic, Hindi or Chinese.
- Fonts: IBM Plex Sans and IBM Plex Sans Arabic always; IBM Plex Sans Devanagari and Noto Sans SC declared only when Hindi or Chinese is chosen (`loadFonts`), never precached by the PWA (cached on first use).
- Preact, not React (bundle size on African mobile networks); keep plain hooks and JSX so a move to React stays cheap.
- Colors only from tokens, declared with `light-dark()` on `:root, [data-theme]`; `data-theme="light|dark"` forces a scheme. Never a hard-coded color in a component.
- Native HTML first: `<dialog>` with `showModal()` (a bottom drawer below 40rem), `popover="manual"` for toasts (feature-detected), real `<table>` with sort buttons in `<th>`, radios and checkboxes.
- Layout by container queries; media queries only for the input device (`pointer: coarse`: 44px targets) and user settings.
- Fields: errors after interaction only (`:user-invalid`), one polite announcer (`announce()`).
- Clinical alerts (interactions, allergies) are never toasts: `ClinicalAlert` stays until handled.
- Tables (`DataTable`): 5 columns at most, what decides at a glance; the rest goes in the opened row (`onOpen` opens a sheet, `rowHref` a page; the row header is the link or button, a click anywhere on the row does the same). Always `pageSize` rows high (10): blank rows dashed, the pagination always there. Filters as pills on one line (they scroll sideways, never wrap); in a narrow frame, filters and sort go into a drawer.
- Loading content is a `Skeleton`, never a spinner (spinners only on a button doing something).
- Banners and alerts have no rules (no border, no start bar): a tinted field and an icon disc.
- Motion (from Syli Guichet): things arrive by sliding or unfolding, once, with `@starting-style`; text never fades (axe reads contrast mid-animation); nothing moves for more than 5 s (WCAG 2.2.2); all off with `prefers-reduced-motion`.
- Brand: `Logo` (the drop, a leaf in the product's colour: health, pharmacie, clinique, labo, patient; wordmark in Montserrat, product names 4.5:1). `Blob`/`BlobField`: the ten brand blobs (vectorised), behind pages, under a veil of the page colour, never behind text to read.
- Every component ships with stories, Vitest tests (role and name queries, axe) and passes `e2e/stories.spec.js` (axe in Chromium, phone, tablet and computer: French and Arabic in light and dark, English, Chinese and Hindi in light). Target: WCAG 2.2 AA.

## Browser support

- Heavy client: WebView2 (Windows, evergreen Chromium), WKWebView (macOS 13+), WebKitGTK 4.1 (Linux).
- Light client: current Chrome for Android, Safari for iOS 16.4+, current desktop browsers.
- **Policy:** Baseline Widely available features freely. Newly available ones only when feature-detected, with a fallback of at most 20 lines and no dependency (e.g. `closedby`, `popover`, `ariaNotify`). No polyfills.
