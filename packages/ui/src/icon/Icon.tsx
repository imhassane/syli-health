/** Line icons, 24 × 24, drawn with currentColor. Decorative unless labelled. */
const paths = {
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-3.5-3.5",
  scan: "M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2M7 12h10",
  close: "M6 6l12 12M18 6 6 18",
  check: "M5 12l5 5 9-10",
  checks: "M2 12.5l4.5 4.5 9-10M11 16l1 1 9-10",
  send: "M4 12 20 4l-4 16-4.5-6.5zM11.5 13.5 20 4",
  chat: "M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8l-5 4v-4H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z",
  calendar: "M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM4 10h16M8 3v4M16 3v4",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 3",
  warning: "M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z",
  alert: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 8v5M12 16h.01",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 8h.01",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  chevronDown: "M6 9l6 6 6-6",
  chevronStart: "M15 6l-6 6 6 6",
  chevronEnd: "M9 6l6 6-6 6",
  sort: "M8 9l4-4 4 4M8 15l4 4 4-4",
  sortUp: "M8 14l4-4 4 4",
  sortDown: "M8 10l4 4 4-4",
  filter: "M4 6h16M7 12h10M10 18h4",
  pill: "M10.5 20.5a5 5 0 0 1-7-7l6-6a5 5 0 0 1 7 7zM8.5 8.5l7 7",
  rx: "M6 3h9l4 4v14H6zM14 3v5h5M9 13h6M9 17h4",
  bag: "M5 8h14l-1 13H6zM9 8V6a3 3 0 0 1 6 0v2",
  home: "M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z",
  cart: "M3 4h2l2.4 11h11.2L21 7H6.2M9 20h.01M18 20h.01",
  people: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21c1-4 4-6 7-6s6 2 7 6M17 11a3 3 0 1 0 0-6M17 14c2.5.3 4.3 2.2 5 5",
  money: "M3 7h18v10H3zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  box: "M3 7l9-4 9 4-9 4zM3 7v10l9 4 9-4V7M12 11v10",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
  moon: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z",
  wifiOff: "M2 8.5a15 15 0 0 1 4.5-2.9M10 5.1A15 15 0 0 1 22 8.5M5 12a10 10 0 0 1 3.5-2.3M15.5 9.7A10 10 0 0 1 19 12M8.5 15.5a5 5 0 0 1 7 0M12 19h.01M3 3l18 18",
  refresh: "M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7",
} as const;

export type IconName = keyof typeof paths;

/** `flip`: a directional icon (chevron, arrow) mirrored in right-to-left text. */
export function Icon({ name, size = 20, label, flip }: { name: IconName; size?: number; label?: string; flip?: boolean }) {
  return (
    <svg
      class={flip ? "sy-icon sy-icon--flip" : "sy-icon"}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": "true" })}
    >
      <path d={paths[name]} />
    </svg>
  );
}

export const iconNames = Object.keys(paths) as IconName[];
