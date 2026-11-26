import { render, screen, waitFor, within } from "@testing-library/preact";
import { describe, expect, test } from "vitest";
import { DataTable, type Column } from "../data-table/DataTable.tsx";
import { stock, type StockItem } from "../data-table/fixtures.ts";
import { localSource } from "../data-table/source.ts";
import { PatientBanner } from "../patient-banner/PatientBanner.tsx";
import { ClinicalAlert } from "../clinical-alert/ClinicalAlert.tsx";
import { Toaster } from "../toast/Toaster.tsx";
import { I18nProvider } from "./I18n.tsx";
import type { Locale } from "./locales.ts";
import { violations } from "../testing.tsx";

const columns: Column<StockItem>[] = [
  { key: "dci", header: "Médicament", cell: (r) => r.dci, rowHeader: true, lang: "fr" },
  { key: "qty", header: "Stock", cell: (r) => String(r.qty), align: "end" },
];

const table = (locale: Locale) =>
  render(
    <I18nProvider locale={locale}>
      <DataTable caption="Stock" columns={columns} source={localSource(stock, { text: (r) => r.dci })} rowKey={(r) => r.id} searchLabel="Rechercher" />
    </I18nProvider>,
  );

describe("components speak the page's language", () => {
  test.each([
    ["en", "Next", "Page 1 of 2"],
    ["zh", "下一页", "第 1 页，共 2 页"],
    ["hi", "अगला", "पृष्ठ 1 / 2"],
    ["ar", "التالي", "الصفحة 1 من 2"],
  ] as const)("%s: the table's pagination", async (locale, next, page) => {
    const { container } = table(locale);
    await waitFor(() => expect(screen.getAllByRole("rowheader")).toHaveLength(10));
    const nav = screen.getByRole("navigation");
    expect(within(nav).getByRole("button", { name: next })).toBeTruthy();
    expect(within(nav).getByText(page)).toBeTruthy();
    expect(await violations(container)).toEqual([]);
  });

  test("data in another language than the page keeps its own lang", async () => {
    table("zh");
    await waitFor(() => expect(screen.getAllByRole("rowheader")[0].getAttribute("lang")).toBe("fr"));
  });

  test("Arabic: the patient's age in its plural form, Western digits", () => {
    render(
      <I18nProvider locale="ar">
        <PatientBanner name="Ibrahima Sow" sex="M" birthDate="1964-03-14" recordId="SH-000482" today={new Date("2026-11-25T12:00:00")} />
      </I18nProvider>,
    );
    expect(screen.getByRole("region", { name: "المريض: Ibrahima Sow" }).textContent).toContain("62 سنة");
  });

  test("Hindi: the interaction's level and title", () => {
    render(
      <I18nProvider locale="hi">
        <ClinicalAlert severity="caution" title="ciprofloxacine + glibenclamide" reason="…" action="…" />
      </I18nProvider>,
    );
    expect(screen.getByRole("region", { name: "दवाओं की पारस्परिक क्रिया: ciprofloxacine + glibenclamide" })).toBeTruthy();
    expect(screen.getByText("सावधानी से प्रयोग करें")).toBeTruthy();
  });

  test("Chinese: the toasts' region", () => {
    render(
      <I18nProvider locale="zh">
        <Toaster />
      </I18nProvider>,
    );
    expect(screen.getByRole("region", { name: "通知" })).toBeTruthy();
  });
});
