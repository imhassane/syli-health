import { render, screen, waitFor, within } from "@testing-library/preact";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { storiesOf, story, violations } from "../testing.tsx";
import * as stories from "./DataTable.stories.tsx";
import { DataTable, type Column } from "./DataTable.tsx";
import { stock, type StockItem } from "./fixtures.ts";
import { fold, localSource, restSource, type DataSource } from "./source.ts";

const columns: Column<StockItem>[] = [
  { key: "dci", header: "Médicament", cell: (r) => r.dci, sortable: true, rowHeader: true },
  { key: "qty", header: "Stock", cell: (r) => String(r.qty), sortable: true, align: "end" },
];

const rowNames = () => screen.getAllByRole("rowheader").map((cell) => cell.textContent);

describe("DataTable", () => {
  test.each(storiesOf(stories).filter(([name]) => name !== "FromApi"))("story %s has no axe violation", async (_name, Story) => {
    const { container } = render(<Story />);
    await new Promise((r) => setTimeout(r, 20));
    expect(await violations(container)).toEqual([]);
  });

  test("a captioned table in a named, keyboard-scrollable region", async () => {
    render(story(stories, "Stock")());
    expect(await screen.findByRole("table", { name: "Produits en stock" })).toBeTruthy();
    const region = screen.getByRole("region", { name: "Produits en stock" });
    expect(region.getAttribute("tabindex")).toBe("0");
    await waitFor(() => expect(rowNames()).toHaveLength(10));
  });

  test("search: every word, any order, accents ignored; announced in one status", async () => {
    const user = userEvent.setup();
    render(<DataTable caption="Stock" columns={columns} source={localSource(stock, { text: (r) => `${r.dci} ${r.brand}` })} rowKey={(r) => r.id} searchLabel="Rechercher" debounce={0} />);
    await waitFor(() => expect(rowNames().length).toBeGreaterThan(0));
    await user.type(screen.getByRole("searchbox", { name: "Rechercher" }), "comprime 500 cipro");
    await waitFor(() => expect(rowNames()).toEqual(["Ciprofloxacine 500 mg, comprimé"]));
    expect(screen.getByRole("status").textContent).toBe("1 résultat");
  });

  test("sorting: a button in the header, aria-sort on that header only", async () => {
    const user = userEvent.setup();
    render(<DataTable caption="Stock" columns={columns} source={localSource(stock, { text: (r) => r.dci })} rowKey={(r) => r.id} searchLabel="Rechercher" pageSize={20} />);
    await waitFor(() => expect(rowNames().length).toBe(14));
    await user.click(screen.getByRole("button", { name: "Stock" }));
    await waitFor(() => expect(rowNames()[0]).toBe("Amoxicilline 500 mg, gélule"));
    const headers = screen.getAllByRole("columnheader");
    expect(headers.map((h) => h.getAttribute("aria-sort"))).toEqual([null, "ascending"]);
    await user.click(screen.getByRole("button", { name: "Stock" }));
    await waitFor(() => expect(rowNames()[0]).toBe("Paracétamol 1 g, comprimé"));
    expect(screen.getAllByRole("columnheader")[1].getAttribute("aria-sort")).toBe("descending");
    expect(screen.getByRole("status").textContent).toContain("triés par Stock, ordre décroissant");
  });

  test("filters and pages", async () => {
    const user = userEvent.setup();
    render(story(stories, "Stock")());
    await waitFor(() => expect(rowNames()).toHaveLength(10));
    const pages = screen.getByRole("navigation", { name: "Pages de Produits en stock" });
    expect(within(pages).getByText("Page 1 sur 2")).toBeTruthy();
    await user.click(within(pages).getByRole("button", { name: "Suivante" }));
    await waitFor(() => expect(rowNames()).toHaveLength(4));
    await user.click(screen.getByRole("button", { name: "Ruptures" }));
    await waitFor(() => expect(rowNames()).toEqual(["Amoxicilline 500 mg, gélule"]));
    // The pagination stays, so the frame keeps its height; nowhere to go.
    expect(within(pages).getByText("Page 1 sur 1")).toBeTruthy();
    expect((within(pages).getByRole("button", { name: "Suivante" }) as HTMLButtonElement).disabled).toBe(true);
  });

  const bodyRows = (container: Element) => [...container.querySelectorAll("tbody tr")];

  test("always ten rows high: blank rows (hidden from screen readers) fill a short page", async () => {
    const { container } = render(<DataTable caption="Stock" columns={columns} source={localSource(stock.slice(0, 3), { text: (r) => r.dci })} rowKey={(r) => r.id} searchLabel="Rechercher" />);
    await waitFor(() => expect(rowNames()).toHaveLength(3));
    const rows = bodyRows(container);
    expect(rows).toHaveLength(10);
    expect(rows.filter((row) => row.classList.contains("sy-table__filler") && row.getAttribute("aria-hidden") === "true")).toHaveLength(7);
    // Assistive technologies see only the real rows (and the header row).
    expect(screen.getAllByRole("row")).toHaveLength(4);
  });

  test("empty: one row says so, the frame keeps its ten rows", async () => {
    const { container } = render(<DataTable caption="Stock" columns={columns} source={localSource([] as StockItem[], { text: (r) => r.dci })} rowKey={(r) => r.id} searchLabel="Rechercher" emptyText="Aucun produit." />);
    expect(await screen.findByRole("cell", { name: "Aucun produit." })).toBeTruthy();
    expect(bodyRows(container)).toHaveLength(10);
  });

  test("loading: ten skeleton rows, the region busy; never a spinner", async () => {
    const never: DataSource<StockItem> = () => new Promise(() => {});
    const { container } = render(<DataTable caption="Stock" columns={columns} source={never} rowKey={(r) => r.id} searchLabel="Rechercher" />);
    await waitFor(() => expect(container.querySelectorAll(".sy-table__skeleton")).toHaveLength(10));
    expect(container.querySelectorAll(".sy-table__skeleton .sy-skeleton")).toHaveLength(20);
    expect(screen.getByRole("region", { name: "Stock" }).getAttribute("aria-busy")).toBe("true");
    expect(container.querySelector(".sy-button__spinner")).toBeNull();
  });

  test("a quick answer never flashes the skeleton between pages", async () => {
    const user = userEvent.setup();
    const { container } = render(story(stories, "Stock")());
    await waitFor(() => expect(rowNames()).toHaveLength(10));
    const seen: number[] = [];
    const observer = new MutationObserver(() => seen.push(container.querySelectorAll(".sy-table__skeleton").length));
    observer.observe(container, { childList: true, subtree: true });
    await user.click(screen.getByRole("button", { name: "Suivante" }));
    await waitFor(() => expect(rowNames()).toHaveLength(4));
    observer.disconnect();
    expect(Math.max(0, ...seen)).toBe(0);
  });

  test("the filters drawer: radios and the sort, its button counts what is active", async () => {
    const user = userEvent.setup();
    render(story(stories, "Stock")());
    await waitFor(() => expect(rowNames()).toHaveLength(10));
    await user.click(screen.getByRole("button", { name: "Filtres" }));
    const drawer = await screen.findByRole("dialog", { name: "Filtrer : Produits en stock" });
    await user.click(within(drawer).getByRole("radio", { name: "Ruptures" }));
    await waitFor(() => expect(rowNames()).toEqual(["Amoxicilline 500 mg, gélule"]));
    await user.selectOptions(within(drawer).getByRole("combobox", { name: "Trier par" }), "qty:descending");
    await user.click(within(drawer).getByRole("button", { name: "Voir 1 résultat" }));
    // Its name is "Filtres 2 actifs" (checked in Chromium, e2e/behaviour.spec.js).
    expect(screen.getByRole("button", { name: /^Filtres/ }).textContent).toBe("Filtres 2 actifs");
  });

  test("an error says so and offers to try again", async () => {
    const user = userEvent.setup();
    let calls = 0;
    const flaky: DataSource<StockItem> = async () => {
      calls++;
      if (calls === 1) throw new Error("offline");
      return { rows: stock.slice(0, 2), total: 2 };
    };
    render(<DataTable caption="Stock" columns={columns} source={flaky} rowKey={(r) => r.id} searchLabel="Rechercher" />);
    expect((await screen.findByRole("alert")).textContent).toContain("n’ont pas pu être chargées");
    await user.click(screen.getByRole("button", { name: "Réessayer" }));
    await waitFor(() => expect(rowNames()).toHaveLength(2));
    expect(screen.queryByRole("alert")).toBeNull();
  });

  test("a newer query cancels the one before", async () => {
    const signals: AbortSignal[] = [];
    const slow: DataSource<StockItem> = (_query, signal) => {
      signals.push(signal);
      return new Promise(() => {});
    };
    const user = userEvent.setup();
    render(<DataTable caption="Stock" columns={columns} source={slow} rowKey={(r) => r.id} searchLabel="Rechercher" debounce={0} />);
    await user.type(screen.getByRole("searchbox"), "a");
    await waitFor(() => expect(signals.length).toBe(2));
    expect(signals[0].aborted).toBe(true);
    expect(signals[1].aborted).toBe(false);
  });
});

