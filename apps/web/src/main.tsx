import "@syli/ui/styles.css";
import "./app.css";
import { render } from "preact";
import { toast } from "@syli/ui";
import { App } from "./App.tsx";

render(<App />, document.getElementById("app")!);

// Light client only: in Tauri the files are inside the app, and a new
// version comes with an update of the app itself.
const inTauri = "__TAURI_INTERNALS__" in window;
if (!inTauri && "serviceWorker" in navigator && import.meta.env.PROD) {
  import("virtual:pwa-register").then(({ registerSW }) => {
    const update = registerSW({
      onNeedRefresh: () =>
        toast.info("Nouvelle version disponible", {
          detail: "Elle s’installe en rechargeant la page.",
          action: { label: "Recharger", onClick: () => update(true) },
        }),
      onOfflineReady: () => toast.success("Prête hors ligne", { detail: "L’application s’ouvre même sans réseau." }),
    });
  });
}
