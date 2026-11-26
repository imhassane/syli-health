import { fireEvent, render, screen } from "@testing-library/preact";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import { storiesOf, violations } from "../testing.tsx";
import * as stories from "./Field.stories.tsx";
import { Checkbox, SearchField, TextField } from "./Field.tsx";

describe("Fields", () => {
  test.each(storiesOf(stories))("story %s has no axe violation", async (_name, Story) => {
    const { container } = render(<Story />);
    expect(await violations(container)).toEqual([]);
  });

  test("labelled, valid until touched, the error described only once shown", async () => {
    render(<TextField label="Nom du patient" required error="Indiquez le nom du patient." />);
    const input = screen.getByLabelText("Nom du patient");
    expect(input.getAttribute("aria-invalid")).toBe("false");
    expect(input.getAttribute("aria-describedby")).toBeNull();
    expect(screen.queryByText("Indiquez le nom du patient.")?.closest("[hidden]")).toBeTruthy();

    await userEvent.click(input);
    fireEvent.blur(input);
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toContain("-error");
    expect(screen.getByText("Indiquez le nom du patient.").closest("[hidden]")).toBeNull();

    await userEvent.type(input, "Ibrahima Sow");
    expect(input.getAttribute("aria-invalid")).toBe("false");
  });

  test("a server error is shown at once", () => {
    render(<TextField label="Code de retrait" invalid error="Ce code ne correspond à aucune réservation." />);
    const input = screen.getByLabelText("Code de retrait");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByText("Ce code ne correspond à aucune réservation.")).toBeTruthy();
  });

  test("the hint describes the field", () => {
    render(<TextField label="Téléphone" hint="Pour prévenir le patient." />);
    const input = screen.getByLabelText("Téléphone");
    expect(document.getElementById(input.getAttribute("aria-describedby")!)?.textContent).toBe("Pour prévenir le patient.");
  });

  test("search is a named search box in a search landmark", () => {
    render(<SearchField label="Rechercher un médicament" />);
    expect(screen.getByRole("searchbox", { name: "Rechercher un médicament" })).toBeTruthy();
    expect(screen.getByRole("search")).toBeTruthy();
  });

  test("a switch is a switch", async () => {
    render(<Checkbox label="Prévenir par SMS" switch />);
    const sw = screen.getByRole("switch", { name: "Prévenir par SMS" });
    await userEvent.click(screen.getByText("Prévenir par SMS"));
    expect((sw as HTMLInputElement).checked).toBe(true);
  });
});
