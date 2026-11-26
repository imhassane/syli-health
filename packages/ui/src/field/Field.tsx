import type { ComponentChildren, JSX } from "preact";
import { useEffect, useId, useRef, useState } from "preact/hooks";
import { announce } from "../announce/announce.ts";
import { Icon } from "../icon/Icon.tsx";
import { useI18n } from "../i18n/I18n.tsx";

type Control = HTMLInputElement | HTMLSelectElement;

/**
 * Errors appear only once the person has interacted (:user-invalid), and
 * stay in sync for screen readers: aria-invalid is "false" until then, the
 * error is referenced by aria-describedby only while shown, and announced
 * once through the page's polite region. A server error (`error` given with
 * `invalid`) is shown at once.
 */
function useUserInvalid(ref: { current: Control | null }, serverInvalid: boolean) {
  const { t } = useI18n();
  const [invalid, setInvalid] = useState(serverInvalid);
  useEffect(() => setInvalid(serverInvalid), [serverInvalid]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Left, changed or submitted once: from then on its validity shows. The
    // same moment as :user-invalid, also where the browser (or jsdom) lacks it.
    let left = false;
    const userInvalid = () => {
      let native = false;
      try {
        native = el.matches(":user-invalid");
      } catch {
        native = false;
      }
      return native || (left && !el.validity.valid);
    };
    const sync = (leaving: boolean, announceIt = leaving) => () => {
      if (leaving) left = true;
      const now = serverInvalid || userInvalid();
      setInvalid((before) => {
        if (now && !before && announceIt) {
          const label = el.labels?.[0]?.textContent ?? "";
          const message = el.dataset.errorText ?? "";
          announce(t("fieldError", { label, message }), { delay: 500 });
        }
        return now;
      });
    };
    const onBlur = sync(true);
    const onInput = sync(false);
    // A failed submit: the form moves the focus to the first invalid field,
    // which reads its error; no announcement on top of it.
    const onInvalid = sync(true, false);
    el.addEventListener("blur", onBlur);
    el.addEventListener("change", onBlur);
    el.addEventListener("input", onInput);
    el.addEventListener("invalid", onInvalid);
    return () => {
      el.removeEventListener("blur", onBlur);
      el.removeEventListener("change", onBlur);
      el.removeEventListener("input", onInput);
      el.removeEventListener("invalid", onInvalid);
    };
  }, [serverInvalid]);
  return invalid;
}

type FieldFrameProps = {
  id: string;
  label: ComponentChildren;
  hint?: ComponentChildren;
  error?: string;
  invalid: boolean;
  optional?: boolean;
  children: ComponentChildren;
};

function FieldFrame({ id, label, hint, error, invalid, optional, children }: FieldFrameProps) {
  const { t } = useI18n();
  return (
    <div class="sy-field" data-invalid={invalid || undefined}>
      <label class="sy-field__label" for={id}>
        {label}
        {optional && <span class="sy-field__optional">{" " + t("optional")}</span>}
      </label>
      {hint && (
        <span class="sy-field__hint" id={`${id}-hint`}>
          {hint}
        </span>
      )}
      {children}
      {error && (
        <span class="sy-field__error" id={`${id}-error`} hidden={!invalid}>
          <Icon name="alert" size={16} />
          {error}
        </span>
      )}
    </div>
  );
}

const describedBy = (id: string, hint: unknown, error: unknown, invalid: boolean) =>
  [hint && `${id}-hint`, error && invalid && `${id}-error`].filter(Boolean).join(" ") || undefined;

export type TextFieldProps = Omit<JSX.InputHTMLAttributes<HTMLInputElement>, "label"> & {
  label: ComponentChildren;
  hint?: ComponentChildren;
  /** The message shown when the value is invalid. */
  error?: string;
  /** Invalid from the server: shown at once. */
  invalid?: boolean;
  optional?: boolean;
};

export function TextField({ label, hint, error, invalid: serverInvalid = false, optional, id: givenId, ...input }: TextFieldProps) {
  const auto = useId();
  const id = (givenId as string) ?? `sy-${auto}`;
  const ref = useRef<HTMLInputElement>(null);
  const invalid = useUserInvalid(ref, serverInvalid);
  return (
    <FieldFrame id={id} label={label} hint={hint} error={error} invalid={invalid} optional={optional}>
      <input
        {...input}
        ref={ref}
        id={id}
        class="sy-input"
        data-error-text={error}
        aria-invalid={invalid ? "true" : "false"}
        aria-describedby={describedBy(id, hint, error, invalid)}
      />
    </FieldFrame>
  );
}

export type SelectProps = Omit<JSX.SelectHTMLAttributes<HTMLSelectElement>, "label"> & {
  label: ComponentChildren;
  hint?: ComponentChildren;
  error?: string;
  invalid?: boolean;
  children: ComponentChildren;
};

export function Select({ label, hint, error, invalid: serverInvalid = false, id: givenId, children, ...select }: SelectProps) {
  const auto = useId();
  const id = (givenId as string) ?? `sy-${auto}`;
  const ref = useRef<HTMLSelectElement>(null);
  const invalid = useUserInvalid(ref, serverInvalid);
  return (
    <FieldFrame id={id} label={label} hint={hint} error={error} invalid={invalid}>
      <span class="sy-select">
        <select
          {...select}
          ref={ref}
          id={id}
          class="sy-input sy-select__control"
          data-error-text={error}
          aria-invalid={invalid ? "true" : "false"}
          aria-describedby={describedBy(id, hint, error, invalid)}
        >
          {children}
        </select>
        <Icon name="chevronDown" size={18} />
      </span>
    </FieldFrame>
  );
}

export type SearchFieldProps = Omit<JSX.InputHTMLAttributes<HTMLInputElement>, "label"> & {
  /** Its name: there is no visible label, the magnifier and placeholder show it. */
  label: string;
  /** A keyboard shortcut shown at the end: "F2". */
  shortcut?: string;
  icon?: "search" | "scan";
};

/** A search field in a pill, named for screen readers, inside a search landmark. */
export function SearchField({ label, shortcut, icon = "search", class: className, ...input }: SearchFieldProps) {
  return (
    <div role="search" class={["sy-search", className].filter(Boolean).join(" ")}>
      <Icon name={icon} size={18} />
      <input {...input} type="search" aria-label={label} class="sy-search__input" enterKeyHint="search" />
      {shortcut && (
        <kbd class="sy-kbd" aria-hidden="true">
          {shortcut}
        </kbd>
      )}
    </div>
  );
}

export type CheckboxProps = Omit<JSX.InputHTMLAttributes<HTMLInputElement>, "label"> & { label: ComponentChildren; switch?: boolean };

/** A checkbox, or a switch (`switch`): the whole label is the hit area. */
export function Checkbox({ label, switch: isSwitch, class: className, ...input }: CheckboxProps) {
  return (
    <label class={["sy-check", isSwitch && "sy-check--switch", className].filter(Boolean).join(" ")}>
      <input {...input} type="checkbox" role={isSwitch ? "switch" : undefined} class="sy-check__input" />
      <span class="sy-check__label">{label}</span>
    </label>
  );
}
