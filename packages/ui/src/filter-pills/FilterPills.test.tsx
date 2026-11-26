import { render, screen } from "@testing-library/preact";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import { storiesOf, violations } from "../testing.tsx";
import * as stories from "./FilterPills.stories.tsx";

describe("FilterPills", () => {
  test.each(storiesOf(stories))("story %s has no axe violation", async (_name, Story) => {
    const { container } = render(<Story />);
    expect(await violations(container)).toEqual([]);
  });

  test("a named group of toggle buttons, one pressed", async () => {
    render(storiesOf(stories)[0][1]());
    expect(screen.getByRole("group", { name: "Filtrer le stock" })).toBeTruthy();
    const low = screen.getByRole("button", { name: /Stocks faibles/ });
    expect(low.getAttribute("aria-pressed")).toBe("false");
    await userEvent.click(low);
    expect(low.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: /Tous/ }).getAttribute("aria-pressed")).toBe("false");
  });
});
