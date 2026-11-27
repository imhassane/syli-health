import { render, screen, within } from "@testing-library/preact";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import { storiesOf, story, violations } from "../testing.tsx";
import { pharmacyWeek } from "./fixtures.ts";
import * as stories from "./Schedule.stories.tsx";
import { Schedule } from "./Schedule.tsx";
import { mondayOf, placeDay } from "./week.ts";

const now = new Date(2026, 10, 25, 10, 40);
const monday = mondayOf(now);

describe("week rules", () => {
  test("weeks start on Monday", () => {
    expect(monday.getDay()).toBe(1);
    expect(monday.getDate()).toBe(23);
    expect(mondayOf(new Date(2026, 10, 29)).getDate()).toBe(23); // a Sunday
  });

  test("overlapping events share the width, in as few lanes as they need", () => {
    const placed = placeDay(pharmacyWeek(monday), new Date(2026, 10, 25), 8, 19);
    // 10:00-10:30, 10:15-11:00, 10:30-11:30: three overlap at 10:15-10:30 then two.
    expect(placed.map((p) => [p.title, p.lane, p.lanes])).toEqual([
      ["Entretien pharmaceutique", 0, 2],
      ["Vaccination", 1, 2],
      ["Visite délégué", 0, 2],
    ]);
    expect(placed[0].row).toEqual([9, 11]); // 10:00 is the 9th quarter from 8:00
  });

  test("events outside the hours are clipped to them", () => {
    const placed = placeDay([{ id: "x", start: new Date(2026, 10, 25, 6), end: new Date(2026, 10, 25, 22), title: "Garde" }], new Date(2026, 10, 25), 8, 19);
    expect(placed[0].row).toEqual([1, 45]);
  });
});

describe("Schedule", () => {
  test.each(storiesOf(stories))("story %s has no axe violation", async (_name, Story) => {
    const { container } = render(<Story />);
    expect(await violations(container)).toEqual([]);
  });

  test("each day is a section named by its date with its events as a list; today is marked", () => {
    render(<Schedule label="Planning" events={pharmacyWeek(monday)} now={now} />);
    const wednesday = screen.getByRole("region", { name: /mer\. 25/ });
    expect(within(wednesday).getAllByRole("listitem")).toHaveLength(3);
    expect(within(wednesday).getByRole("heading").getAttribute("aria-current")).toBe("date");
    expect(within(wednesday).getByRole("button", { name: /10:00–10:30 Entretien pharmaceutique Oumar Condé/ })).toBeTruthy();
    // A day without events says so.
    expect(within(screen.getByRole("region", { name: /sam\. 28/ })).getByText("Aucun rendez-vous.")).toBeTruthy();
  });

  test("weeks go back and forth; Today comes back", async () => {
    const user = userEvent.setup();
    const weeks: number[] = [];
    render(<Schedule label="Planning" events={[]} now={now} onWeekChange={(m) => weeks.push(m.getDate())} />);
    await user.click(screen.getByRole("button", { name: "Semaine suivante" }));
    expect(screen.getByText(/30 nov\. – 5 déc\. 2026/)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Semaine précédente" }));
    await user.click(screen.getByRole("button", { name: "Semaine précédente" }));
    await user.click(screen.getByRole("button", { name: "Aujourd’hui" }));
    expect(weeks).toEqual([30, 23, 16, 23]);
  });

  test("an event opens", async () => {
    const user = userEvent.setup();
    render(story(stories, "WeekView")());
    await user.click(screen.getByRole("button", { name: /Garde/ }));
    expect(await screen.findByRole("dialog", { name: "Garde" })).toBeTruthy();
  });

  test("the day picker (narrow frames) says how many appointments each day holds", async () => {
    const user = userEvent.setup();
    render(<Schedule label="Planning" events={pharmacyWeek(monday)} now={now} />);
    const picker = screen.getByRole("group", { name: "Jours de la semaine" });
    const wednesday = within(picker).getByRole("button", { name: /25, 3 rendez-vous/ });
    expect(wednesday.getAttribute("aria-pressed")).toBe("true");
    await user.click(within(picker).getByRole("button", { name: /28, Aucun rendez-vous/ }));
    expect(screen.getByRole("region", { name: /sam\. 28/ }).hasAttribute("data-selected")).toBe(true);
  });
});
