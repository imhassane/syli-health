import {
  BlobField,
  Button,
  ClinicalAlert,
  DataTable,
  I18nProvider,
  Logo,
  Modal,
  Select,
  StatCard,
  StatGrid,
  StatusPill,
  TextField,
  ThemeToggle,
  Toaster,
  localeCodes,
  locales,
  toast,
  useI18n,
  type Column,
  type Locale,
} from "@syli/ui";
import { type StockItem } from "@syli/ui/fixtures";
import { useEffect, useMemo, useState } from "preact/hooks";
import { stockSource, usingApi } from "./api.ts";
import { saveLocale } from "./locale.ts";
import { useText } from "./text.ts";

function useOnline() {
  const text = useText();
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => {
      setOnline(true);
      toast.success(text("networkBack"), { id: "network", detail: text("networkBackDetail") });
    };
    const off = () => {
      setOnline(false);
      toast.warning(text("offline"), { id: "network", duration: 0, detail: text("offlineDetail") });
    };
    addEventListener("online", on);
    addEventListener("offline", off);
    return () => {
      removeEventListener("online", on);
      removeEventListener("offline", off);
    };
  }, [text]);
  return online;
}

/** The language of the interface: a native select, each name in its own language. */
function LanguagePicker({ value, onChange }: { value: Locale; onChange: (locale: Locale) => void }) {
  const { t } = useI18n();
  return (
    <label class="app__language">
      <span class="sy-visually-hidden">{t("language")}</span>
      <span class="sy-select">
        <select class="sy-input sy-select__control" value={value} onChange={(e) => onChange((e.currentTarget as HTMLSelectElement).value as Locale)}>
          {localeCodes.map((code) => (
            <option value={code} key={code} lang={locales[code].tag}>
              {locales[code].name}
            </option>
          ))}
        </select>
      </span>
    </label>
  );
}

