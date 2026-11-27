import { expect, test } from "@playwright/test";

const story = (id, theme = "light") => `/iframe.html?id=${id}&viewMode=story&theme=${theme}`;

test.describe("Modal", () => {
  test("opens on the first field, traps focus, Escape gives focus back", async ({ page }) => {
    await page.goto(story("superpositions-modal--closed"));
    const opener = page.getByRole("button", { name: "Réception grossiste" }).first();
    await opener.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.locator(":focus")).toHaveCount(1);
    // A modal <dialog> makes the page inert: Tab goes round the dialog and
    // out to the browser's own interface (body here), never to the page.
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press("Tab");
      const where = await page.evaluate(() => (document.activeElement?.closest("dialog") ? "dialog" : document.activeElement === document.body ? "browser" : "page"));
      expect(where).not.toBe("page");
    }
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
  });

  test("scrolling over it never reaches the page (overscroll contained)", async ({ page }) => {
    await page.goto(story("superpositions-modal--form"));
    await expect(page.getByRole("dialog")).toBeVisible();
    const styles = await page.evaluate(() => {
      const dialog = document.querySelector("dialog");
      const backdrop = getComputedStyle(dialog, "::backdrop");
      return [getComputedStyle(dialog).overscrollBehaviorY, backdrop.overflow, backdrop.overscrollBehaviorY];
    });
    expect(styles).toEqual(["contain", "hidden", "contain"]);
  });
});

test.describe("Drawer on phones", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 1280) >= 640, "phones only");

  test("sits on the bottom edge, full width, and a drag closes it", async ({ page }) => {
    await page.goto(story("superpositions-modal--closed"));
    const opener = page.getByRole("button", { name: "Réception grossiste" }).first();
    await opener.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await page.waitForTimeout(400);
    const box = await dialog.boundingBox();
    const viewport = page.viewportSize();
    expect(Math.round(box.y + box.height)).toBeGreaterThanOrEqual(viewport.height - 1);
    expect(Math.round(box.width)).toBeGreaterThanOrEqual(viewport.width - 1);
    // A finger on the handle, dragged down 160px.
    const h = await page.locator(".sy-modal__handle").boundingBox();
    const cdp = await page.context().newCDPSession(page);
    const x = h.x + h.width / 2;
    const touch = (type, y) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y }] });
    await touch("touchStart", h.y + 4);
    for (let step = 1; step <= 8; step++) await touch("touchMove", h.y + 4 + step * 20);
    await touch("touchEnd");
    await expect(dialog).toBeHidden();
  });
});

test.describe("Tablets and computers", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) < 640, "wide screens only");

  test("the modal is a centred window, not a drawer", async ({ page }) => {
    await page.goto(story("superpositions-modal--form"));
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await page.waitForTimeout(400);
    const box = await dialog.boundingBox();
    const viewport = page.viewportSize();
    expect(box.y).toBeGreaterThan(8);
    expect(box.width).toBeLessThan(viewport.width);
  });
});

test.describe("Toasts", () => {
  test("stack, unfold on hover, Escape closes the newest", async ({ page }) => {
    await page.goto(story("superpositions-toast--stacked"));
    const region = page.getByRole("region", { name: "Notifications" });
    const toasts = region.locator(".sy-toast");
    await expect(toasts.first()).toBeVisible();
    const count = await toasts.count();
    expect(count).toBeGreaterThan(1);
    // The region is as tall as nothing (its toasts are placed absolutely):
    // pointing at a toast enters it.
    await toasts.last().hover();
    await page.waitForTimeout(400);
    const boxes = await Promise.all([count - 1, count - 2].map((i) => toasts.nth(i).boundingBox()));
    expect(Math.abs(boxes[0].y - boxes[1].y)).toBeGreaterThan(30);
    await toasts.last().getByRole("button", { name: /Fermer la notification/ }).focus();
    await page.keyboard.press("Escape");
    await expect(toasts).toHaveCount(count - 1);
  });
});

