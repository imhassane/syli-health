/** Pure rules of the week: no DOM, tested on their own. */

export type ScheduleEvent = {
  id: string;
  start: Date;
  end: Date;
  title: string;
  /** Who or where: "Kadiatou Barry", "Salle 2". */
  detail?: string;
  tone?: "info" | "success" | "warning" | "danger" | "violet" | "neutral";
};

/** Midnight of the Monday of the week holding `day` (weeks start on Monday). */
export function mondayOf(day: Date) {
  const d = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

export const addDays = (day: Date, n: number) => new Date(day.getFullYear(), day.getMonth(), day.getDate() + n);

export const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export type Placed = ScheduleEvent & {
  /** Grid rows in quarter hours from startHour, 1-based, end exclusive. */
  row: [number, number];
  /** Its lane among the events it overlaps, and their number. */
  lane: number;
  lanes: number;
};

/**
 * The events of one day placed on quarter-hour rows between startHour and
 * endHour (clipped to them), side by side where they overlap: each cluster
 * of overlapping events shares the width, in as few lanes as it needs.
 */
export function placeDay(events: ScheduleEvent[], day: Date, startHour: number, endHour: number): Placed[] {
  const quarter = (d: Date) => (d.getHours() - startHour) * 4 + Math.round(d.getMinutes() / 15);
  const last = (endHour - startHour) * 4;
  const mine = events
    .filter((e) => sameDay(e.start, day))
    .sort((a, b) => a.start.getTime() - b.start.getTime() || b.end.getTime() - a.end.getTime());
  const placed: Placed[] = [];
  let cluster: Placed[] = [];
  let clusterEnd = -Infinity;
  const close = () => {
    const lanes = Math.max(1, ...cluster.map((e) => e.lane + 1));
    for (const e of cluster) e.lanes = lanes;
    cluster = [];
  };
  for (const event of mine) {
    const from = Math.max(0, Math.min(last - 1, quarter(event.start)));
    const to = Math.max(from + 1, Math.min(last, quarter(event.end)));
    if (from >= clusterEnd) {
      close();
      clusterEnd = -Infinity;
    }
    // The first lane free at this time.
    const busy = new Set(cluster.filter((e) => e.row[1] - 1 > from).map((e) => e.lane));
    let lane = 0;
    while (busy.has(lane)) lane++;
    const item: Placed = { ...event, row: [from + 1, to + 1], lane, lanes: 1 };
    cluster.push(item);
    placed.push(item);
    clusterEnd = Math.max(clusterEnd, to);
  }
  close();
  return placed;
}
