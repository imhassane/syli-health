import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const tags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

for (const scheme of ["light", "dark"]) {
  test(`home: axe, no sideways scroll (${scheme})`, async ({ page }, info) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto("/");
    await expect(page.getByRole("table")).toBeVisible();
    await expect(page.locator("tbody tr").first()).toBeVisible();
    const { violations } = await new AxeBuilder({ page }).withTags(tags).analyze();
    expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(false);
    await page.screenshot({ path: `test-results/home-${info.project.name}-${scheme}.png`, fullPage: false });
  });
}

test("reception: modal (drawer on phones), axe inside, toast after saving", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Réception" }).click();
  const dialog = page.getByRole("dialog", { name: "Réception grossiste" });
  await expect(dialog).toBeVisible();
  await expect(page.getByLabel("Numéro de bon de livraison")).toBeFocused();
  const { violations } = await new AxeBuilder({ page }).withTags(tags).analyze();
  expect(violations.map((v) => v.id)).toEqual([]);
  await page.getByRole("combobox", { name: "Grossiste", exact: true }).selectOption("Laborex Guinée");
  await page.getByLabel("Numéro de bon de livraison").fill("BL-2291");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("region", { name: "Notifications" })).toContainText("Réception enregistrée");
});

test("the theme chosen stays after a reload", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("radio", { name: "Sombre" }).check();
  await page.reload();
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe("dark");
  await expect(page.getByRole("radio", { name: "Sombre" })).toBeChecked();
});

test("installable: manifest and service worker", async ({ page, request }) => {
  const manifest = await (await request.get("/manifest.webmanifest")).json();
  expect(manifest.display).toBe("standalone");
  expect(manifest.icons.some((i) => i.purpose === "maskable")).toBe(true);
  await page.goto("/");
  const sw = await page.evaluate(async () => (await navigator.serviceWorker.ready).active?.scriptURL);
  expect(sw).toMatch(/sw\.js$/);
});