test.describe("Data table", () => {
  test("search, filter and sort from the keyboard; status said once", async ({ page }) => {
    await page.goto(story("données-datatable--from-api"));
    const table = page.getByRole("table");
    await expect(table.locator("tbody tr").first()).toBeVisible();
    await page.getByRole("searchbox").fill("amox");
    await expect(page.getByRole("status").filter({ hasText: "résultat" })).toContainText(/résultat/);
    const narrow = (page.viewportSize()?.width ?? 1280) < 700;
    if (narrow) {
      // Rows are cards and the pills would not fit: filters and sort in a drawer.
      await expect(page.getByRole("group", { name: "Filtrer le stock" })).toBeHidden();
      await page.getByRole("button", { name: "Filtres" }).click();
      const drawer = page.getByRole("dialog", { name: /Filtrer/ });
      await drawer.getByRole("combobox", { name: "Trier par" }).selectOption({ index: 1 });
      await drawer.getByRole("button", { name: /^Voir/ }).click();
      await expect(drawer).toBeHidden();
      await expect(page.getByRole("button", { name: "Filtres 1 actif" })).toBeVisible();
    } else {
      await expect(page.getByRole("button", { name: "Filtres" })).toBeHidden();
      const sort = page.getByRole("columnheader").getByRole("button").first();
      await sort.focus();
      await page.keyboard.press("Enter");
    }
    await expect(page.locator("th[aria-sort]")).toHaveCount(1);
    await expect(page.getByRole("status").filter({ hasText: "triés par" })).toHaveCount(1);
  });
});

test.describe("Fixed frame", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) < 640, "wide screens only (cards have their own height)");

  test("the table keeps its height from a full page to an empty filter", async ({ page }) => {
    await page.goto(story("données-datatable--stock"));
    const frame = page.locator(".sy-table__scroll");
    await expect(page.locator("tbody th").first()).toBeVisible();
    const full = (await frame.boundingBox()).height;
    await page.getByRole("button", { name: "Ruptures" }).click();
    await expect(page.locator("tbody th")).toHaveCount(1);
    expect(Math.abs((await frame.boundingBox()).height - full)).toBeLessThan(1);
    await page.getByRole("searchbox").fill("zzz");
    await expect(page.getByRole("cell", { name: /Aucun/ })).toBeVisible();
    expect(Math.abs((await frame.boundingBox()).height - full)).toBeLessThan(1);
  });

  test("filter pills never wrap", async ({ page }) => {
    await page.goto(story("données-datatable--stock"));
    const pills = page.locator(".sy-table__pills .sy-filters__pill");
    await expect(pills.first()).toBeVisible();
    const tops = new Set((await pills.evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().top)))));
    expect(tops.size).toBe(1);
  });
});

test.describe("Messenger", () => {
  test("a message goes out, the answer comes in; the composer grows with the text", async ({ page }) => {
    // The story opens Dr Touré's conversation (on a phone too).
    await page.goto(story("messagerie-messenger--live"));
    const field = page.getByRole("textbox", { name: "Message à Dr Aminata Touré" });
    await expect(field).toBeVisible();
    const one = (await field.boundingBox()).height;
    await field.fill("Ligne 1\nLigne 2\nLigne 3");
    expect((await field.boundingBox()).height).toBeGreaterThan(one + 20);
    await field.fill("L’ordonnance de M. Sow est prête.");
    await field.press("Enter");
    const log = page.getByRole("log", { name: "Messages" });
    await expect(log.getByText("L’ordonnance de M. Sow est prête.")).toBeVisible();
    await expect(log.getByText("Entendu, merci.")).toBeVisible({ timeout: 8000 });
    // The newest message is in view.
    await expect(log.getByText("Entendu, merci.")).toBeInViewport();
  });

  test("on a phone: the list, then the conversation, then back", async ({ page, viewport }) => {
    test.skip((viewport?.width ?? 1280) >= 700, "phones only");
    await page.goto(story("messagerie-messenger--on-a-phone"));
    await page.getByRole("button", { name: /Laborex Guinée/ }).click();
    await expect(page.getByRole("heading", { name: "Laborex Guinée" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Conversations" })).toBeHidden();
    await page.getByRole("button", { name: "Retour aux conversations" }).click();
    await expect(page.getByRole("navigation", { name: "Conversations" })).toBeVisible();
  });
});

test.describe("Schedule", () => {
  test("wide: events sit inside their day; narrow: one day at a time", async ({ page, viewport }) => {
    await page.goto(story("planning-schedule--week-view"));
    const wednesday = page.getByRole("region", { name: /mer\. 25/ });
    await expect(wednesday).toBeVisible();
    if ((viewport?.width ?? 1280) >= 700) {
      const day = await wednesday.locator(".sy-schedule__slots").boundingBox();
      for (const box of await wednesday.locator(".sy-schedule__event").evaluateAll((els) => els.map((el) => el.getBoundingClientRect().toJSON()))) {
        expect(box.left).toBeGreaterThanOrEqual(day.x - 1);
        expect(box.right).toBeLessThanOrEqual(day.x + day.width + 1);
      }
    } else {
      await expect(page.getByRole("region", { name: /lun\. 23/ })).toBeHidden();
      await page.getByRole("group", { name: "Jours de la semaine" }).getByRole("button", { name: /^lun\./i }).click();
      await expect(page.getByRole("region", { name: /lun\. 23/ })).toBeVisible();
      await expect(wednesday).toBeHidden();
    }
  });
});
