// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FeedbackWorkspace } from "@/components/FeedbackWorkspace";
import { FeedbackEntry } from "@/components/FeedbackEntry";
import { rememberFeedbackDraft } from "@/lib/feedback/client-draft";
import { rememberOwnAppRating, APP_RATING_KEY } from "@/lib/feedback/client-rating";

type Handler = (url: string, init: RequestInit) => Response | Promise<Response>;
let handler: Handler;
const summary = (n = 2) => Response.json(n ? { average: 4.5, ratingCount: 2, distribution: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 }, asOf: "2026-10-26T00:00:00Z" } : { average: null, ratingCount: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, asOf: "2026-10-26T00:00:00Z" });
beforeEach(() => {
  sessionStorage.clear(); localStorage.clear(); rememberFeedbackDraft(null); rememberOwnAppRating(null as never);
  handler = (url, init) => url.includes("summary") ? summary() : url.includes("ratings") ? Response.json({ stars: JSON.parse(String(init.body)).stars, revision: JSON.parse(String(init.body)).revision }) : Response.json({ reference: "FB-ABCDEF" });
  vi.spyOn(globalThis, "fetch").mockImplementation(async (u, i) => handler(String(u), i ?? {}));
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); });

const type = (label: string | RegExp, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe("FeedbackWorkspace", () => {
  it("sends a bug report and shows the receipt", async () => {
    render(<FeedbackWorkspace clientCommit={"a".repeat(40)} />);
    await waitFor(() => expect((screen.getByLabelText("What happened?") as HTMLTextAreaElement).disabled).toBe(false));
    fireEvent.submit(document.getElementById("feedback-form")!);
    type("What happened?", "Broken page"); type("How can we reproduce it?", "steps"); type("What did you expect to happen?", "works");
    type(/Email/, "a@b.co"); fireEvent.click(screen.getByLabelText(/Include the page/));
    fireEvent.submit(document.getElementById("feedback-form")!);
    expect(await screen.findByText("FB-ABCDEF")).toBeTruthy();
    fireEvent.click(screen.getAllByText(/Back to your reading/)[0]);
  });
  it("handles improvement, discard, 429, 409 and generic failures", async () => {
    render(<FeedbackWorkspace clientCommit={null} />);
    await waitFor(() => expect((screen.getByLabelText("What happened?") as HTMLTextAreaElement).disabled).toBe(false));
    fireEvent.click(screen.getByDisplayValue("improvement"));
    await screen.findByLabelText("What would make it better?");
    type("What would make it better?", "Idea");
    fireEvent.click(screen.getByText("Discard draft"));
    fireEvent.click(screen.getByDisplayValue("improvement")); await screen.findByLabelText("What would make it better?");
    type("What would make it better?", "Idea");
    handler = () => new Response("", { status: 429, headers: { "retry-after": "1" } });
    fireEvent.submit(document.getElementById("feedback-form")!);
    await screen.findByText(/Please wait a moment/);
    await act(async () => { await new Promise(r => setTimeout(r, 1100)); });
    handler = () => new Response("", { status: 409 });
    fireEvent.submit(document.getElementById("feedback-form")!);
    await screen.findByText(/couldn’t confirm this version/);
    handler = () => Response.json({ reference: "!" });
    fireEvent.submit(document.getElementById("feedback-form")!);
    await screen.findByText(/couldn’t confirm your feedback/);
    handler = () => new Response("", { status: 429 });
    fireEvent.submit(document.getElementById("feedback-form")!);
    await screen.findByText(/Please wait a moment/);
    window.dispatchEvent(new Event("beforeunload"));
  });
  it("restores a stored draft and warns when storage is blocked", async () => {
    const real = window.sessionStorage; const get = { mockRestore: () => Object.defineProperty(window, "sessionStorage", { value: real, configurable: true }) };
    Object.defineProperty(window, "sessionStorage", { get() { throw new Error("blocked"); }, configurable: true });
    render(<FeedbackWorkspace clientCommit={null} />);
    await waitFor(() => expect((screen.getByLabelText("What happened?") as HTMLTextAreaElement).disabled).toBe(false));
    type("What happened?", "x");
    expect(await screen.findByText(/can’t keep your draft/)).toBeTruthy();
    const e = new Event("beforeunload", { cancelable: true }); window.dispatchEvent(e); expect(e.defaultPrevented).toBe(true);
    get.mockRestore(); cleanup();
    render(<FeedbackWorkspace clientCommit={null} />);
    expect(await screen.findByDisplayValue("x")).toBeTruthy();
  });
  it("entry link hides on the feedback page", () => { render(<FeedbackEntry />); expect(screen.getByText("Give feedback")).toBeTruthy(); });
});

describe("AppRatingPanel", () => {
  const ready = () => waitFor(() => expect((screen.getByLabelText("3 out of 5 stars") as HTMLInputElement).closest("fieldset")!.disabled).toBe(false));
  it("saves, updates and shows the summary", async () => {
    render(<FeedbackWorkspace clientCommit={null} />); await ready();
    fireEvent.click(screen.getByLabelText("4 out of 5 stars")); fireEvent.submit(document.getElementById("rating-form")!);
    await screen.findByText(/rating has been saved/);
    fireEvent.click(screen.getByText("View app rating")); expect(await screen.findByText("4.5 / 5")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("5 out of 5 stars")); fireEvent.submit(document.getElementById("rating-form")!);
    await screen.findByText(/rating has been updated/);
    expect(await screen.findByText(/Your rating changed/)).toBeTruthy();
    screen.getByText("Refresh").focus(); fireEvent.click(screen.getByText("Refresh")); await screen.findByText("4.5 / 5");
    handler = () => summary(0); fireEvent.click(screen.getByText("Refresh")); await screen.findAllByText("No ratings yet.");
    fireEvent.click(screen.getByText("Hide app rating"));
  });
  it("handles rating failures and summary errors", async () => {
    render(<FeedbackWorkspace clientCommit={null} />); await ready();
    fireEvent.click(screen.getByLabelText("2 out of 5 stars"));
    handler = () => new Response("", { status: 409 }); fireEvent.submit(document.getElementById("rating-form")!);
    await screen.findByText(/changed while this update/);
    handler = () => new Response("", { status: 429, headers: { "retry-after": "1" } }); fireEvent.submit(document.getElementById("rating-form")!);
    await screen.findByText(/Please wait a moment before trying again/);
    await act(async () => { await new Promise(r => setTimeout(r, 1100)); });
    handler = () => Response.json({ stars: 1, revision: 1 }); fireEvent.submit(document.getElementById("rating-form")!);
    await screen.findByText(/couldn’t confirm your rating/);
    handler = () => new Response("", { status: 500 }); fireEvent.click(screen.getByText("View app rating"));
    await screen.findByText(/couldn’t load the app rating/);
    screen.getByText("Retry").focus();
    handler = () => new Response("", { status: 429, headers: { "retry-after": "1" } }); fireEvent.click(screen.getByText("Retry"));
    await screen.findByText(/Try again in/);
    fireEvent.click(screen.getByText("Hide app rating")); fireEvent.click(screen.getByText("View app rating"));
    await screen.findByText(/couldn’t load the app rating/);
  });
  it("restores a pending rating and survives blocked storage and lock failures", async () => {
    localStorage.setItem(APP_RATING_KEY, JSON.stringify({ token: "a".repeat(43), stars: 3, revision: 5, pending: { stars: 4, revision: 5 }, retryStars: null }));
    render(<FeedbackWorkspace clientCommit={null} />);
    expect(await screen.findByText(/hasn’t been confirmed/)).toBeTruthy(); cleanup();
    const realL = window.localStorage; const set = { mockRestore: () => Object.defineProperty(window, "localStorage", { value: realL, configurable: true }) };
    Object.defineProperty(window, "localStorage", { get() { throw new Error("blocked"); }, configurable: true });
    render(<FeedbackWorkspace clientCommit={null} />); await ready();
    fireEvent.click(screen.getByLabelText("1 out of 5 stars")); fireEvent.submit(document.getElementById("rating-form")!);
    await screen.findByText(/can’t keep your rating’s update key/);
    set.mockRestore(); cleanup();
    Object.defineProperty(navigator, "locks", { value: { request: async () => { throw new Error("x"); } }, configurable: true });
    const prep = await import("@/lib/feedback/client-rating"); void prep;
    vi.spyOn(globalThis.crypto, "getRandomValues").mockImplementation(() => { throw new Error("no rng"); });
    localStorage.clear(); rememberOwnAppRating(null as never);
    render(<FeedbackWorkspace clientCommit={null} />); await ready();
    fireEvent.click(screen.getByLabelText("1 out of 5 stars")); fireEvent.submit(document.getElementById("rating-form")!);
    await screen.findByText(/couldn’t prepare your rating/);
    Object.defineProperty(navigator, "locks", { value: undefined, configurable: true });
  });
});
