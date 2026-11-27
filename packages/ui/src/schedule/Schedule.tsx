import type { ComponentChildren } from "preact";
import { useEffect, useId, useMemo, useState } from "preact/hooks";
import { Button, IconButton } from "../button/Button.tsx";
import { useI18n } from "../i18n/I18n.tsx";
import { addDays, mondayOf, placeDay, sameDay, type ScheduleEvent } from "./week.ts";

export type { ScheduleEvent } from "./week.ts";

export type ScheduleProps = {
  /** The schedule's title: "Planning de la pharmacie", "Rendez-vous". */
  label: string;
  events: ScheduleEvent[];
  /** Any day of the week shown; today by default. */
  week?: Date;
  onWeekChange?: (monday: Date) => void;
  /** Opens an event (a sheet, a page). */
  onOpen?: (event: ScheduleEvent) => void;
  startHour?: number;
  endHour?: number;
  /** Days shown from Monday: 5 (weekdays), 6 or 7. */
  days?: 5 | 6 | 7;
  /** Buttons at the end of the header: "Nouveau rendez-vous". */
  actions?: ComponentChildren;
  /** The present moment (stories, tests); the clock by default. */
  now?: Date;
};

/**
 * A week of appointments, shifts or deliveries. Wide: the days side by side,
 * each event placed at its time and as tall as it lasts. Narrow: a row of
 * days, then the chosen day's events as a list. One markup for both: each day
 * is a section named by its date holding an ordered list of its events, which
 * is what screen readers get in every width.
 */
export function Schedule({ label, events, week, onWeekChange, onOpen, startHour = 8, endHour = 19, days = 6, actions, now: givenNow }: ScheduleProps) {
  const id = useId();
  const { t, plural, date } = useI18n();
  const [clock, setClock] = useState(() => givenNow ?? new Date());
  useEffect(() => {
    if (givenNow) return setClock(givenNow);
    const timer = setInterval(() => setClock(new Date()), 60_000);
    return () => clearInterval(timer);
  }, [givenNow]);
  const now = givenNow ?? clock;

  const [monday, setMonday] = useState(() => mondayOf(week ?? now));
  useEffect(() => {
    if (week) setMonday(mondayOf(week));
  }, [week?.getTime()]);
  const dates = useMemo(() => Array.from({ length: days }, (_, i) => addDays(monday, i)), [monday, days]);
  const [selected, setSelected] = useState(() => Math.max(0, dates.findIndex((d) => sameDay(d, now))));

  const go = (next: Date, day = 0) => {
    setMonday(next);
    setSelected(day);
    onWeekChange?.(next);
  };

  // 24 hours in every language: no morning and evening mixed up.
  const time = (d: Date) => date(d, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const range = `${date(dates[0], { day: "numeric", month: "short" })} – ${date(dates[dates.length - 1], { day: "numeric", month: "short", year: "numeric" })}`;
  const nowRow = (now.getHours() - startHour) * 4 + now.getMinutes() / 15;
  const quarters = (endHour - startHour) * 4;

  return (
    <section class="sy-schedule" aria-labelledby={`${id}-title`} style={{ "--sy-schedule-days": days, "--sy-schedule-quarters": quarters }}>
      <header class="sy-schedule__bar">
        <div class="sy-schedule__heading">
          <h2 class="sy-schedule__title" id={`${id}-title`}>
            {label}
          </h2>
          <p class="sy-schedule__range">{range}</p>
        </div>
        <div class="sy-schedule__nav">
          <IconButton icon="chevronStart" flip label={t("previousWeek")} variant="soft" onClick={() => go(addDays(monday, -7))} />
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const m = mondayOf(new Date(now));
              go(m, Math.min(days - 1, (now.getDay() + 6) % 7));
            }}
          >
            {t("today")}
          </Button>
          <IconButton icon="chevronEnd" flip label={t("nextWeek")} variant="soft" onClick={() => go(addDays(monday, 7))} />
        </div>
        {actions && <div class="sy-schedule__actions">{actions}</div>}
      </header>

      {/* Narrow frames: one day at a time, chosen here. */}
      <div class="sy-schedule__picker" role="group" aria-label={t("weekDays")}>
        {dates.map((d, i) => {
          const count = events.filter((e) => sameDay(e.start, d)).length;
          return (
            <button
              type="button"
              key={i}
              class="sy-schedule__pick"
              aria-pressed={i === selected}
              aria-current={sameDay(d, now) ? "date" : undefined}
              onClick={() => setSelected(i)}
            >
              <span class="sy-schedule__pick-day">{date(d, { weekday: "short" })}</span>
              <span class="sy-schedule__pick-date sy-num">{date(d, { day: "numeric" })}</span>
              {count > 0 && <span class="sy-schedule__dot" aria-hidden="true" />}
              <span class="sy-visually-hidden">{`, ${count > 0 ? plural("appointments", count) : t("noAppointments")}`}</span>
            </button>
          );
        })}
      </div>

      <div class="sy-schedule__scroll">
        <div class="sy-schedule__grid">
          <div class="sy-schedule__hours" aria-hidden="true">
            {hours.map((h) => (
              <span key={h} class="sy-schedule__hour sy-num" style={{ gridRow: `${(h - startHour) * 4 + 1} / span 4` }}>
                {time(new Date(2000, 0, 1, h))}
              </span>
            ))}
          </div>
          {dates.map((d, i) => {
            const placed = placeDay(events, d, startHour, endHour);
            const isToday = sameDay(d, now);
            return (
              <section class="sy-schedule__day" key={d.getTime()} data-selected={i === selected || undefined} aria-labelledby={`${id}-d${i}`}>
                <h3 class="sy-schedule__day-title" id={`${id}-d${i}`} aria-current={isToday ? "date" : undefined}>
                  <span>{date(d, { weekday: "short" })}</span> <span class="sy-num">{date(d, { day: "numeric" })}</span>
                  <span class="sy-visually-hidden">{" " + date(d, { month: "long" })}</span>
                </h3>
                <div class="sy-schedule__slots">
                  {placed.length === 0 && <p class="sy-schedule__empty">{t("noAppointments")}</p>}
                  <ol class="sy-schedule__events">
                    {placed.map((e) => (
                      <li
                        key={e.id}
                        class={`sy-schedule__event sy-schedule__event--${e.tone ?? "info"}`}
                        style={{ gridRow: `${e.row[0]} / ${e.row[1]}`, "--lane": e.lane, "--lanes": e.lanes }}
                        data-short={e.row[1] - e.row[0] <= 2 || undefined}
                      >
                        <button type="button" class="sy-schedule__open" onClick={() => onOpen?.(e)} disabled={!onOpen}>
                          <span class="sy-schedule__time sy-num" dir="ltr">
                            <time dateTime={e.start.toISOString()}>{time(e.start)}</time>–<time dateTime={e.end.toISOString()}>{time(e.end)}</time>
                          </span>{" "}
                          {/* The spaces keep the words apart in the button's name. */}
                          <span class="sy-schedule__what">{e.title}</span>
                          {e.detail && " "}
                          {e.detail && <span class="sy-schedule__who">{e.detail}</span>}
                        </button>
                      </li>
                    ))}
                  </ol>
                  {isToday && nowRow >= 0 && nowRow <= quarters && (
                    <span class="sy-schedule__now" aria-hidden="true" style={{ "--now": nowRow / quarters }} />
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </section>
  );
}
