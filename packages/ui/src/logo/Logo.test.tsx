import { render, screen } from "@testing-library/preact";
import { describe, expect, test } from "vitest";
import { storiesOf, violations } from "../testing.tsx";
import * as stories from "./Logo.stories.tsx";
import { Logo } from "./Logo.tsx";

describe("Logo", () => {
  test.each(storiesOf(stories))("story %s has no axe violation", async (_name, Story) => {
    const { container } = render(<Story />);
    expect(await violations(container)).toEqual([]);
  });

  test("named by its words; the drop alone is an image named after the product", () => {
    const { container } = render(<Logo product="pharmacie" />);
    expect(container.textContent).toBe("syli pharmacie");
    expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
    render(<Logo product="labo" markOnly />);
    expect(screen.getByRole("img", { name: "Syli labo" })).toBeTruthy();
  });

  test("never flips in Arabic", () => {
    const { container } = render(<Logo />);
    expect(container.firstElementChild?.getAttribute("dir")).toBe("ltr");
  });
});
