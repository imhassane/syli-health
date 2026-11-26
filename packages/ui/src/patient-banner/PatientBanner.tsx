import { Icon } from "../icon/Icon.tsx";
import { useI18n } from "../i18n/I18n.tsx";

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
  const { t, plural, date, number } = useI18n();
  const born = date(birthDate, { dateStyle: "short" });
  return (
    <section class="sy-patient" aria-label={t("patient", { name })}>
      <span class="sy-patient__avatar" aria-hidden="true">
        {initials}
      </span>
      <div class="sy-patient__id">
        <h2 class="sy-patient__name">{name}</h2>
        <p class="sy-patient__facts">
          {t(sex === "F" ? "female" : "male")} · {plural("age", ageOn(birthDate, today))} · {t(sex === "F" ? "bornFemale" : "bornMale", { date: born })} ·{" "}
          {t("record", { id: "\u0000" }).split("\u0000")[0]}
          <bdi class="sy-ltr">{recordId}</bdi>
          {t("record", { id: "\u0000" }).split("\u0000")[1]}
          {weightKg !== undefined && <> · <span class="sy-ltr">{number(weightKg, { style: "unit", unit: "kilogram" })}</span></>}
        </p>
      </div>
      {(allergies.length > 0 || conditions.length > 0) && (
        <ul class="sy-patient__flags" aria-label={t("allergiesAndConditions")}>
          {allergies.map((allergy) => (
            <li class="sy-pill sy-pill--danger" key={allergy}>
              <Icon name="alert" size={14} />
              {t("allergy", { name: allergy })}
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
