/**
 * One polite announcement region for the whole page, present from the start
 * (a live region added with its text is not read reliably). ariaNotify() where
 * the browser has it.
 */
let region: HTMLElement | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;

function liveRegion() {
  if (region?.isConnected) return region;
  region = document.createElement("div");
  region.className = "sy-visually-hidden";
  region.setAttribute("aria-live", "polite");
  region.dataset.syAnnouncer = "";
  document.body.append(region);
  return region;
}

export function prepareAnnouncer() {
  if (typeof document !== "undefined") liveRegion();
}

/** Reads `text` once, a moment later so it does not talk over a focus change. */
export function announce(text: string, { delay = 150 }: { delay?: number } = {}) {
  if (typeof document === "undefined" || !text) return;
  const doc = document as Document & { ariaNotify?: (message: string) => void };
  if (typeof doc.ariaNotify === "function") {
    doc.ariaNotify(text);
    return;
  }
  const live = liveRegion();
  clearTimeout(timer);
  live.textContent = "";
  timer = setTimeout(() => {
    live.textContent = text;
  }, delay);
}
