import { render } from "@testing-library/preact";
import { describe, expect, test } from "vitest";
import { storiesOf, violations } from "../testing.tsx";
import * as stories from "./StatusPill.stories.tsx";
import { StatusPill } from "./StatusPill.tsx";

describe("StatusPill", () => {
  test.each(storiesOf(stories))("story %s has no axe violation", async (_name, Story) => {
    const { container } = render(<Story />);
    expect(await violations(container)).toEqual([]);
  });

  test("read as its words only: the icon is decorative", () => {
    const { container } = render(<StatusPill tone="success">Prête</StatusPill>);
    expect(container.textContent).toBe("Prête");
    expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  });
});
