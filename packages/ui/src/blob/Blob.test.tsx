import { render } from "@testing-library/preact";
import { describe, expect, test } from "vitest";
import { storiesOf, violations } from "../testing.tsx";
import * as stories from "./Blob.stories.tsx";
import { Blob } from "./Blob.tsx";
import { blobShapes } from "./shapes.ts";

describe("Blob", () => {
  test.each(storiesOf(stories))("story %s has no axe violation", async (_name, Story) => {
    const { container } = render(<Story />);
    expect(await violations(container)).toEqual([]);
  });

  test("ten shapes, each a single path; decoration hidden from assistive technologies", () => {
    expect(blobShapes).toHaveLength(10);
    const { container } = render(<Blob shape={7} />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("aria-hidden")).toBe("true");
    expect(svg.querySelectorAll("path")).toHaveLength(1);
  });

  test("each blob has its own gradient id (several on one page)", () => {
    const { container } = render(<><Blob shape={1} /><Blob shape={1} /></>);
    const ids = [...container.querySelectorAll("linearGradient")].map((g) => g.id);
    expect(new Set(ids).size).toBe(2);
  });
});
