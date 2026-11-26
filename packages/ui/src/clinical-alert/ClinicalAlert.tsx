import type { ComponentChildren } from "preact";
import { useId } from "preact/hooks";
import { Icon } from "../icon/Icon.tsx";

export type Severity = "contraindication" | "caution" | "information";

const severities: Record<Severity, { label: string; tone: string }> = {
  contraindication: { label: "Contre-indication", tone: "danger" },
  caution: { label: "Précaution d’emploi", tone: "danger" },
  information: { label: "À prendre en compte", tone: "warning" },
};

export type ClinicalAlertProps = {
  /** "Ciprofloxacine + glibenclamide". */
  title: ComponentChildren;
  severity: Severity;
  /** Why: the mechanism or the risk. */
  reason: ComponentChildren;
  /** What to do: advise, monitor, ask the prescriber. */
  action: ComponentChildren;
  /** The traceable acknowledgment: "Conseil donné au patient". */
  acknowledge?: { label: string; checked: boolean; onChange: (checked: boolean) => void };
  /** Further buttons: "Demander un avis au prescripteur". */
  children?: ComponentChildren;
};

/**
 * A drug interaction, a contraindication, an allergy met by a prescription.
 * Never a toast: it stays on the screen until handled. Its level is said in
 * words; the acknowledgment is a real checkbox, kept for the record.
 */
export function ClinicalAlert({ title, severity, reason, action, acknowledge, children }: ClinicalAlertProps) {
  const id = useId();
  const level = severities[severity];
  return (
    <section class={`sy-clinical sy-clinical--${level.tone}`} aria-labelledby={`${id}-title`} data-handled={acknowledge?.checked || undefined}>
      <span class="sy-clinical__icon" aria-hidden="true">
        <Icon name={acknowledge?.checked ? "check" : "warning"} size={22} />
      </span>
      <div class="sy-clinical__body">
        <p class="sy-clinical__level">{level.label}</p>
        <h2 class="sy-clinical__title" id={`${id}-title`}>
          Interaction : {title}
        </h2>
        <p class="sy-clinical__text">{reason}</p>
        <p class="sy-clinical__text">
          <strong>À faire : </strong>
          {action}
        </p>
        {(acknowledge || children) && (
          <div class="sy-clinical__actions">
            {acknowledge && (
              <label class="sy-check sy-clinical__ack">
                <input type="checkbox" class="sy-check__input" checked={acknowledge.checked} onChange={(e) => acknowledge.onChange((e.currentTarget as HTMLInputElement).checked)} />
                <span>{acknowledge.label}</span>
              </label>
            )}
            {children}
          </div>
        )}
      </div>
    </section>
  );
}
