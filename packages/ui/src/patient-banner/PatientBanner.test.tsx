import { render, screen } from "@testing-library/preact";
import { describe, expect, test } from "vitest";
import { storiesOf, story, violations } from "../testing.tsx";
import * as stories from "./PatientBanner.stories.tsx";
import { ageOn } from "./PatientBanner.tsx";

describe("PatientBanner", () => {
  test.each(storiesOf(stories))("story %s has no axe violation", async (_name, Story) => {
    const { container } = render(<Story />);
    expect(await violations(container)).toEqual([]);
  });

  test("a region named by the patient; the allergy said in words", () => {
    render(story(stories, "WithAllergy")());
    expect(screen.getByRole("region", { name: "Patient : Ibrahima Sow" })).toBeTruthy();
    expect(screen.getByRole("list", { name: "Allergies et pathologies" }).textContent).toContain("Allergie : pénicillines");
    expect(screen.getByText(/62 ans/)).toBeTruthy();
  });

  test("the age turns on the birthday, not before", () => {
    expect(ageOn("1964-03-14", new Date("2026-03-13T12:00:00"))).toBe(61);
    expect(ageOn("1964-03-14", new Date("2026-03-14T12:00:00"))).toBe(62);
  });
});
