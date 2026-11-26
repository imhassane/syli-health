import { render, screen } from "@testing-library/preact";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import { storiesOf, violations } from "../testing.tsx";
import * as stories from "./ThemeToggle.stories.tsx";
import { ThemeToggle } from "./ThemeToggle.tsx";

describe("ThemeToggle", () => {
  test.each(storiesOf(stories))("story %s has no axe violation", async (_name, Story) => {
    const { container } = render(<Story />);
    expect(await violations(container)).toEqual([]);
  });

  test("a named group of radios; dark forces the page dark, system lets it follow", async () => {
    render(<ThemeToggle />);
    expect(screen.getByRole("group", { name: "Thème" })).toBeTruthy();
    await userEvent.click(screen.getByRole("radio", { name: "Sombre" }));
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem("syli.theme")).toBe("dark");
    await userEvent.click(screen.getByRole("radio", { name: "Système" }));
    expect(document.documentElement.dataset.theme).toBeUndefined();
    expect(localStorage.getItem("syli.theme")).toBeNull();
  });
});
