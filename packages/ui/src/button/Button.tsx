import type { ComponentChildren, JSX } from "preact";
import { Icon, type IconName } from "../icon/Icon.tsx";

export type ButtonProps = Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, "icon" | "loading" | "type"> & {
  /** primary: the one main action of a screen. soft: secondary. danger: destructive. */
  variant?: "primary" | "soft" | "outline" | "danger" | "danger-outline" | "ghost";
  size?: "md" | "sm";
  icon?: IconName;
  /** A directional icon (chevron, arrow): mirrored in right-to-left text. */
  flipIcon?: boolean;
  /** Busy: still focusable and named, but its click does nothing (aria-disabled). */
  loading?: boolean;
  block?: boolean;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  children: ComponentChildren;
};

/**
 * A button. Disabled while loading through aria-disabled, not `disabled`, so
 * it keeps its focus and screen readers still find it.
 */
export function Button({ variant = "soft", size = "md", icon, flipIcon, loading, block, type = "button", children, onClick, class: className, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      class={["sy-button", `sy-button--${variant}`, `sy-button--${size}`, block && "sy-button--block", className].filter(Boolean).join(" ")}
      aria-disabled={loading || undefined}
      aria-busy={loading || undefined}
      onClick={(event) => {
        if (loading) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
    >
      {loading ? <span class="sy-button__spinner" aria-hidden="true" /> : icon && <Icon name={icon} size={18} flip={flipIcon} />}
      <span>{children}</span>
    </button>
  );
}

export type IconButtonProps = Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, "icon"> & {
  icon: IconName;
  /** Its name, read by screen readers and shown as a tooltip. */
  label: string;
  variant?: "soft" | "ghost";
  flip?: boolean;
};

/** A button showing only an icon: named by `label` (WCAG 4.1.2). */
export function IconButton({ icon, label, variant = "ghost", flip, class: className, ...rest }: IconButtonProps) {
  return (
    <button {...rest} type="button" class={["sy-icon-button", `sy-icon-button--${variant}`, className].filter(Boolean).join(" ")} aria-label={label} title={label}>
      <Icon name={icon} size={20} flip={flip} />
    </button>
  );
}
