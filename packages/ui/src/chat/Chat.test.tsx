import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/preact";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import { violations } from "../testing.tsx";
import { Messenger } from "./Chat.tsx";
import { demoConversations, demoTransport, me } from "./fixtures.ts";

const messenger = (initial?: string) => render(<Messenger conversations={demoConversations} me={me} transport={demoTransport(0.01)} initial={initial} />);

const log = () => screen.getByRole("log", { name: "Messages" });

describe("Messenger", () => {
  test("no axe violation, list and thread", async () => {
    const { container } = messenger("toure");
    await waitFor(() => expect(within(log()).getAllByRole("listitem").length).toBeGreaterThan(3));
    expect(await violations(container)).toEqual([]);
  });

  test("conversations say their last words and unread count", () => {
    messenger();
    const nav = screen.getByRole("navigation", { name: "Conversations" });
    expect(within(nav).getByRole("button", { name: /Équipe pharmacie,.*2 non lus/ })).toBeTruthy();
    expect(screen.getByText("Choisissez une conversation.")).toBeTruthy();
  });

  test("sending: my message shows at once, gets sent then read, the other side types and answers (announced)", async () => {
    const user = userEvent.setup();
    messenger("toure");
    const field = await screen.findByRole("textbox", { name: "Message à Dr Aminata Touré" });
    await waitFor(() => expect(log().getAttribute("aria-busy")).toBeNull());
    await user.type(field, "Avez-vous reçu l’ordonnance ?{Enter}");
    expect(within(log()).getByText("Avez-vous reçu l’ordonnance ?")).toBeTruthy();
    expect((field as HTMLTextAreaElement).value).toBe("");
    await waitFor(() => expect(within(log()).getAllByText("Lu").length).toBeGreaterThan(2));
    await waitFor(() => expect(within(log()).getByText("Entendu, merci.")).toBeTruthy());
    await waitFor(() => expect(document.querySelector("[data-sy-announcer]")?.textContent).toContain("Dr Aminata Touré : Entendu, merci."));
  });

  test("a message sent before the history came stays after it", async () => {
    const user = userEvent.setup();
    messenger("toure");
    // At once, before the history (400 ms at full speed, 4 ms here) is back.
    await user.type(screen.getByRole("textbox", { name: /Message à/ }), "Vite{Enter}");
    await waitFor(() => expect(log().getAttribute("aria-busy")).toBeNull());
    await waitFor(() => expect(within(log()).getAllByRole("listitem").length).toBeGreaterThan(5));
    expect(within(log()).getByText("Vite")).toBeTruthy();
  });

  test("Shift+Enter starts a new line; Enter while an input method composes sends nothing", async () => {
    const user = userEvent.setup();
    messenger("toure");
    const field = (await screen.findByRole("textbox", { name: /Message à/ })) as HTMLTextAreaElement;
    await user.type(field, "ligne 1{Shift>}{Enter}{/Shift}ligne 2");
    expect(field.value).toBe("ligne 1\nligne 2");
    fireEvent.keyDown(field, { key: "Enter", isComposing: true });
    fireEvent.keyDown(field, { key: "Enter", keyCode: 229 });
    expect(field.value).toBe("ligne 1\nligne 2");
  });

  test("a failed message says so and can be sent again", async () => {
    const user = userEvent.setup();
    messenger("laborex");
    const field = await screen.findByRole("textbox", { name: /Message à/ });
    await user.type(field, "Test #échec{Enter}");
    const retry = await screen.findByRole("button", { name: "Réessayer" });
    expect(within(log()).getByText(/Échec de l’envoi/)).toBeTruthy();
    await user.click(retry);
    // Still failing (it holds #échec), but sent again: one message, not two.
    await waitFor(() => expect(within(log()).getAllByText("Test #échec")).toHaveLength(1));
  });

  test("a message from another conversation raises its unread count", async () => {
    messenger("toure");
    const nav = screen.getByRole("navigation", { name: "Conversations" });
    await waitFor(() => expect(within(nav).getByRole("button", { name: /Laborex Guinée,Le camion est parti.*1 non lu/ })).toBeTruthy(), { timeout: 2000 });
    await act(async () => within(nav).getByRole("button", { name: /Laborex Guinée/ }).click());
    expect(within(nav).getByRole("button", { name: /Laborex Guinée/ }).textContent).not.toMatch(/non lu/);
  });
});
