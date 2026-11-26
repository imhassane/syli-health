# Syli Health

Medical software suite for West Africa (Guinea first). First product: Syli Pharmacie.
Architecture and product decisions (French) live in the claude.ai project « Suite Médicale ».

## Layout

- `packages/ui` (`@syli/ui`): Preact + TypeScript components, themed only through `--sy-*` CSS variables (`src/foundations/tokens.css`).
- `apps/web`: the light client, a PWA (vite-plugin-pwa). `apps/desktop`: the heavy client, Tauri 2 around the same build (`frontendDist: ../../web/dist`); no service worker inside Tauri (`__TAURI_INTERNALS__`).

## Rules

- Code, comments and test names in English; user-facing text in French (Arabic to come: logical CSS only, `.sy-ltr` for amounts, codes and phone numbers).
- Preact, not React (bundle size on African mobile networks); keep plain hooks and JSX so a move to React stays cheap.
- Colors only from tokens, declared with `light-dark()` on `:root, [data-theme]`; `data-theme="light|dark"` forces a scheme. Never a hard-coded color in a component.
- Native HTML first: `<dialog>` with `showModal()` (a bottom drawer below 40rem), `popover="manual"` for toasts (feature-detected), real `<table>` with sort buttons in `<th>`, radios and checkboxes.
- Layout by container queries; media queries only for the input device (`pointer: coarse`: 44px targets) and user settings.
- Fields: errors after interaction only (`:user-invalid`), one polite announcer (`announce()`).
- Clinical alerts (interactions, allergies) are never toasts: `ClinicalAlert` stays until handled.
- Every component ships with stories, Vitest tests (role and name queries, axe) and passes `e2e/stories.spec.js` (axe in Chromium, light and dark, phone, tablet, computer). Target: WCAG 2.2 AA.

## Browser support

- Heavy client: WebView2 (Windows, evergreen Chromium), WKWebView (macOS 13+), WebKitGTK 4.1 (Linux).
- Light client: current Chrome for Android, Safari for iOS 16.4+, current desktop browsers.
- **Policy:** Baseline Widely available features freely. Newly available ones only when feature-detected, with a fallback of at most 20 lines and no dependency (e.g. `closedby`, `popover`, `ariaNotify`). No polyfills.
