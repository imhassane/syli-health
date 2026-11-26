import preact from "@preact/preset-vite";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// One build, two ways out: installed from the browser (PWA, light client),
// or embedded by Tauri (apps/desktop, heavy client), which skips the service
// worker (see src/main.tsx).
export default defineConfig({
  plugins: [
    preact(),
    VitePWA({
      registerType: "prompt",
      injectRegister: false,
      includeAssets: ["icon.svg"],
      manifest: {
        name: "Syli Pharmacie",
        short_name: "Syli",
        description: "Ventes, stock et réservations de la pharmacie, même sans réseau.",
        lang: "fr",
        dir: "auto",
        start_url: "/",
        display: "standalone",
        background_color: "#f4f8fb",
        theme_color: "#1a66c9",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          { src: "icon.svg", sizes: "any", type: "image/svg+xml" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        // Fonts in scripts not written here load on demand (unicode-range):
        // precached, they would cost every phone their megabytes.
        globIgnores: ["**/*{vietnamese,cyrillic,greek}*"],
        navigateFallback: "/index.html",
        // The API is never served from the cache: the app keeps its own
        // offline data (local SQLite, synchronised in the background).
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
  server: { port: 5180, proxy: { "/api": process.env.SYLI_API ?? "http://127.0.0.1:4000" } },
  build: { target: "es2022" },
});
