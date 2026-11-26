/** What a table asks for: the same shape for a local array or a server API. */
export type SortDirection = "ascending" | "descending";

export type TableQuery = {
  search: string;
  /** The value of the filter pills ("all" for none). */
  filter: string;
  sort?: { key: string; direction: SortDirection };
  /** From 1. */
  page: number;
  pageSize: number;
};

export type TablePage<Row> = { rows: Row[]; total: number };

/** Gives one page of rows. Must honour `signal`: a newer query cancels it. */
export type DataSource<Row> = (query: TableQuery, signal: AbortSignal) => Promise<TablePage<Row>>;

/** Text compared without case or accents: "eleve" finds "Élève". */
export const fold = (text: string) =>
  text
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase();

/**
 * A source over rows already in memory (the local SQLite of the counter, a
 * fixture): searched in the words of `text`, every word typed in any order.
 */
export function localSource<Row>(
  rows: Row[],
  {
    text,
    filter = () => true,
    sortValue = (row, key) => (row as Record<string, unknown>)[key] as string | number,
    locale = "fr",
  }: {
    text: (row: Row) => string;
    /** The language the rows' text is sorted in (BCP 47). */
    locale?: string;
    filter?: (row: Row, value: string) => boolean;
    sortValue?: (row: Row, key: string) => string | number | Date | null | undefined;
  },
): DataSource<Row> {
  const collator = new Intl.Collator(locale, { numeric: true, sensitivity: "base" });
  return async (query) => {
    const words = fold(query.search).split(/\s+/).filter(Boolean);
    let found = rows.filter((row) => {
      if (query.filter !== "all" && !filter(row, query.filter)) return false;
      const haystack = fold(text(row));
      return words.every((word) => haystack.includes(word));
    });
    if (query.sort) {
      const { key, direction } = query.sort;
      const sign = direction === "ascending" ? 1 : -1;
      found = [...found].sort((a, b) => {
        const x = sortValue(a, key);
        const y = sortValue(b, key);
        if (x == null) return 1;
        if (y == null) return -1;
        if (typeof x === "string" && typeof y === "string") return collator.compare(x, y) * sign;
        return (Number(x) - Number(y)) * sign;
      });
    }
    const start = (query.page - 1) * query.pageSize;
    return { rows: found.slice(start, start + query.pageSize), total: found.length };
  };
}

export type RestOptions<Row> = {
  /** fetch, or the app's client (auth, base URL). */
  fetch?: typeof fetch;
  /** Query parameter names, for an API that names them otherwise. */
  params?: Partial<Record<"search" | "filter" | "sort" | "order" | "page" | "pageSize", string>>;
  /** From the JSON to rows and total. Default: { rows, total } or { data, meta: { total } }. */
  read?: (json: unknown) => TablePage<Row>;
  headers?: HeadersInit;
};

export class SourceError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

/**
 * A source over a JSON API: GET url?q=…&filter=…&sort=…&order=asc&page=1&per_page=8.
 * Cancelled by the table when a newer query starts.
 */
export function restSource<Row>(url: string, options: RestOptions<Row> = {}): DataSource<Row> {
  const names = { search: "q", filter: "filter", sort: "sort", order: "order", page: "page", pageSize: "per_page", ...options.params };
  const read =
    options.read ??
    ((json: unknown) => {
      const body = json as { rows?: Row[]; total?: number; data?: Row[]; meta?: { total?: number } };
      return { rows: body.rows ?? body.data ?? [], total: body.total ?? body.meta?.total ?? 0 };
    });
  return async (query, signal) => {
    const target = new URL(url, typeof location === "undefined" ? "http://localhost" : location.href);
    if (query.search) target.searchParams.set(names.search, query.search);
    if (query.filter && query.filter !== "all") target.searchParams.set(names.filter, query.filter);
    if (query.sort) {
      target.searchParams.set(names.sort, query.sort.key);
      target.searchParams.set(names.order, query.sort.direction === "ascending" ? "asc" : "desc");
    }
    target.searchParams.set(names.page, String(query.page));
    target.searchParams.set(names.pageSize, String(query.pageSize));
    const response = await (options.fetch ?? fetch)(target.toString(), { signal, headers: { Accept: "application/json", ...options.headers } });
    if (!response.ok) throw new SourceError(`HTTP ${response.status}`, response.status);
    return read(await response.json());
  };
}
