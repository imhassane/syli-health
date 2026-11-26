import { Icon } from "../icon/Icon.tsx";

export type PatientBannerProps = {
  name: string;
  sex: "F" | "M";
  /** ISO date: the age is computed from it. */
  birthDate: string;
  recordId: string;
  weightKg?: number;
  allergies?: string[];
  conditions?: string[];
  /** The day the age is computed for (tests, stories). */
  today?: Date;
};

const sexLabel = { F: "Femme", M: "Homme" };

export function ageOn(birthDate: string, today = new Date()) {
  const birth = new Date(`${birthDate}T00:00:00`);
  let age = today.getFullYear() - birth.getFullYear();
  const before = today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate());
  if (before) age--;
  return age;
}

/**
 * Who the patient is, always visible on the patient's screens: never two
 * patients mixed up (identity checking). Allergies come first among the
 * facts, in danger colours with an icon and the word "Allergie".
 */
export function PatientBanner({ name, sex, birthDate, recordId, weightKg, allergies = [], conditions = [], today }: PatientBannerProps) {
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const birth = new Date(`${birthDate}T00:00:00`).toLocaleDateString("fr-FR");
  return (
    <section class="sy-patient" aria-label={`Patient : ${name}`}>
      <span class="sy-patient__avatar" aria-hidden="true">
        {initials}
      </span>
      <div class="sy-patient__id">
        <h2 class="sy-patient__name">{name}</h2>
        <p class="sy-patient__facts">
          {sexLabel[sex]} · {ageOn(birthDate, today)} ans · né{sex === "F" ? "e" : ""} le {birth} · dossier <span class="sy-ltr">{recordId}</span>
          {weightKg !== undefined && <> · {weightKg} kg</>}
        </p>
      </div>
      {(allergies.length > 0 || conditions.length > 0) && (
        <ul class="sy-patient__flags" aria-label="Allergies et pathologies">
          {allergies.map((allergy) => (
            <li class="sy-pill sy-pill--danger" key={allergy}>
              <Icon name="alert" size={14} />
              Allergie : {allergy}
            </li>
          ))}
          {conditions.map((condition) => (
            <li class="sy-pill sy-pill--info" key={condition}>
              {condition}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