describe("opening a row", () => {
  test("its row header is a button; a click anywhere on the row opens it", async () => {
    const user = userEvent.setup();
    const opened: string[] = [];
    const { container } = render(
      <DataTable caption="Stock" columns={columns} source={localSource(stock.slice(0, 2), { text: (r) => r.dci })} rowKey={(r) => r.id} searchLabel="Rechercher" onOpen={(r) => opened.push(r.dci)} />,
    );
    const open = await screen.findByRole("button", { name: "Amoxicilline 500 mg, gélule" });
    await user.click(open);
    // A click on another cell of the row.
    await user.click(container.querySelectorAll("tbody tr")[1].querySelector("td")!);
    expect(opened).toEqual(["Amoxicilline 500 mg, gélule", "Insuline glargine 100 UI/ml, stylo"]);
  });

  test("with rowHref, the row header is a link", async () => {
    render(<DataTable caption="Stock" columns={columns} source={localSource(stock.slice(0, 1), { text: (r) => r.dci })} rowKey={(r) => r.id} searchLabel="Rechercher" rowHref={(r) => `/stock/${r.id}`} />);
    expect((await screen.findByRole("link", { name: "Amoxicilline 500 mg, gélule" })).getAttribute("href")).toBe("/stock/p1");
  });

  test("the Stock story opens a product's sheet", async () => {
    const user = userEvent.setup();
    render(story(stories, "Stock")());
    await user.click(await screen.findByRole("button", { name: "Paracétamol 1 g, comprimé" }));
    const sheet = await screen.findByRole("dialog", { name: "Paracétamol 1 g, comprimé" });
    expect(within(sheet).getByText("P5521")).toBeTruthy();
  });
});

describe("sources", () => {
  test("fold ignores case and accents", () => {
    expect(fold("Élève Comprimé")).toBe("eleve comprime");
  });

  test("restSource asks the API with the query, and reads data + meta.total", async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify({ data: [{ id: 1 }], meta: { total: 31 } })));
    const source = restSource<{ id: number }>("https://api.example/v1/stock", { fetch: fetch as unknown as typeof globalThis.fetch });
    const signal = new AbortController().signal;
    const page = await source({ search: "amox", filter: "low", sort: { key: "qty", direction: "descending" }, page: 2, pageSize: 8 }, signal);
    expect(page).toEqual({ rows: [{ id: 1 }], total: 31 });
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.example/v1/stock?q=amox&filter=low&sort=qty&order=desc&page=2&per_page=8");
    expect(init.signal).toBe(signal);
  });

  test("restSource fails on an HTTP error", async () => {
    const fetch = vi.fn(async () => new Response("no", { status: 503 }));
    const source = restSource("https://api.example/v1/stock", { fetch: fetch as unknown as typeof globalThis.fetch });
    await expect(source({ search: "", filter: "all", page: 1, pageSize: 8 }, new AbortController().signal)).rejects.toThrow("HTTP 503");
  });
});
