import { render } from "@testing-library/preact";
import { describe, expect, test } from "vitest";
import { storiesOf, violations } from "../testing.tsx";
import * as stories from "./Skeleton.stories.tsx";
import { Skeleton } from "./Skeleton.tsx";

describe("Skeleton", () => {
  test.each(storiesOf(stories))("story %s has no axe violation", async (_name, Story) => {
    const { container } = render(<Story />);
    expect(await violations(container)).toEqual([]);
  });

  test("hidden from assistive technologies, sized when asked", () => {
    const { container } = render(<Skeleton width="8rem" />);
    const shape = container.firstElementChild as HTMLElement;
    expect(shape.getAttribute("aria-hidden")).toBe("true");
    expect(shape.style.inlineSize).toBe("8rem");
  });
});
