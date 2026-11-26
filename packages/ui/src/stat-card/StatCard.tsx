import type { ComponentChildren } from "preact";
import { Icon, type IconName } from "../icon/Icon.tsx";
import type { Tone } from "../status-pill/StatusPill.tsx";

export type StatCardProps = {
  label: ComponentChildren;
  value: ComponentChildren;
  /** A short context: "↑ 12 % sur 7 jours". */
  note?: ComponentChildren;
  icon: IconName;
  tone?: Exclude<Tone, "danger"> | "danger";
};

/**
 * A key figure on a pastel card. Read in the order of meaning: the label,
 * then the value, then its note (a description list keeps them together).
 */
export function StatCard({ label, value, note, icon, tone = "info" }: StatCardProps) {
  return (
    <div class={`sy-stat sy-stat--${tone}`}>
      <span class="sy-stat__icon">
        <Icon name={icon} size={20} />
      </span>
      <dl class="sy-stat__body">
        <dt class="sy-stat__label">{label}</dt>
        <dd class="sy-stat__value sy-num">{value}</dd>
        {note && <dd class="sy-stat__note">{note}</dd>}
      </dl>
    </div>
  );
}

/** Stat cards side by side: four on a computer, two on a phone. */
export function StatGrid({ children, label }: { children: ComponentChildren; label: string }) {
  return (
    <section class="sy-stat-grid" aria-label={label}>
      <div class="sy-stat-grid__cells">{children}</div>
    </section>
  );
}
