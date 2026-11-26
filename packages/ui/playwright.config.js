// The built catalog in Chromium: axe on every story (contrast included, which
// jsdom cannot compute) in light and dark, on a phone, a tablet and a computer;
// then the behaviours jsdom cannot run (native dialog, drawer, toasts).
import { defineConfig, devices } from "@playwright/test";

const chrome = process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {};

export default defineConfig({
  testDir: "e2e",
  reporter: [["list"]],
  workers: 4,
  use: { baseURL: "http://localhost:6007", launchOptions: chrome },
  projects: [
    { name: "telephone", use: { ...devices["Pixel 7"], launchOptions: chrome } },
    { name: "tablette", use: { viewport: { width: 820, height: 1180 }, hasTouch: true, isMobile: true, launchOptions: chrome } },
    { name: "ordinateur", use: { viewport: { width: 1280, height: 860 }, launchOptions: chrome } },
  ],
  webServer: {
    command: "pnpm exec http-server storybook-static -p 6007 -s",
    url: "http://localhost:6007",
    reuseExistingServer: true,
  },
});
