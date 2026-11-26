import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

const index = JSON.parse(readFileSync(new URL("../storybook-static/index.json", import.meta.url)));
const stories = Object.values(index.entries).filter((entry) => entry.type === "story");
const tags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

for (const theme of ["light", "dark"]) {
  for (const entry of stories) {
    test(`${entry.id} (${theme})`, async ({ page }) => {
      await page.goto(`/iframe.html?id=${entry.id}&viewMode=story&theme=${theme}`);
      await page.locator("#storybook-root > *").first().waitFor();
      await page.waitForTimeout(350);
      // A loading story shows skeletons on purpose; others settle first.
      await page.waitForLoadState("networkidle");
      const { violations } = await new AxeBuilder({ page }).withTags(tags).analyze();
      expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      // Nothing scrolls sideways.
      const sideways = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
      expect(sideways, "the page scrolls sideways").toBe(false);
    });
  }
}
