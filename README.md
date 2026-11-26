# Syli Health

Suite logicielle médicale pour l'Afrique de l'Ouest, en commençant par la Guinée.
Premier produit : **Syli Pharmacie** (comptoir, ordonnances, stock, réservations).

## Organisation

```
packages/ui/    @syli/ui : composants Preact accessibles, thème clair et sombre, Storybook
apps/web/       client léger : PWA installable (téléphones, tablettes, ordinateurs)
apps/desktop/   client lourd : le build de apps/web dans une fenêtre Tauri 2 (PC)
```

Le même code d'interface sert les deux clients. La PWA s'installe depuis le
navigateur et fonctionne hors ligne (service worker). Le client lourd embarque
les fichiers dans l'application, sans service worker, et accueillera le
natif : SQLite chiffrée, imprimante de tickets, douchette.

## Commandes

```sh
pnpm install
pnpm storybook                          # catalogue, http://localhost:6006
pnpm --filter @syli/ui test             # types + Vitest (axe dans jsdom)
pnpm --filter @syli/ui test:stories     # axe dans Chromium : chaque story, clair et sombre, téléphone / tablette / ordinateur
pnpm web                                # PWA, http://localhost:5180 (/api relayé à SYLI_API)
pnpm --filter @syli/web build && pnpm --filter @syli/web exec playwright test
pnpm desktop                            # client lourd en développement
pnpm --filter @syli/desktop build       # installeurs : .msi/.exe (Windows), .dmg (macOS), .deb/.AppImage (Linux)
```

Playwright prend Chrome dans `CHROME_PATH` s'il est défini. Le client lourd se
construit sur chaque système pour lui-même (sous Linux : `libwebkit2gtk-4.1-dev`).

## Données

Les tableaux lisent une `DataSource` : `localSource(rows, …)` filtre et trie sur
l'appareil, `restSource(url)` interroge l'API
(`GET url?q=&filter=&sort=&order=asc|desc&page=&per_page=` → `{rows, total}` ou
`{data, meta: {total}}`), chaque nouvelle requête annulant la précédente.
La PWA de démonstration prend l'API quand `VITE_API_URL` est défini.
