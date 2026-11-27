import type { ComponentChildren } from "preact";
import { useEffect, useId, useMemo, useRef, useState } from "preact/hooks";
import { Button } from "../button/Button.tsx";
import { SearchField, Select } from "../field/Field.tsx";
import { Modal } from "../modal/Modal.tsx";
import {
  FilterPills,
  type FilterOption,
} from "../filter-pills/FilterPills.tsx";
import { Icon } from "../icon/Icon.tsx";
import { useI18n } from "../i18n/I18n.tsx";
import { Skeleton } from "../skeleton/Skeleton.tsx";
import type {
  DataSource,
  SortDirection,
  TablePage,
  TableQuery,
} from "./source.ts";

export type Column<Row> = {
  key: string;
  header: string;
  /** The language of this column's data when it differs from the page's
   * (drug names kept in French on a Chinese interface): read in its own
   * language by screen readers (RGAA 8.7). */
  lang?: string;
  cell: (row: Row) => ComponentChildren;
  sortable?: boolean;
  /** Numbers and amounts: aligned to the end. */
  align?: "start" | "end";
  /** The cell that names the row (a patient, a medicine): a row header. */
  rowHeader?: boolean;
};

export type DataTableProps<Row> = {
  /** Its visible title, also the name of the table and of its scroll region. */
  caption: string;
  columns: Column<Row>[];
  source: DataSource<Row>;
  rowKey: (row: Row) => string;
  searchLabel: string;
  searchPlaceholder?: string;
  filters?: { label: string; options: FilterOption<string>[] };
  /** Buttons at the end of the toolbar: "Inventaire", "+ Réception". */
  actions?: ComponentChildren;
  pageSize?: number;
  emptyText?: string;
  initialQuery?: Partial<TableQuery>;
  /** Called with each new query: to keep it in the URL. */
  onQueryChange?: (query: TableQuery) => void;
  /** Waits this long after the last keystroke before searching. */
  debounce?: number;
  /**
   * Opens a row: its row header becomes a button, and a click anywhere on
   * the row opens it too. Give rowHref instead when a row is a page.
   */
  onOpen?: (row: Row) => void;
  /** Opens a row at an address: its row header becomes a link. */
  rowHref?: (row: Row) => string;
};

// Clicks on these keep their own meaning inside a row that opens.
const interactive = "a, button, input, select, textarea, label, summary, [role=button], [tabindex]";

type State<Row> =
  | { status: "loading"; page?: TablePage<Row> }
  | { status: "ready"; page: TablePage<Row> }
  | { status: "error"; page?: TablePage<Row>; message: string };


/**
 * A data table with a search, filter pills, sortable columns and pages, over
 * any source: an array in memory or an API (each new query cancels the one
 * before). Accessible: a real <table> with a caption and column headers, sort
 * buttons inside the headers with aria-sort, one status line announcing the
 * results, a keyboard-scrollable region. On a narrow container its rows
 * become cards, each cell labelled by its column.
 */
