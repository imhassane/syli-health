import "@syli/ui/styles.css";
import "./app.css";
import { render } from "preact";
import { applyLocale, toast } from "@syli/ui";
import { App } from "./App.tsx";
import { savedLocale } from "./locale.ts";
import { textFor } from "./text.ts";

const locale = savedLocale();
applyLocale(locale);
render(<App initialLocale={locale} />, document.getElementById("app")!);

// Light client only: in Tauri the files are inside the app, and a new
// version comes with an update of the app itself.
const inTauri = "__TAURI_INTERNALS__" in window;
if (!inTauri && "serviceWorker" in navigator && import.meta.env.PROD) {
  import("virtual:pwa-register").then(({ registerSW }) => {
    // The language of the moment the toast shows.
    const text = () => textFor((document.documentElement.dataset.locale as never) ?? locale);
    const update = registerSW({
      onNeedRefresh: () =>
        toast.info(text()("newVersion"), {
          detail: text()("newVersionDetail"),
          action: { label: text()("reload"), onClick: () => update(true) },
        }),
      onOfflineReady: () => toast.success(text()("offlineReady"), { detail: text()("offlineReadyDetail") }),
    });
  });
}
