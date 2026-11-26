import {
  Button,
  ClinicalAlert,
  DataTable,
  Modal,
  Select,
  StatCard,
  StatGrid,
  StatusPill,
  TextField,
  ThemeToggle,
  Toaster,
  toast,
  type Column,
} from "@syli/ui";
import { gnf, type StockItem } from "@syli/ui/fixtures";
import { useEffect, useState } from "preact/hooks";
import { stockSource, usingApi } from "./api.ts";

const status = {
  out: <StatusPill tone="danger">Rupture</StatusPill>,
  low: <StatusPill tone="warning">Stock faible</StatusPill>,
  expiring: <StatusPill tone="violet">Péremption proche</StatusPill>,
  ok: <StatusPill tone="success">Disponible</StatusPill>,
};

const columns: Column<StockItem>[] = [
  { key: "dci", header: "Médicament", cell: (r) => r.dci, sortable: true, rowHeader: true },
  { key: "brand", header: "Nom commercial", cell: (r) => r.brand, sortable: true },
  { key: "qty", header: "Stock", cell: (r) => <span class="sy-num">{r.qty}</span>, sortable: true, align: "end" },
  { key: "price", header: "Prix", cell: (r) => <span class="sy-num sy-ltr">{gnf(r.price)}</span>, sortable: true, align: "end" },
  { key: "status", header: "Statut", cell: (r) => status[r.status] },
];

const filters = {
  label: "Filtrer le stock",
  options: [
    { value: "all", label: "Tous" },
    { value: "low", label: "Stocks faibles" },
    { value: "out", label: "Ruptures" },
    { value: "expiring", label: "Péremptions" },
  ],
};

function useOnline() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => {
      setOnline(true);
      toast.success("Réseau revenu", { id: "network", detail: "Synchronisation en cours." });
    };
    const off = () => {
      setOnline(false);
      toast.warning("Hors ligne", { id: "network", duration: 0, detail: "Vous pouvez continuer à vendre : tout partira au retour du réseau." });
    };
    addEventListener("online", on);
    addEventListener("offline", off);
    return () => {
      removeEventListener("online", on);
      removeEventListener("offline", off);
    };
  }, []);
  return online;
}

export function App() {
  const online = useOnline();
  const [receiving, setReceiving] = useState(false);
  const [advised, setAdvised] = useState(false);

  return (
    <div class="app">
      <header class="app__bar">
        <a class="app__brand" href="/">
          <img src="/icon.svg" alt="" width="36" height="36" />
          <span>
            Syli <strong>Pharmacie</strong>
          </span>
        </a>
        <StatusPill tone={online ? "success" : "warning"}>{online ? "En ligne" : "Hors ligne"}</StatusPill>
        <ThemeToggle />
      </header>

      <main class="app__main">
        <h1 class="app__title">Pharmacie du Niger · Kaloum</h1>

        <StatGrid label="Aujourd’hui">
          <StatCard label="Ventes du jour" value="4,87 M GNF" note="+12 % sur hier" icon="money" />
          <StatCard label="Ordonnances" value="38" note="dont 6 renouvellements" icon="rx" tone="violet" />
          <StatCard label="Réservations à préparer" value="5" note="2 payées en ligne" icon="bag" tone="success" />
          <StatCard label="Ruptures" value="3" note="Amoxicilline 500 mg…" icon="warning" tone="danger" />
        </StatGrid>

        <ClinicalAlert
          severity="caution"
          title="ciprofloxacine + glibenclamide"
          reason="Les fluoroquinolones peuvent provoquer une hypoglycémie chez les patients traités par sulfamide hypoglycémiant."
          action="prévenir le patient et renforcer l’autosurveillance de la glycémie."
          acknowledge={{ label: "Conseil donné au patient", checked: advised, onChange: setAdvised }}
        />

        <DataTable
          caption={usingApi ? "Produits en stock" : "Produits en stock (démonstration)"}
          columns={columns}
          source={stockSource}
          rowKey={(r) => r.id}
          searchLabel="Rechercher dans le stock"
          searchPlaceholder="DCI, nom commercial, lot…"
          filters={filters}
          actions={
            <Button size="sm" variant="primary" icon="plus" onClick={() => setReceiving(true)}>
              Réception
            </Button>
          }
        />
      </main>

      <Modal
        open={receiving}
        onClose={() => setReceiving(false)}
        title="Réception grossiste"
        description="Le bon de livraison met le stock à jour, lot par lot."
        footer={
          <>
            <Button onClick={() => setReceiving(false)}>Annuler</Button>
            <Button variant="primary" type="submit" form="reception">
              Enregistrer
            </Button>
          </>
        }
      >
        <form
          id="reception"
          class="app__form"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            setReceiving(false);
            toast.success("Réception enregistrée", { detail: `Bon ${data.get("slip")} · ${data.get("supplier")}` });
          }}
        >
          <Select label="Grossiste" name="supplier" required error="Choisissez le grossiste.">
            <option value="">Choisir…</option>
            <option>Laborex Guinée</option>
            <option>Pharmaguinée</option>
          </Select>
          <TextField label="Numéro de bon de livraison" name="slip" required error="Indiquez le numéro du bon." autoFocus />
        </form>
      </Modal>

      <Toaster />
    </div>
  );
}
