export type SkeletonProps = {
  /** text: a line; circle: an avatar or an icon; block: a card, a figure. */
  shape?: "text" | "circle" | "block";
  /** Any CSS length: "60%", "8rem". Text lines vary by default. */
  width?: string;
  height?: string;
};

/**
 * The shape of content while it loads: never a spinner for content. Hidden
 * from assistive technologies; the container says it is busy (aria-busy) and
 * the result is announced once it is there.
 */
export function Skeleton({ shape = "text", width, height }: SkeletonProps) {
  return (
    <span
      class={`sy-skeleton sy-skeleton--${shape}`}
      aria-hidden="true"
      style={{ ...(width && { inlineSize: width }), ...(height && { blockSize: height }) }}
    />
  );
}
