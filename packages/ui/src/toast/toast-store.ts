/**
 * The toasts of the app, as Sonner's API: toast.success("Vente encaissée", { detail }).
 * Any module may call it; the one <Toaster /> of the app shows them.
 *
 * Toasts are for news that may be missed: a sale saved, a sync done. Never a
 * clinical alert (an interaction, an allergy): those stay on the screen until
 * read, as a ClinicalAlert.
 */
export type ToastKind = "success" | "error" | "warning" | "info" | "loading";

export type ToastAction = { label: string; onClick: () => void };

export type ToastOptions = {
  detail?: string;
  /** A shortcut to an action also available elsewhere ("Annuler"). */
  action?: ToastAction;
  /** In ms; 0 keeps it until closed. Errors and loading stay by default. */
  duration?: number;
  /** Replaces the toast with the same id (a loading one turning into a success). */
  id?: string;
};

export type ToastItem = Required<Pick<ToastOptions, "duration">> & Omit<ToastOptions, "duration"> & { id: string; kind: ToastKind; title: string };

type Listener = (items: ToastItem[]) => void;

let items: ToastItem[] = [];
const listeners = new Set<Listener>();
let counter = 0;

const defaultDuration = (kind: ToastKind, action?: ToastAction) => {
  if (kind === "error" || kind === "loading") return 0;
  // A toast that can be undone stays longer: time to read it and reach the button.
  if (action) return 8000;
  return kind === "warning" ? 7000 : 5000;
};

function emit() {
  for (const listener of listeners) listener(items);
}

function show(kind: ToastKind, title: string, options: ToastOptions = {}) {
  const id = options.id ?? `toast-${++counter}`;
  const item: ToastItem = { ...options, id, kind, title, duration: options.duration ?? defaultDuration(kind, options.action) };
  const index = items.findIndex((t) => t.id === id);
  items = index >= 0 ? items.map((t, i) => (i === index ? item : t)) : [...items, item];
  emit();
  return id;
}

export const toast = Object.assign((title: string, options?: ToastOptions) => show("info", title, options), {
  success: (title: string, options?: ToastOptions) => show("success", title, options),
  error: (title: string, options?: ToastOptions) => show("error", title, options),
  warning: (title: string, options?: ToastOptions) => show("warning", title, options),
  info: (title: string, options?: ToastOptions) => show("info", title, options),
  loading: (title: string, options?: ToastOptions) => show("loading", title, options),
  dismiss(id?: string) {
    items = id ? items.filter((t) => t.id !== id) : [];
    emit();
  },
});

export function subscribe(listener: Listener) {
  listeners.add(listener);
  listener(items);
  return () => listeners.delete(listener);
}

/** For tests and stories: start from nothing. */
export function resetToasts() {
  items = [];
  counter = 0;
  emit();
}
