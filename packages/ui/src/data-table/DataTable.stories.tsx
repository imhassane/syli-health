import { useState } from "preact/hooks";
import { Button } from "../button/Button.tsx";
import { Modal } from "../modal/Modal.tsx";
import { StatusPill } from "../status-pill/StatusPill.tsx";
import { StoryFrame } from "../StoryFrame.tsx";
import { DataTable, type Column } from "./DataTable.tsx";
import { gnf, reservations, stock, type Reservation, type StockItem } from "./fixtures.ts";
import { localSource, restSource, type DataSource } from "./source.ts";

export default { title: "Données/DataTable", component: DataTable };

const stockStatus = {
  out: <StatusPill tone="danger">Rupture</StatusPill>,
  low: <StatusPill tone="warning">Stock faible</StatusPill>,
  expiring: <StatusPill tone="violet">Péremption proche</StatusPill>,
  ok: <StatusPill tone="success">Disponible</StatusPill>,
};

// Few columns: what decides at a glance. The rest is in the row, opened.
const stockColumns: Column<StockItem>[] = [
  { key: "dci", header: "Médicament", cell: (r) => r.dci, sortable: true, rowHeader: true },
  { key: "qty", header: "Stock", cell: (r) => <span class="sy-num">{r.qty}</span>, sortable: true, align: "end" },
  { key: "price", header: "Prix", cell: (r) => <span class="sy-num sy-ltr">{gnf(r.price)}</span>, sortable: true, align: "end" },
  { key: "status", header: "Statut", cell: (r) => stockStatus[r.status] },
];

const stockSource = localSource(stock, {
  text: (r) => `${r.dci} ${r.brand} ${r.lot}`,
  filter: (r, value) => r.status === value,
});

const stockFilters = {
  label: "Filtrer le stock",
  options: [
    { value: "all", label: "Tous" },
    { value: "low", label: "Stocks faibles" },
    { value: "out", label: "Ruptures" },
    { value: "expiring", label: "Péremptions" },
  ],
};

function StockTable() {
  const [open, setOpen] = useState<StockItem | null>(null);
  return (
    <StoryFrame>
      <DataTable
        caption="Produits en stock"
        columns={stockColumns}
        source={stockSource}
        rowKey={(r) => r.id}
        searchLabel="Rechercher dans le stock"
        searchPlaceholder="DCI, nom commercial, lot…"
        filters={stockFilters}
        onOpen={setOpen}
        actions={
          <>
            <Button size="sm">Inventaire</Button>
            <Button size="sm" variant="primary" icon="plus">Réception</Button>
          </>
        }
      />
      <Modal
        open={open !== null}
        onClose={() => setOpen(null)}
        title={open?.dci ?? ""}
        description={open ? `Nom commercial : ${open.brand}` : undefined}
        footer={<Button variant="primary" onClick={() => setOpen(null)}>Fermer</Button>}
      >
        {open && (
          <dl class="sy-facts">
            <dt>Stock</dt>
            <dd class="sy-num">{open.qty}</dd>
            <dt>Prochain lot</dt>
            <dd class="sy-ltr">{open.lot}</dd>
            <dt>Péremption</dt>
            <dd>{open.expires ? open.expires.split("-").reverse().join("/") : "—"}</dd>
            <dt>Prix</dt>
            <dd class="sy-num sy-ltr">{gnf(open.price)}</dd>
            <dt>Statut</dt>
            <dd>{stockStatus[open.status]}</dd>
          </dl>
        )}
      </Modal>
    </StoryFrame>
  );
}

export const Stock = { render: () => <StockTable /> };

// A pretend API: the same rows behind a fetch, with network latency.
const server = localSource(reservations, {
  text: (r) => `${r.patient} ${r.items} ${r.id}`,
  filter: (r, value) => r.status === value,
});

const fakeFetch: typeof fetch = async (input, init) => {
  const url = new URL(String(input));
  await new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, 600);
    init?.signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });
  const p = url.searchParams;
  const page = await server(
    {
      search: p.get("q") ?? "",
      filter: p.get("filter") ?? "all",
      sort: p.get("sort") ? { key: p.get("sort")!, direction: p.get("order") === "desc" ? "descending" : "ascending" } : undefined,
      page: Number(p.get("page")),
      pageSize: Number(p.get("per_page")),
    },
    new AbortController().signal,
  );
  return new Response(JSON.stringify({ data: page.rows, meta: { total: page.total } }), { headers: { "Content-Type": "application/json" } });
};

const reservationStatus = {
  check: <StatusPill tone="danger">Ordonnance à vérifier</StatusPill>,
  prepare: <StatusPill tone="warning">À préparer</StatusPill>,
  ready: <StatusPill tone="success">Prête</StatusPill>,
  done: <StatusPill tone="info" icon="check">Retirée</StatusPill>,
};

const reservationColumns: Column<Reservation>[] = [
  { key: "patient", header: "Patient", cell: (r) => r.patient, sortable: true, rowHeader: true },
  { key: "payer", header: "Paiement", cell: (r) => r.payer },
  { key: "amount", header: "Montant", cell: (r) => <span class="sy-num sy-ltr">{gnf(r.amount)}</span>, sortable: true, align: "end" },
  { key: "status", header: "Statut", cell: (r) => reservationStatus[r.status] },
];

const apiSource = restSource<Reservation>("https://api.syli.health/v1/reservations", { fetch: fakeFetch });

export const FromApi = {
  render: () => (
    <StoryFrame>
      <DataTable
        caption="Réservations en ligne"
        columns={reservationColumns}
        source={apiSource}
        rowKey={(r) => r.id}
        searchLabel="Rechercher une réservation"
        searchPlaceholder="Patient, médicament, numéro…"
        filters={{
          label: "Filtrer les réservations",
          options: [
            { value: "all", label: "Toutes" },
            { value: "check", label: "À vérifier" },
            { value: "prepare", label: "À préparer" },
            { value: "ready", label: "Prêtes" },
          ],
        }}
      />
    </StoryFrame>
  ),
};

const failing: DataSource<StockItem> = async () => {
  throw new Error("offline");
};

export const FailedToLoad = {
  render: () => (
    <StoryFrame>
      <DataTable caption="Produits en stock" columns={stockColumns} source={failing} rowKey={(r) => r.id} searchLabel="Rechercher dans le stock" />
    </StoryFrame>
  ),
};

const nothing: DataSource<StockItem> = async () => ({ rows: [], total: 0 });

export const Empty = {
  render: () => (
    <StoryFrame>
      <DataTable caption="Produits en stock" columns={stockColumns} source={nothing} rowKey={(r) => r.id} searchLabel="Rechercher dans le stock" emptyText="Aucun produit ne correspond." />
    </StoryFrame>
  ),
};

const pending: DataSource<StockItem> = () => new Promise(() => {});

export const Loading = {
  render: () => (
    <StoryFrame>
      <DataTable caption="Produits en stock" columns={stockColumns} source={pending} rowKey={(r) => r.id} searchLabel="Rechercher dans le stock" />
    </StoryFrame>
  ),
};

export const InNarrowContainer = {
  render: () => (
    <StoryFrame width="24rem">
      <DataTable caption="Produits en stock" columns={stockColumns} source={stockSource} rowKey={(r) => r.id} searchLabel="Rechercher dans le stock" filters={stockFilters} pageSize={4} />
    </StoryFrame>
  ),
};
