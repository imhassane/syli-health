import { render, screen, waitFor } from "@testing-library/preact";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import { storiesOf, story, violations } from "../testing.tsx";
import * as stories from "./Modal.stories.tsx";

describe("Modal", () => {
  test.each(storiesOf(stories))("story %s has no axe violation", async (_name, Story) => {
    const { container } = render(<Story />);
    expect(await violations(container)).toEqual([]);
  });

  test("a native dialog named by its heading, described, without role or aria-modal", () => {
    render(story(stories, "Form")());
    const dialog = screen.getByRole("dialog", { name: "Nouvelle réception" });
    expect(dialog.tagName).toBe("DIALOG");
    expect(dialog.getAttribute("role")).toBeNull();
    expect(dialog.getAttribute("aria-modal")).toBeNull();
    expect(screen.getByRole("heading", { level: 1, name: "Nouvelle réception" })).toBeTruthy();
    expect(document.getElementById(dialog.getAttribute("aria-describedby")!)?.textContent).toContain("Les quantités");
  });

  test("the close button closes it", async () => {
    render(story(stories, "Form")());
    const dialog = screen.getByRole("dialog") as HTMLDialogElement;
    await userEvent.click(screen.getByRole("button", { name: "Fermer" }));
    await waitFor(() => expect(dialog.open).toBe(false));
    expect(dialog.childElementCount).toBe(0);
  });

  test("a confirmation focuses the safe answer and names the costly one", async () => {
    render(story(stories, "ConfirmClosed")());
    await userEvent.click(screen.getByRole("button", { name: "Supprimer le lot A2307" }));
    await waitFor(() => expect(document.activeElement?.textContent).toBe("Garder le lot"));
    await userEvent.click(screen.getByRole("button", { name: "Supprimer le lot" }));
    expect(screen.getByRole("status").textContent).toBe("Lot supprimé.");
  });
});
