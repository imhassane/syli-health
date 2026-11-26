import { useEffect, useLayoutEffect, useRef, useState } from "preact/hooks";
import { announce } from "../announce/announce.ts";
import { Icon, type IconName } from "../icon/Icon.tsx";
import { subscribe, toast, type ToastItem, type ToastKind } from "./toast-store.ts";

const badges: Record<ToastKind, IconName> = { success: "check", error: "alert", warning: "warning", info: "info", loading: "refresh" };

const MIN_REMAINING_MS = 1500;

/** Popover where the browser has it (top layer); else a plain fixed region, as visible. */
const popoverSupported = typeof HTMLElement !== "undefined" && Object.hasOwn(HTMLElement.prototype, "popover");

type Timer = { left: number; started: number; id?: ReturnType<typeof setTimeout> };

const cssPx = (el: Element, name: string) => {
  const probe = document.createElement("span");
  probe.style.cssText = `position:absolute;visibility:hidden;inline-size:var(${name})`;
  el.append(probe);
  const px = probe.getBoundingClientRect().width;
  probe.remove();
  return px;
};

const modalOpen = () => {
  try {
    return document.querySelector("dialog:modal") !== null;
  } catch {
    return false;
  }
};

/**
 * The one notifications region of the app, after fulbhefuuta's stack (itself
 * after Sonner): the newest toast in front, the previous ones peeking out
 * behind it, shrunk; the stack spreads out while the pointer or the keyboard
 * focus is in it, and timers pause meanwhile. Errors stay until closed.
 *
 * Accessible: a named region always in the page (popover="manual", in the
 * top layer where supported), each toast announced once (ariaNotify or the
 * page's polite region) without taking the focus, closable by a named
 * button or Escape, the focus moved to the next toast (or back) when the
 * focused one goes. Held back while a modal dialog is open (the page behind
 * is inert and the news would be missed), shown when it closes.
 */
