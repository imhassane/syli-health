import { localSource, restSource, type DataSource } from "@syli/ui";
import { stock, type StockItem } from "@syli/ui/fixtures";

/**
 * Where the stock comes from: the API when VITE_API_URL is set
 * (GET {url}/stock?q&filter&sort&order&page&per_page → {rows, total}),
 * else the demo data, searched and sorted on the device.
 */
const api = import.meta.env.VITE_API_URL as string | undefined;

export const stockSource: DataSource<StockItem> = api
  ? restSource<StockItem>(`${api}/stock`)
  : localSource(stock, {
      text: (r) => `${r.dci} ${r.brand} ${r.lot}`,
      filter: (r, value) => r.status === value,
    });

export const usingApi = Boolean(api);