export function DataTable<Row>({
  caption,
  columns,
  source,
  rowKey,
  searchLabel,
  searchPlaceholder,
  filters,
  actions,
  pageSize = 10,
  emptyText,
  initialQuery,
  onQueryChange,
  debounce = 250,
  onOpen,
  rowHref,
}: DataTableProps<Row>) {
  const id = useId();
  const { t, plural, number } = useI18n();
  const noResults = emptyText ?? t("noResults");
  const [typed, setTyped] = useState(initialQuery?.search ?? "");
  const [query, setQuery] = useState<TableQuery>({
    search: initialQuery?.search ?? "",
    filter: initialQuery?.filter ?? filters?.options[0]?.value ?? "all",
    sort: initialQuery?.sort,
    page: initialQuery?.page ?? 1,
    pageSize,
  });
  const [state, setState] = useState<State<Row>>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState("");

  // The search waits for a pause in typing, and goes back to page 1.
  useEffect(() => {
    if (typed === query.search) return;
    const timer = setTimeout(
      () => setQuery((q) => ({ ...q, search: typed, page: 1 })),
      debounce,
    );
    return () => clearTimeout(timer);
  }, [typed]);

  const changed = useRef(onQueryChange);
  changed.current = onQueryChange;

  useEffect(() => {
    const controller = new AbortController();
    setState((before) => ({ status: "loading", page: before.page }));
    changed.current?.(query);
    source(query, controller.signal).then(
      (page) => {
        if (controller.signal.aborted) return;
        setState({ status: "ready", page });
        const sorted =
          query.sort && columns.find((c) => c.key === query.sort?.key);
        setStatus(
          [
            page.total === 0 ? noResults : plural("results", page.total),
            sorted
              ? t("sortedBy", {
                  column: String(sorted.header),
                  order: t(query.sort?.direction === "ascending" ? "ascendingOrder" : "descendingOrder"),
                })
              : "",
          ]
            .filter(Boolean)
            .join(", "),
        );
      },
      (error: unknown) => {
        if (
          controller.signal.aborted ||
          (error as Error)?.name === "AbortError"
        )
          return;
        setState((before) => ({
          status: "error",
          page: before.page,
          message: t("loadError"),
        }));
        setStatus(t("loadErrorStatus"));
      },
    );
    return () => controller.abort();
  }, [query, source, attempt]);

  const page = state.page;
  const pages = page ? Math.max(1, Math.ceil(page.total / query.pageSize)) : 1;
  // Skeleton rows while a page loads, shown only past a short wait: a quick
  // answer (local data, a cached API) goes from one page to the next without
  // flashing them.
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (state.status !== "loading") return setSlow(false);
    const timer = setTimeout(() => setSlow(true), page ? 150 : 0);
    return () => clearTimeout(timer);
  }, [state.status]);
  const skeleton = state.status === "loading" && (slow || !page);
  const shown = skeleton ? [] : (page?.rows ?? []);
  const empty = state.status === "ready" && page?.total === 0;
  // Always pageSize rows high: blank rows (dashed) fill the rest, so the
  // frame keeps its size from one page, filter or state to the next.
  const fillers = skeleton ? 0 : Math.max(0, query.pageSize - shown.length - (empty ? 1 : 0));

  const sortable = columns.filter((column) => column.sortable);
  const sortBy = (key: string) =>
    setQuery((q) => {
      const direction: SortDirection =
        q.sort?.key === key && q.sort.direction === "ascending"
          ? "descending"
          : "ascending";
      return { ...q, sort: { key, direction }, page: 1 };
    });

  const [refining, setRefining] = useState(false);
  const opens = Boolean(onOpen || rowHref);
  if (import.meta.env?.DEV && columns.length > 5) {
    // A table shows what decides at a glance; the rest belongs to the opened row.
    console.warn(`DataTable "${caption}": ${columns.length} columns, 5 at most. Put the rest in the opened row (onOpen).`);
  }
  const active =
    (filters && query.filter !== filters.options[0]?.value ? 1 : 0) + (query.sort ? 1 : 0);

  const labels = useMemo(
    () => Object.fromEntries(columns.map((c) => [c.key, c.header])),
    [columns],
  );

  return (
    <div class="sy-table">
      <div class="sy-table__head">
        <h2 class="sy-table__title" id={`${id}-caption`}>
          {caption}
        </h2>
        {actions && <div class="sy-table__actions">{actions}</div>}
      </div>

      <div class="sy-table__toolbar">
        <SearchField
          class="sy-table__search"
          label={searchLabel}
          placeholder={searchPlaceholder}
          value={typed}
          onInput={(event) =>
            setTyped((event.currentTarget as HTMLInputElement).value)
          }
        />
        {filters && (
          <div class="sy-table__pills">
            <FilterPills
              label={filters.label}
              options={filters.options}
              value={query.filter}
              onChange={(filter) => setQuery((q) => ({ ...q, filter, page: 1 }))}
            />
          </div>
        )}
        {(filters || sortable.length > 0) && (
          // Narrow frames: filters and sort move to a drawer, so nothing wraps.
          <Button class="sy-table__more" icon="filter" onClick={() => setRefining(true)}>
            {t("filters")}
            {active > 0 && " "}
            {active > 0 && (
              <span class="sy-table__badge">
                {number(active)}
                <span class="sy-visually-hidden">{plural("activeSuffix", active)}</span>
              </span>
            )}
          </Button>
        )}
      </div>

      <Modal
        open={refining}
        onClose={() => setRefining(false)}
        title={t("filterTitle", { caption })}
        footer={
          <Button variant="primary" block onClick={() => setRefining(false)}>
            {page ? plural("showResults", page.total) : t("showAllResults")}
          </Button>
        }
      >
        <div class="sy-table__refine">
          {filters && (
            <fieldset class="sy-choices">
              <legend class="sy-choices__legend">{filters.label}</legend>
              {filters.options.map((option) => (
                <label class="sy-choices__option" key={option.value}>
                  <input
                    type="radio"
                    name={`${id}-filter`}
                    value={option.value}
                    checked={query.filter === option.value}
                    onChange={() => setQuery((q) => ({ ...q, filter: option.value, page: 1 }))}
                  />
                  <span>{option.label}</span>
                  {option.count !== undefined && <span class="sy-choices__count sy-num">{option.count}</span>}
                </label>
              ))}
            </fieldset>
          )}
          {sortable.length > 0 && (
            <Select
              label={t("sortBy")}
              value={query.sort ? `${query.sort.key}:${query.sort.direction}` : ""}
              onChange={(event) => {
                const [key, direction] = (event.currentTarget as HTMLSelectElement).value.split(":");
                setQuery((q) => ({
                  ...q,
                  sort: key ? { key, direction: direction as SortDirection } : undefined,
                  page: 1,
                }));
              }}
            >
              <option value="">{t("defaultOrder")}</option>
              {sortable.flatMap((column) => [
                <option key={`${column.key}:a`} value={`${column.key}:ascending`}>
                  {t("columnAscending", { column: String(column.header) })}
                </option>,
                <option key={`${column.key}:d`} value={`${column.key}:descending`}>
                  {t("columnDescending", { column: String(column.header) })}
                </option>,
              ])}
            </Select>
          )}
        </div>
      </Modal>

      {/* One status line for the results: never a live table. */}
      <p class="sy-visually-hidden" role="status">
        {status}
      </p>

      {state.status === "error" && (
        <div class="sy-table__error" role="alert">
          <Icon name="alert" size={20} />
          <span>{state.message}</span>
          <Button
            size="sm"
            icon="refresh"
            onClick={() => setAttempt((n) => n + 1)}
          >
            {t("retry")}
          </Button>
        </div>
      )}

      <div
        class="sy-table__scroll"
        role="region"
        tabIndex={0}
        aria-labelledby={`${id}-caption`}
        aria-busy={state.status === "loading" || undefined}
      >
        <table class="sy-table__table">
          <caption class="sy-visually-hidden">{caption}</caption>
          <thead>
            <tr>
              {columns.map((column) => {
                const sorted =
                  query.sort?.key === column.key
                    ? query.sort.direction
                    : undefined;
                return (
                  <th
                    scope="col"
                    key={column.key}
                    aria-sort={sorted}
                    data-align={column.align}
                  >
                    {column.sortable ? (
                      <button
                        type="button"
                        class="sy-table__sort"
                        onClick={() => sortBy(column.key)}
                      >
                        {column.header}
                        <Icon
                          name={
                            sorted === "ascending"
                              ? "sortUp"
                              : sorted === "descending"
                                ? "sortDown"
                                : "sort"
                          }
                          size={16}
                        />
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {skeleton &&
              Array.from({ length: query.pageSize }, (_, i) => (
                <tr key={`skeleton-${i}`} class="sy-table__skeleton" aria-hidden="true">
                  {columns.map((column) => (
                    <td key={column.key} data-align={column.align}>
                      <Skeleton />
                    </td>
                  ))}
                </tr>
              ))}
            {shown.map((row) => (
              <tr
                key={rowKey(row)}
                class={opens ? "sy-table__row--opens" : undefined}
                // The pointer's shortcut to the row header's link or button,
                // which keyboards and screen readers use.
                onClick={
                  opens
                    ? (event) => {
                        const target = event.target as HTMLElement;
                        const own = target.closest(interactive);
                        if ((own && event.currentTarget.contains(own)) || String(getSelection() ?? "") !== "") return;
                        (event.currentTarget.querySelector(".sy-table__open") as HTMLElement | null)?.click();
                      }
                    : undefined
                }
              >
                {columns.map((column) =>
                  column.rowHeader ? (
                    <th scope="row" key={column.key} data-label={labels[column.key]} data-align={column.align} lang={column.lang}>
                      {rowHref ? (
                        <a class="sy-table__open" href={rowHref(row)}>
                          {column.cell(row)}
                        </a>
                      ) : onOpen ? (
                        <button type="button" class="sy-table__open" onClick={() => onOpen(row)}>
                          {column.cell(row)}
                        </button>
                      ) : (
                        column.cell(row)
                      )}
                    </th>
                  ) : (
                    <td key={column.key} data-label={labels[column.key]} data-align={column.align} lang={column.lang}>
                      {column.cell(row)}
                    </td>
                  ),
                )}
              </tr>
            ))}
            {empty && (
              <tr class="sy-table__empty">
                <td colSpan={columns.length}>{noResults}</td>
              </tr>
            )}
            {Array.from({ length: fillers }, (_, i) => (
              <tr key={`filler-${i}`} class="sy-table__filler" aria-hidden="true">
                <td colSpan={columns.length} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Always there, so the frame never changes height; buttons are
          disabled when there is nowhere to go. */}
      {(
        <nav class="sy-table__pages" aria-label={t("pagesOf", { caption })}>
          <Button
            size="sm"
            icon="chevronStart"
            flipIcon
            disabled={query.page <= 1}
            onClick={() => setQuery((q) => ({ ...q, page: q.page - 1 }))}
          >
            <span class="sy-table__page-word">{t("previous")}</span>
          </Button>
          <span class="sy-num">
            {t("pageOf", { page: number(query.page), pages: number(pages) })}
          </span>
          <Button
            size="sm"
            disabled={query.page >= pages}
            onClick={() => setQuery((q) => ({ ...q, page: q.page + 1 }))}
            icon="chevronEnd"
            flipIcon
            class="sy-table__next"
          >
            <span class="sy-table__page-word">{t("next")}</span>
          </Button>
        </nav>
      )}
    </div>
  );
}