export function Toaster({ label = "Notifications", closeLabel = "Fermer la notification" }: { label?: string; closeLabel?: string }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const [held, setHeld] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [leaving, setLeaving] = useState<Set<string>>(new Set());
  const region = useRef<HTMLElement>(null);
  const cards = useRef(new Map<string, HTMLElement>());
  const timers = useRef(new Map<string, Timer>());
  const announced = useRef(new Set<string>());
  const lastFocusOutside = useRef<HTMLElement | null>(null);

  useEffect(() => subscribe(setItems), []);

  // Held while a modal dialog is open; released when any dialog closes.
  useEffect(() => {
    const check = () => setHeld(modalOpen());
    check();
    document.addEventListener("close", check, true);
    document.addEventListener("toggle", check, true);
    const observer = new MutationObserver(check);
    observer.observe(document.body, { subtree: true, attributeFilter: ["open"] });
    return () => {
      document.removeEventListener("close", check, true);
      document.removeEventListener("toggle", check, true);
      observer.disconnect();
    };
  }, []);

  // Where the focus was before entering the region: given back when the last toast goes.
  useEffect(() => {
    const remember = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      if (!region.current?.contains(target)) lastFocusOutside.current = target;
    };
    document.addEventListener("focusin", remember);
    return () => document.removeEventListener("focusin", remember);
  }, []);

  const visible = held ? [] : items;

  // In the top layer while it has toasts, above everything but modal dialogs.
  useEffect(() => {
    const el = region.current as (HTMLElement & { showPopover?: () => void; hidePopover?: () => void }) | null;
    if (!el?.showPopover) return;
    const open = el.matches(":popover-open");
    if (visible.length && !open) el.showPopover();
    if (!visible.length && open) el.hidePopover?.();
  }, [visible.length]);

  // Each toast announced once, when it is shown: its words, and whether it has an action.
  useEffect(() => {
    for (const item of visible) {
      const key = `${item.id}:${item.kind}:${item.title}`;
      if (announced.current.has(key)) continue;
      announced.current.add(key);
      announce([item.title, item.detail, item.action && "Action disponible."].filter(Boolean).join(". "), { delay: 50 });
    }
  }, [visible]);

  const remove = (id: string) => {
    const card = cards.current.get(id);
    const hadFocus = card?.contains(document.activeElement) ?? false;
    clearTimeout(timers.current.get(id)?.id);
    timers.current.delete(id);
    setLeaving((set) => new Set(set).add(id));
    const ms = matchMedia?.("(prefers-reduced-motion: reduce)").matches ? 0 : 200;
    setTimeout(() => {
      toast.dismiss(id);
      setLeaving((set) => {
        const next = new Set(set);
        next.delete(id);
        return next;
      });
      if (hadFocus) {
        const next = [...cards.current.entries()].reverse().find(([other]) => other !== id)?.[1];
        const button = next?.querySelector<HTMLElement>(".sy-toast__close");
        (button ?? lastFocusOutside.current)?.focus();
      }
    }, ms);
  };

  // Timers: each toast its own, paused while the stack is spread out.
  useEffect(() => {
    for (const item of visible) {
      if (!item.duration || leaving.has(item.id)) continue;
      let timer = timers.current.get(item.id);
      if (!timer) {
        timer = { left: item.duration, started: 0 };
        timers.current.set(item.id, timer);
      }
      clearTimeout(timer.id);
      if (expanded) {
        if (timer.started) timer.left = Math.max(MIN_REMAINING_MS, timer.left - (Date.now() - timer.started));
        timer.started = 0;
      } else {
        timer.started = Date.now();
        const t = timer;
        t.id = setTimeout(() => remove(item.id), t.left);
      }
    }
    for (const [id, timer] of timers.current) {
      if (!visible.some((t) => t.id === id && t.duration)) {
        clearTimeout(timer.id);
        timers.current.delete(id);
      }
    }
  }, [visible, expanded]);

  useEffect(() => () => timers.current.forEach((t) => clearTimeout(t.id)), []);

  // The stack: only --sy-toast-y / -s / -o are set here; distances come from tokens.css.
  useLayoutEffect(() => {
    const el = region.current;
    if (!el) return;
    const list = visible.filter((t) => !leaving.has(t.id)).reverse(); // newest first
    const gap = cssPx(el, "--sy-toast-gap");
    const peek = cssPx(el, "--sy-toast-peek");
    const style = getComputedStyle(document.documentElement);
    const shrink = parseFloat(style.getPropertyValue("--sy-toast-shrink")) || 0.05;
    const shown = parseInt(style.getPropertyValue("--sy-toast-stack"), 10) || 3;
    const front = list.length ? (cards.current.get(list[0].id)?.offsetHeight ?? 0) : 0;
    let offset = 0;
    list.forEach((item, i) => {
      const card = cards.current.get(item.id);
      if (!card) return;
      card.style.zIndex = String(list.length - i);
      if (expanded) {
        card.style.setProperty("--sy-toast-y", `${-offset}px`);
        card.style.setProperty("--sy-toast-s", "1");
        card.style.setProperty("--sy-toast-o", "1");
        card.inert = false;
        offset += card.offsetHeight + gap;
      } else {
        const scale = 1 - i * shrink;
        card.style.setProperty("--sy-toast-y", `${i ? card.offsetHeight * scale - front - i * peek : 0}px`);
        card.style.setProperty("--sy-toast-s", String(scale));
        card.style.setProperty("--sy-toast-o", i < shown ? "1" : "0");
        card.inert = i >= shown;
      }
    });
    el.style.setProperty("--sy-toasts-h", `${expanded ? offset : front}px`);
  });

  return (
    <section
      ref={region}
      class="sy-toasts"
      aria-label={label}
      {...(popoverSupported ? { popover: "manual" } : {})}
      data-expanded={expanded || undefined}
      onPointerEnter={() => setExpanded(true)}
      onPointerLeave={() => {
        if (!region.current?.contains(document.activeElement)) setExpanded(false);
      }}
      // Lowercase: Preact binds an unknown camelCase name as is, and "FocusIn" never fires.
      {...{
        onfocusin: () => setExpanded(true),
        onfocusout: (event: FocusEvent) => {
          if (!region.current?.contains(event.relatedTarget as Node) && !region.current?.matches(":hover")) setExpanded(false);
        },
      }}
      onKeyDown={(event) => {
        const list = visible.filter((t) => !leaving.has(t.id));
        if (event.key === "Escape" && list.length) remove(list[list.length - 1].id);
      }}
    >
      {visible.map((item) => (
        <div
          key={item.id}
          ref={(el) => {
            if (el) cards.current.set(item.id, el);
            else cards.current.delete(item.id);
          }}
          class={`sy-toast sy-toast--${item.kind}`}
          data-state={leaving.has(item.id) ? "leaving" : undefined}
        >
          <span class="sy-toast__badge" aria-hidden="true">
            <Icon name={badges[item.kind]} size={18} />
          </span>
          <span class="sy-toast__body">
            <span class="sy-toast__title">{item.title}</span>
            {item.detail && <span class="sy-toast__detail">{item.detail}</span>}
          </span>
          {item.action && (
            <button
              type="button"
              class="sy-toast__action"
              onClick={() => {
                item.action?.onClick();
                remove(item.id);
              }}
            >
              {item.action.label}
            </button>
          )}
          <button type="button" class="sy-toast__close" aria-label={`${closeLabel} : ${item.title}`} onClick={() => remove(item.id)}>
            <Icon name="close" size={16} />
          </button>
        </div>
      ))}
    </section>
  );
}
