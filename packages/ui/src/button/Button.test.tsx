import { render, screen } from "@testing-library/preact";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { storiesOf, violations } from "../testing.tsx";
import * as stories from "./Button.stories.tsx";
import { Button, IconButton } from "./Button.tsx";

describe("Button", () => {
  test.each(storiesOf(stories))("story %s has no axe violation", async (_name, Story) => {
    const { container } = render(<Story />);
    expect(await violations(container)).toEqual([]);
  });

  test("a type of button by default, never an accidental submit", () => {
    render(<Button>Inventaire</Button>);
    expect(screen.getByRole("button", { name: "Inventaire" }).getAttribute("type")).toBe("button");
  });

  test("loading: keeps its name and focus, its click does nothing", async () => {
    const onClick = vi.fn();
    render(<Button loading onClick={onClick}>Encaisser</Button>);
    const button = screen.getByRole("button", { name: "Encaisser" });
    expect(button.getAttribute("aria-disabled")).toBe("true");
    expect(button.getAttribute("aria-busy")).toBe("true");
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
    button.focus();
    expect(document.activeElement).toBe(button);
  });

  test("an icon button is named by its label", async () => {
    const onClick = vi.fn();
    render(<IconButton icon="close" label="Fermer" onClick={onClick} />);
    await userEvent.click(screen.getByRole("button", { name: "Fermer" }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
