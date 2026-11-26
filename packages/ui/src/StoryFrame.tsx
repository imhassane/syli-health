import type { ComponentChildren } from "preact";

/** The page around a story: the app's background, some room, a width. */
export function StoryFrame({ children, width }: { children: ComponentChildren; width?: string }) {
  return (
    <main style={{ background: "var(--sy-bg)", color: "var(--sy-ink)", padding: "1.5rem", minBlockSize: "100vh", boxSizing: "border-box" }}>
      <div style={{ maxInlineSize: width ?? "none" }}>{children}</div>
    </main>
  );
}