function Pharmacy({ locale, setLocale }: { locale: Locale; setLocale: (locale: Locale) => void }) {
  const text = useText();
  const { number, t } = useI18n();
  const online = useOnline();
  const [receiving, setReceiving] = useState(false);
  const [advised, setAdvised] = useState(false);
  const [product, setProduct] = useState<StockItem | null>(null);

  const money = (n: number) => `${number(n)} GNF`;
  const status = {
    out: <StatusPill tone="danger">{text("statusOut")}</StatusPill>,
    low: <StatusPill tone="warning">{text("statusLow")}</StatusPill>,
    expiring: <StatusPill tone="violet">{text("statusExpiring")}</StatusPill>,
    ok: <StatusPill tone="success">{text("statusOk")}</StatusPill>,
  };
  // Drug names are data, in French: read as French on any interface.
  const columns: Column<StockItem>[] = useMemo(
    () => [
      { key: "dci", header: text("drug"), cell: (r) => r.dci, sortable: true, rowHeader: true, lang: locale === "fr" ? undefined : "fr" },
      { key: "qty", header: text("quantity"), cell: (r) => <span class="sy-num">{number(r.qty)}</span>, sortable: true, align: "end" },
      { key: "price", header: text("price"), cell: (r) => <span class="sy-num sy-ltr">{money(r.price)}</span>, sortable: true, align: "end" },
      { key: "status", header: text("status"), cell: (r) => status[r.status] },
    ],
    [locale],
  );
  const filters = {
    label: text("filterStock"),
    options: [
      { value: "all", label: text("all") },
      { value: "low", label: text("low") },
      { value: "out", label: text("out") },
      { value: "expiring", label: text("expiring") },
    ],
  };
  const fr = locale === "fr" ? undefined : "fr";

  return (
    <div class="app">
      <BlobField />
      <header class="app__bar">
        <a class="app__brand" href="/">
          <Logo product="pharmacie" size="2.25rem" />
        </a>
        <StatusPill tone={online ? "success" : "warning"}>{online ? text("online") : text("offline")}</StatusPill>
        <LanguagePicker value={locale} onChange={setLocale} />
        <ThemeToggle />
      </header>

      <main class="app__main">
        <h1 class="app__title" lang={fr}>
          Pharmacie du Niger · Kaloum
        </h1>

        <StatGrid label={text("today")}>
          <StatCard label={text("sales")} value={<span class="sy-ltr">{number(4.87, { maximumFractionDigits: 2 })} M GNF</span>} note={text("salesNote")} icon="money" />
          <StatCard label={text("prescriptions")} value={number(38)} note={text("prescriptionsNote")} icon="rx" tone="violet" />
          <StatCard label={text("reservations")} value={number(5)} note={text("reservationsNote")} icon="bag" tone="success" />
          <StatCard label={text("stockouts")} value={number(3)} note={<span lang={fr}>Amoxicilline 500 mg…</span>} icon="warning" tone="danger" />
        </StatGrid>

        <ClinicalAlert
          severity="caution"
          title={<span lang={fr}>ciprofloxacine + glibenclamide</span>}
          reason={text("alertReason")}
          action={text("alertAction")}
          acknowledge={{ label: text("advised"), checked: advised, onChange: setAdvised }}
        />

        <DataTable
          key={locale}
          caption={usingApi ? text("stock") : text("stockDemo")}
          columns={columns}
          source={stockSource}
          rowKey={(r) => r.id}
          searchLabel={text("searchStock")}
          searchPlaceholder={text("searchHint")}
          filters={filters}
          onOpen={setProduct}
          actions={
            <Button size="sm" variant="primary" icon="plus" onClick={() => setReceiving(true)}>
              {text("reception")}
            </Button>
          }
        />
      </main>

      <Modal
        open={product !== null}
        onClose={() => setProduct(null)}
        title={<span lang={fr}>{product?.dci}</span>}
        description={product ? text("brand", { brand: product.brand }) : undefined}
        footer={
          <Button variant="primary" onClick={() => setProduct(null)}>
            {t("close")}
          </Button>
        }
      >
        {product && (
          <dl class="sy-facts">
            <dt>{text("quantity")}</dt>
            <dd class="sy-num">{number(product.qty)}</dd>
            <dt>{text("nextLot")}</dt>
            <dd class="sy-ltr">{product.lot}</dd>
            <dt>{text("expiry")}</dt>
            <dd class="sy-ltr">{product.expires ? product.expires.split("-").reverse().join("/") : "—"}</dd>
            <dt>{text("price")}</dt>
            <dd class="sy-num sy-ltr">{money(product.price)}</dd>
            <dt>{text("status")}</dt>
            <dd>{status[product.status]}</dd>
          </dl>
        )}
      </Modal>

      <Modal
        open={receiving}
        onClose={() => setReceiving(false)}
        title={text("receptionTitle")}
        description={text("receptionDescription")}
        footer={
          <>
            <Button onClick={() => setReceiving(false)}>{t("cancel")}</Button>
            <Button variant="primary" type="submit" form="reception">
              {text("save")}
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
            toast.success(text("received"), { detail: text("receivedDetail", { slip: String(data.get("slip")), supplier: String(data.get("supplier")) }) });
          }}
        >
          <Select label={text("supplier")} name="supplier" required error={text("supplierError")}>
            <option value="">{text("choose")}</option>
            <option>Laborex Guinée</option>
            <option>Pharmaguinée</option>
          </Select>
          <TextField label={text("slip")} name="slip" required error={text("slipError")} autoFocus />
        </form>
      </Modal>

      <Toaster />
    </div>
  );
}

export function App({ initialLocale }: { initialLocale: Locale }) {
  const [locale, setLocale] = useState(initialLocale);
  useEffect(() => {
    document.documentElement.dataset.locale = locale;
  }, [locale]);
  return (
    <I18nProvider locale={locale}>
      <Pharmacy
        locale={locale}
        setLocale={(next) => {
          saveLocale(next);
          setLocale(next);
        }}
      />
    </I18nProvider>
  );
}
