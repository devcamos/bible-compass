// @vitest-environment happy-dom
import "fake-indexeddb/auto";
import { IDBFactory } from "fake-indexeddb";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SavedPagesProvider } from "@/components/SavedPagesProvider";
import { SavedPageActions } from "@/components/SavedPageActions";
import { SavedPagesList } from "@/components/SavedPagesList";
import { SavedPagesProfileLink } from "@/components/SavedPagesProfileLink";
import { SavedPagesClient } from "@/lib/saved-pages-client";
import * as lib from "@/lib/saved-pages";

const catalog = [{ path: "/a", title: "Alpha", context: "ctx" }, { path: "/b", title: "Beta", context: "ctx" }];
const ui = (children: React.ReactNode) => render(<SavedPagesProvider catalog={catalog}>{children}</SavedPagesProvider>);
beforeEach(() => { Object.defineProperty(window, "indexedDB", { value: new IDBFactory(), configurable: true }); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("saved pages UI", () => {
  it("saves, lists, removes and undoes", async () => {
    ui(<><SavedPageActions path="/a" /><SavedPagesList /><SavedPagesProfileLink onOpen={() => {}} /></>);
    await screen.findByText("No saved pages yet.");
    fireEvent.click(screen.getByText("Save page"));
    await screen.findByText("Saved on this device.");
    expect(await screen.findByText("1 saved page · newest saves first")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Remove Alpha"));
    await screen.findByText("Page removed. You can undo this removal.");
    fireEvent.click(screen.getAllByText("Undo removal")[0]);
    await screen.findByText("Page restored.");
    fireEvent.click(screen.getByText("Saved"));
    await screen.findByText("Removed from saved pages.");
    fireEvent.click(screen.getByText("Undo removal"));
    await waitFor(() => expect(screen.getByText("Saved")).toBeTruthy());
    fireEvent.click(screen.getByText("Saved pages"));
  });
  it("shows failures and errors with retry", async () => {
    vi.spyOn(SavedPagesClient.prototype, "act").mockRejectedValueOnce(new lib.SavedPagesError("nope")).mockRejectedValueOnce(new Error("x"));
    ui(<SavedPageActions path="/a" />);
    const btn = await screen.findByText("Save page");
    await waitFor(() => expect((btn.closest("button") as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(btn); await screen.findByText("nope");
    fireEvent.click(screen.getByText("Save page")); await screen.findByText(/couldn't be saved/);
  });
  it("list remove/undo failures and error state", async () => {
    const db = await lib.openSavedPages(window.indexedDB);
    await lib.mutateSavedPage(db, new Set(["/a", "/b"]), { type: "save", path: "/a" }); db.close();
    ui(<SavedPagesList />);
    await screen.findByText("Alpha");
    vi.spyOn(SavedPagesClient.prototype, "act").mockRejectedValueOnce(new Error("x"));
    fireEvent.click(screen.getByLabelText("Remove Alpha")); await screen.findByText(/couldn't be removed/);
    vi.restoreAllMocks();
    fireEvent.click(screen.getByLabelText("Remove Alpha")); await screen.findByText(/Page removed/);
    vi.spyOn(SavedPagesClient.prototype, "act").mockRejectedValueOnce(new lib.SavedPagesError("blocked"));
    fireEvent.click(screen.getByText("Undo removal")); await screen.findByText("blocked");
  });
  it("shows an error state with retry when storage cannot open", async () => {
    Object.defineProperty(window, "indexedDB", { value: { open: () => { throw new Error("x"); } }, configurable: true });
    ui(<><SavedPagesList /><SavedPageActions path="/a" /><SavedPagesProfileLink onOpen={() => {}} /></>);
    await screen.findAllByText(/couldn't be opened safely/);
    await act(async () => { for (const b of screen.getAllByText("Try again")) fireEvent.click(b); });
    expect(screen.getByText("Unavailable")).toBeTruthy();
  });
  it("client handles broadcast failures and visibility", async () => {
    const c = new SavedPagesClient(catalog);
    const BC = globalThis.BroadcastChannel; (globalThis as { BroadcastChannel: unknown }).BroadcastChannel = function () { throw new Error(); };
    const stop = c.start(); await c.refresh();
    document.dispatchEvent(new Event("visibilitychange")); stop();
    (globalThis as { BroadcastChannel: unknown }).BroadcastChannel = BC;
    const c2 = new SavedPagesClient(catalog); const stop2 = c2.start(); await c2.act({ type: "save", path: "/b" }); stop2();
    expect(c2.getServerSnapshot().state).toBe("loading");
  });
  it("profile link focuses an already mounted heading", async () => {
    document.body.innerHTML = '<h1 id="saved-pages-heading" tabindex="-1">S</h1>';
    const raf = vi.spyOn(window, "requestAnimationFrame").mockImplementation(cb => { cb(0); return 1; });
    const onOpen = vi.fn(); ui(<SavedPagesProfileLink onOpen={onOpen} />);
    fireEvent.click(screen.getByText("Saved pages")); fireEvent.click(screen.getByText("Saved pages"));
    expect(onOpen).toHaveBeenCalled(); raf.mockRestore();
  });
  it("list focuses the heading when opened by hash", async () => {
    window.location.hash = "#saved-pages-heading";
    ui(<><h1 id="saved-pages-heading" tabIndex={-1}>S</h1><SavedPagesList /></>);
    await screen.findByText("No saved pages yet."); window.location.hash = "";
  });
});
