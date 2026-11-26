import { act, render, screen, waitFor, within } from "@testing-library/preact";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import { storiesOf, violations } from "../testing.tsx";
import * as stories from "./Toaster.stories.tsx";
import { resetToasts, toast } from "./toast-store.ts";
import { Toaster } from "./Toaster.tsx";

afterEach(() => {
  act(() => resetToasts());
  vi.useRealTimers();
});

const announcer = () => document.querySelector("[data-sy-announcer]");
const region = () => within(screen.getByRole("region", { name: "Notifications" }));

describe("Toaster", () => {
  test.each(storiesOf(stories))("story %s has no axe violation", async (_name, Story) => {
    const { container } = render(<Story />);
    await new Promise((r) => setTimeout(r, 20));
    expect(await violations(container)).toEqual([]);
  });

  test("a named region, always in the page; a toast is announced without taking the focus", async () => {
    render(
      <>
        <button type="button">Encaisser</button>
        <Toaster />
      </>,
    );
    const region = screen.getByRole("region", { name: "Notifications" });
    screen.getByRole("button", { name: "Encaisser" }).focus();
    act(() => {
      toast.success("Vente encaissée", { detail: "29 400 GNF" });
    });
    expect(region.textContent).toContain("Vente encaissée");
    expect(document.activeElement?.textContent).toBe("Encaisser");
    await waitFor(() => expect(announcer()?.textContent).toBe("Vente encaissée. 29 400 GNF"));
  });

  test("an action is announced as available, acts and closes the toast", async () => {
    const onUndo = vi.fn();
    render(<Toaster />);
    act(() => {
      toast.info("Réservation prête", { action: { label: "Annuler", onClick: onUndo } });
    });
    await waitFor(() => expect(announcer()?.textContent).toBe("Réservation prête. Action disponible."));
    await userEvent.click(screen.getByRole("button", { name: "Annuler" }));
    expect(onUndo).toHaveBeenCalledOnce();
    await waitFor(() => expect(region().queryByText("Réservation prête")).toBeNull());
  });

  test("closed by its named button, or by Escape", async () => {
    render(<Toaster />);
    act(() => {
      toast.warning("Hors ligne", { duration: 0 });
      toast.success("Vente encaissée", { duration: 0 });
    });
    await userEvent.click(screen.getByRole("button", { name: "Fermer la notification : Hors ligne" }));
    await waitFor(() => expect(region().queryByText("Hors ligne")).toBeNull());
    screen.getByRole("button", { name: "Fermer la notification : Vente encaissée" }).focus();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(region().queryByText("Vente encaissée")).toBeNull());
  });

  test("goes by itself after its time; an error stays", () => {
    vi.useFakeTimers();
    render(<Toaster />);
    act(() => {
      toast.success("Vente encaissée");
      toast.error("Paiement refusé");
    });
    act(() => {
      vi.advanceTimersByTime(5400);
    });
    expect(region().queryByText("Vente encaissée")).toBeNull();
    expect(region().getByText("Paiement refusé")).toBeTruthy();
  });

  test("a loading toast becomes a success under the same id", () => {
    render(<Toaster />);
    let id = "";
    act(() => {
      id = toast.loading("Synchronisation…");
    });
    act(() => {
      toast.success("Synchronisé", { id });
    });
    expect(region().queryByText("Synchronisation…")).toBeNull();
    expect(region().getByText("Synchronisé")).toBeTruthy();
  });
});
