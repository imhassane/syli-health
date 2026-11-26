import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  use: { baseURL: "http://localhost:4173", locale: "fr-FR", launchOptions: { executablePath: process.env.CHROME_PATH } },
  projects: [
    { name: "telephone", use: { ...devices["Pixel 7"] } },
    { name: "tablette", use: { viewport: { width: 820, height: 1180 }, hasTouch: true, isMobile: true } },
    { name: "ordinateur", use: { viewport: { width: 1280, height: 860 } } },
  ],
  webServer: { command: "pnpm preview", port: 4173, reuseExistingServer: true },
});
