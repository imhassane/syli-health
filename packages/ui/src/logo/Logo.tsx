import { useId } from "preact/hooks";

export type Product = "health" | "pharmacie" | "clinique" | "labo" | "patient";

const names: Record<Product, string> = {
  health: "health",
  pharmacie: "pharmacie",
  clinique: "clinique",
  labo: "labo",
  patient: "patient",
};

export type LogoProps = {
  /** The suite (health) or one of its products: colours the leaf and the name. */
  product?: Product;
  /** Height of the drop, in CSS; the wordmark follows. */
  size?: string;
  /** The drop alone (an icon, a small space). */
  markOnly?: boolean;
  /** Under the wordmark: "Parcours médicaux". */
  tagline?: string;
  /** "row" (beside, for bars) or "stack" (under, for covers). */
  layout?: "row" | "stack";
};

/** The drop: blue, a leaf of the product's colour, a white point. */
export function LogoMark({ size = "2.5rem" }: { size?: string }) {
  const id = useId();
  const drop = "M64 4c-5-1-10 3-15 9C33 31 8 50 8 70a42 42 0 0 0 84 0c0-24-14-42-22-58-2-4-3-7-6-8z";
  return (
    <svg class="sy-logo__mark" viewBox="0 0 100 112" style={{ blockSize: size }} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-b`} x1="0.75" y1="0" x2="0.25" y2="1">
          <stop offset="0" style={{ stopColor: "var(--sy-logo-drop-hi)" }} />
          <stop offset="1" style={{ stopColor: "var(--sy-logo-drop)" }} />
        </linearGradient>
        <linearGradient id={`${id}-l`} x1="0.1" y1="0" x2="0.7" y2="1">
          <stop offset="0" style={{ stopColor: "var(--sy-logo-leaf-hi)", stopOpacity: 0.35 }} />
          <stop offset="0.55" style={{ stopColor: "var(--sy-logo-leaf)", stopOpacity: 0.8 }} />
          <stop offset="1" style={{ stopColor: "var(--sy-logo-leaf)" }} />
        </linearGradient>
        <linearGradient id={`${id}-w`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" style={{ stopColor: "var(--sy-logo-leaf-hi)", stopOpacity: 0.15 }} />
          <stop offset="1" style={{ stopColor: "var(--sy-logo-leaf-hi)", stopOpacity: 0.7 }} />
        </linearGradient>
        <clipPath id={`${id}-c`}>
          <path d={drop} />
        </clipPath>
      </defs>
      <path d={drop} fill={`url(#${id}-b)`} />
      <g clip-path={`url(#${id}-c)`}>
        <path d="M67 5C63 24 52 38 50 58c-2 22-8 38-16 54h66V5z" fill={`url(#${id}-l)`} />
        <path d="M38 104c14-12 32-16 62-12v20H38z" fill={`url(#${id}-w)`} />
      </g>
      <circle cx="29" cy="60" r="5.5" fill="#fff" />
    </svg>
  );
}

/**
 * The Syli logo: the drop and "syli <product>". Its accessible name is the
 * wordmark (the drop is decoration); markOnly gets "Syli <product>" as its
 * name. Never flips in Arabic.
 */
export function Logo({ product = "health", size = "2.5rem", markOnly = false, tagline, layout = "row" }: LogoProps) {
  if (markOnly) {
    return (
      <span class={`sy-logo sy-logo--${product}`} role="img" aria-label={`Syli ${names[product]}`}>
        <LogoMark size={size} />
      </span>
    );
  }
  return (
    <span class={`sy-logo sy-logo--${product} sy-logo--${layout}`} style={{ "--sy-logo-size": size }} dir="ltr">
      <LogoMark size={size} />
      <span class="sy-logo__words">
        <span class="sy-logo__word">
          <span class="sy-logo__syli">syli</span> <span class="sy-logo__product">{names[product]}</span>
        </span>
        {tagline && <span class="sy-logo__tagline">{tagline}</span>}
      </span>
    </span>
  );
}
