import { useId } from "preact/hooks";
import type { JSX } from "preact";
import { blobShapes } from "./shapes.ts";

export type BlobProps = {
  /** 1 to 10, the brand's shapes. */
  shape?: number;
  /** Width in CSS (the height follows the shape). */
  size?: string;
  /** Turned (degrees) or mirrored, so a page never repeats itself. */
  rotate?: number;
  mirror?: boolean;
  class?: string;
  style?: JSX.CSSProperties;
};

/** One of the brand's blobs: decoration only, hidden from assistive technologies. */
export function Blob({ shape = 1, size = "12rem", rotate = 0, mirror = false, class: className, style }: BlobProps) {
  const id = useId();
  const b = blobShapes[(Math.max(1, Math.min(10, shape)) - 1) | 0];
  return (
    <svg
      class={["sy-blob", className].filter(Boolean).join(" ")}
      viewBox={`0 0 ${b.w} ${b.h}`}
      aria-hidden="true"
      focusable="false"
      style={{ inlineSize: size, rotate: `${rotate}deg`, scale: mirror ? "-1 1" : undefined, ...style }}
    >
      <defs>
        <linearGradient id={`${id}-g`} x1={b.g[0]} y1={b.g[1]} x2={b.g[2]} y2={b.g[3]}>
          <stop offset="0" stop-color={b.from} />
          <stop offset="1" stop-color={b.to} />
        </linearGradient>
      </defs>
      <path transform={b.t} d={b.d} fill={`url(#${id}-g)`} />
    </svg>
  );
}

export type BlobFieldProps = {
  /** "corners": two soft blobs at opposite corners (pages); "scatter": a few, larger and fainter (sign-in, empty screens). */
  layout?: "corners" | "scatter";
};

/**
 * Blobs behind a page or a panel, faint and out of the way: set it as the
 * first child of a positioned container. Never over text: the container's
 * content stays above (z-index), and the blobs stay in the corners.
 */
export function BlobField({ layout = "corners" }: BlobFieldProps) {
  return (
    <div class={`sy-blob-field sy-blob-field--${layout}`} aria-hidden="true">
      {layout === "corners" ? (
        <>
          <Blob shape={2} size="clamp(14rem, 34vw, 30rem)" class="sy-blob-field__a" rotate={-12} />
          <Blob shape={6} size="clamp(12rem, 28vw, 26rem)" class="sy-blob-field__b" rotate={18} mirror />
        </>
      ) : (
        <>
          <Blob shape={1} size="clamp(16rem, 40vw, 34rem)" class="sy-blob-field__a" rotate={-8} />
          <Blob shape={4} size="clamp(10rem, 22vw, 18rem)" class="sy-blob-field__b" rotate={24} />
          <Blob shape={9} size="clamp(8rem, 16vw, 14rem)" class="sy-blob-field__c" rotate={-30} mirror />
        </>
      )}
    </div>
  );
}
