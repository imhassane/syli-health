import { render, screen } from "@testing-library/preact";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import { storiesOf, story, violations } from "../testing.tsx";
import * as stories from "./ClinicalAlert.stories.tsx";

describe("ClinicalAlert", () => {
  test.each(storiesOf(stories))("story %s has no axe violation", async (_name, Story) => {
    const { container } = render(<Story />);
    expect(await violations(container)).toEqual([]);
  });

  test("a region named by the interaction, its level in words, a real checkbox", async () => {
    render(story(stories, "Caution")());
    expect(screen.getByRole("region", { name: "Interaction : ciprofloxacine + glibenclamide" })).toBeTruthy();
    expect(screen.getByText("Précaution d’emploi")).toBeTruthy();
    const box = screen.getByRole("checkbox", { name: "Conseil donné au patient" }) as HTMLInputElement;
    await userEvent.click(box);
    expect(box.checked).toBe(true);
  });
});
