import { render, screen } from "@testing-library/preact";
import { describe, expect, test } from "vitest";
import { storiesOf, violations } from "../testing.tsx";
import * as stories from "./StatCard.stories.tsx";

describe("StatCard", () => {
  test.each(storiesOf(stories))("story %s has no axe violation", async (_name, Story) => {
    const { container } = render(<Story />);
    expect(await violations(container)).toEqual([]);
  });

  test("the grid is a named region, each figure a term and its value", () => {
    render(storiesOf(stories)[0][1]());
    expect(screen.getByRole("region", { name: "Chiffres du jour" })).toBeTruthy();
    expect(screen.getAllByRole("term").map((t) => t.textContent)).toContain("Ventes du jour");
  });
});
