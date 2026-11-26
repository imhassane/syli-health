import type { ComponentChildren } from "preact";
import { useEffect, useId, useRef } from "preact/hooks";
import { Button, IconButton } from "../button/Button.tsx";

export type ModalProps = {
  /** Shown as a modal while true. */
  open: boolean;
  /** Escape, the back gesture, the close button, a click outside (`dismissible`) or a drag down: the app sets open to false. */
  onClose: () => void;
  /** Its heading and accessible name. */
  title: ComponentChildren;
  description?: ComponentChildren;
  children?: ComponentChildren;
  /** The actions, the main one last (at the end on a computer, on top on a phone). */
  footer?: ComponentChildren;
  /** sm: a question. md: a short form. lg: a form or a detail. */
  size?: "sm" | "md" | "lg";
  /** A click on the backdrop closes it too. Off for a form being filled. */
  dismissible?: boolean;
  closeLabel?: string;
};

// A drawer is dragged down this far, or flicked, to close.
const closeDistance = 80;
const flickSpeed = 0.6; // px per ms

/** Below this width, dialogs are drawers from the bottom of the screen (modal.css). */
const isDrawer = () => window.matchMedia?.("(max-width: 40rem)").matches ?? false;

/**
 * A native modal <dialog>: the browser keeps the focus inside, makes the page
 * behind inert, closes it on Escape and the back gesture, and gives the
 * focus back to what opened it. Centered on a computer and a tablet; a
 * drawer from the bottom on a phone, which a finger drags down to close (its
 * close button does the same: WCAG 2.5.1). The page behind never scrolls.
 */
export function Modal({ open, onClose, title, description, children, footer, size = "md", dismissible = true, closeLabel = "Fermer" }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      if (typeof dialog.showModal === "function") dialog.showModal();
      else {
        // No native modal (old browsers, jsdom): shown in place, focus on its autofocus control.
        dialog.setAttribute("open", "");
        dialog.querySelector<HTMLElement>("[autofocus]")?.focus();
      }
    } else if (!open && dialog.open) {
      if (typeof dialog.close === "function") dialog.close();
      else dialog.removeAttribute("open");
    }
  }, [open]);

  // Light dismiss where `closedby` is missing (Safari): a press and a release
  // outside the dialog's box, so a text selection ending on the backdrop
  // does not close it.
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || !dismissible || "closedBy" in HTMLDialogElement.prototype) return;
    const outside = (e: PointerEvent) => {
      const r = dialog.getBoundingClientRect();
      return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    };
    let pressedOutside = false;
    const down = (e: PointerEvent) => (pressedOutside = outside(e));
    const up = (e: PointerEvent) => {
      if (pressedOutside && outside(e)) close.current();
    };
    dialog.addEventListener("pointerdown", down);
    dialog.addEventListener("pointerup", up);
    return () => {
      dialog.removeEventListener("pointerdown", down);
      dialog.removeEventListener("pointerup", up);
    };
  }, [dismissible]);

  // The drawer follows a finger dragging it down, then closes past a distance
  // or a flick. Only from its top: when its content is scrolled, the finger
  // scrolls it.
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    let start: { y: number; time: number } | null = null;
    let offset = 0;
    const body = () => dialog.querySelector<HTMLElement>(".sy-modal__body");
    const onStart = (event: TouchEvent) => {
      start = isDrawer() && (body()?.scrollTop ?? 0) <= 0 ? { y: event.touches[0].clientY, time: Date.now() } : null;
      offset = 0;
    };
    const onMove = (event: TouchEvent) => {
      if (!start) return;
      offset = Math.max(0, event.touches[0].clientY - start.y);
      dialog.style.transition = "none";
      dialog.style.transform = offset > 0 ? `translateY(${offset}px)` : "";
    };
    const onEnd = () => {
      if (!start) return;
      const speed = offset / Math.max(1, Date.now() - start.time);
      start = null;
      dialog.style.transition = "";
      dialog.style.transform = "";
      if (offset > closeDistance || (offset > 24 && speed > flickSpeed)) close.current();
    };
    dialog.addEventListener("touchstart", onStart, { passive: true });
    dialog.addEventListener("touchmove", onMove, { passive: true });
    dialog.addEventListener("touchend", onEnd);
    dialog.addEventListener("touchcancel", onEnd);
    return () => {
      dialog.removeEventListener("touchstart", onStart);
      dialog.removeEventListener("touchmove", onMove);
      dialog.removeEventListener("touchend", onEnd);
      dialog.removeEventListener("touchcancel", onEnd);
    };
  }, []);

  return (
    <dialog
      ref={ref}
      class={`sy-modal sy-modal--${size}`}
      aria-labelledby={`${id}-title`}
      aria-describedby={description ? `${id}-description` : undefined}
      {...{ closedby: dismissible ? "any" : "closerequest" }}
      // Escape, the back gesture or a click outside: the app decides, its state stays the truth.
      onCancel={(event) => {
        event.preventDefault();
        close.current();
      }}
      onClose={() => {
        if (open) close.current();
      }}
    >
      {open && (
        <>
          <span class="sy-modal__handle" aria-hidden="true" />
          <header class="sy-modal__head">
            <h1 class="sy-modal__title" id={`${id}-title`}>
              {title}
            </h1>
            <IconButton icon="close" label={closeLabel} onClick={() => close.current()} />
          </header>
          {description && (
            <p class="sy-modal__description" id={`${id}-description`}>
              {description}
            </p>
          )}
          {children && <div class="sy-modal__body">{children}</div>}
          {footer && <footer class="sy-modal__foot">{footer}</footer>}
        </>
      )}
    </dialog>
  );
}

export type ConfirmDialogProps = {
  open: boolean;
  title: ComponentChildren;
  description?: ComponentChildren;
  confirmLabel: string;
  cancelLabel?: string;
  /** danger: the action destroys or loses something. */
  tone?: "default" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * A question before an action with consequences. The safe answer has the
 * focus, so Enter never destroys by accident; the costly one says what it
 * does ("Supprimer le lot", never "OK").
 */
export function ConfirmDialog({ open, title, description, confirmLabel, cancelLabel = "Annuler", tone = "default", onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      size="sm"
      dismissible={false}
      footer={
        <>
          <Button variant="soft" onClick={onCancel} autoFocus>
            {cancelLabel}
          </Button>
          <Button variant={tone === "danger" ? "danger" : "primary"} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
