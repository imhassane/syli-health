import type { ComponentChildren } from "preact";
import { Icon, type IconName } from "../icon/Icon.tsx";

export type Tone = "info" | "success" | "warning" | "danger" | "neutral" | "violet";

const defaultIcons: Record<Tone, IconName> = {
  info: "info",
  success: "check",
  warning: "clock",
  danger: "alert",
  neutral: "info",
  violet: "clock",
};

/**
 * A state beside an item, always in words with an icon: never the colour
 * alone (WCAG 1.4.1). Red is kept for what is clinically dangerous.
 */
export function StatusPill({ tone = "neutral", icon, children }: { tone?: Tone; icon?: IconName | false; children: ComponentChildren }) {
  const name = icon === false ? null : icon ?? defaultIcons[tone];
  return (
    <span class={`sy-pill sy-pill--${tone}`}>
      {name && <Icon name={name} size={14} />}
      <span>{children}</span>
    </span>
  );
}
