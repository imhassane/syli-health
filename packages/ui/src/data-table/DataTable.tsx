import type { ComponentChildren } from "preact";
import { useEffect, useId, useMemo, useRef, useState } from "preact/hooks";
import { Button } from "../button/Button.tsx";
import { SearchField } from "../field/Field.tsx";
import {
  FilterPills,
  type FilterOption,
} from "../filter-pills/FilterPills.tsx";
import { Icon } from "../icon/Icon.tsx";
import type {
  DataSource,
  SortDirection,
  TablePage,
  TableQuery,
} from "./source.ts";

export type Column<Row> = {
  key: string;
  header: string;
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
};

type State<Row> =
  | { status: "loading"; page?: TablePage<Row> }
  | { status: "ready"; page: TablePage<Row> }
  | { status: "error"; page?: TablePage<Row>; message: string };

const plural = (n: number, one: string, many: string) =>
  `${n.toLocaleString("fr")} ${n > 1 ? many : one}`;

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
  pageSize = 8,
  emptyText = "Aucun résultat.",
  initialQuery,
  onQueryChange,
  debounce = 250,
}: DataTableProps<Row>) {
  const id = useId();
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
            page.total === 0
              ? emptyText
              : plural(page.total, "résultat", "résultats"),
            sorted
              ? `triés par ${sorted.header}, ${query.sort?.direction === "ascending" ? "ordre croissant" : "ordre décroissant"}`
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
          message: "Les données n’ont pas pu être chargées.",
        }));
        setStatus("Erreur : les données n’ont pas pu être chargées.");
      },
    );
    return () => controller.abort();
  }, [query, source, attempt]);

  const page = state.page;
  const pages = page ? Math.max(1, Math.ceil(page.total / query.pageSize)) : 1;
  const firstLoad = state.status === "loading" && !page;

  const sortable = columns.filter((column) => column.sortable);
  const sortBy = (key: string) =>
    setQuery((q) => {
      const direction: SortDirection =
        q.sort?.key === key && q.sort.direction === "ascending"
          ? "descending"
          : "ascending";
      return { ...q, sort: { key, direction }, page: 1 };
    });

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
          <FilterPills
            label={filters.label}
            options={filters.options}
            value={query.filter}
            onChange={(filter) => setQuery((q) => ({ ...q, filter, page: 1 }))}
          />
        )}
        {sortable.length > 0 && (
          // Rows become cards on narrow screens and the headers go: the sort
          // moves to a native select. Hidden (display: none) on wide ones.
          <label class="sy-table__sortpick">
            <span class="sy-table__sortpick-label">Trier par</span>
            <span class="sy-select">
              <select
                class="sy-input sy-select__control"
                value={
                  query.sort ? `${query.sort.key}:${query.sort.direction}` : ""
                }
                onChange={(event) => {
                  const [key, direction] = (
                    event.currentTarget as HTMLSelectElement
                  ).value.split(":");
                  setQuery((q) => ({
                    ...q,
                    sort: key
                      ? { key, direction: direction as SortDirection }
                      : undefined,
                    page: 1,
                  }));
                }}
              >
                <option value="">Ordre par défaut</option>
                {sortable.flatMap((column) => [
                  <option
                    key={`${column.key}:a`}
                    value={`${column.key}:ascending`}
                  >
                    {column.header} (croissant)
                  </option>,
                  <option
                    key={`${column.key}:d`}
                    value={`${column.key}:descending`}
                  >
                    {column.header} (décroissant)
                  </option>,
                ])}
              </select>
              <Icon name="chevronDown" size={18} />
            </span>
          </label>
        )}
      </div>

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
            Réessayer
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
        <table
          class="sy-table__table"
          data-loading={state.status === "loading" || undefined}
        >
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
            {firstLoad &&
              Array.from({ length: Math.min(query.pageSize, 4) }, (_, i) => (
                <tr
                  key={`skeleton-${i}`}
                  class="sy-table__skeleton"
                  aria-hidden="true"
                >
                  {columns.map((column) => (
                    <td key={column.key}>
                      <span class="sy-skeleton" />
                    </td>
                  ))}
                </tr>
              ))}
            {page?.rows.map((row) => (
              <tr key={rowKey(row)}>
                {columns.map((column) =>
                  column.rowHeader ? (
                    <th
                      scope="row"
                      key={column.key}
                      data-label={labels[column.key]}
                      data-align={column.align}
                    >
                      {column.cell(row)}
                    </th>
                  ) : (
                    <td
                      key={column.key}
                      data-label={labels[column.key]}
                      data-align={column.align}
                    >
                      {column.cell(row)}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {state.status === "ready" && page?.total === 0 && (
          <p class="sy-table__empty">{emptyText}</p>
        )}
      </div>

      {page && page.total > query.pageSize && (
        <nav class="sy-table__pages" aria-label={`Pages de ${caption}`}>
          <Button
            size="sm"
            icon="chevronStart"
            flipIcon
            disabled={query.page <= 1}
            onClick={() => setQuery((q) => ({ ...q, page: q.page - 1 }))}
          >
            Précédente
          </Button>
          <span class="sy-num">
            Page {query.page} sur {pages}
          </span>
          <Button
            size="sm"
            disabled={query.page >= pages}
            onClick={() => setQuery((q) => ({ ...q, page: q.page + 1 }))}
          >
            Suivante
          </Button>
        </nav>
      )}
    </div>
  );
}
