// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DailyVersePreferences } from "@/components/DailyVersePreferences";
import { PwaRegistration } from "@/components/PwaRegistration";
import { SplashController } from "@/components/SplashScreen";
import { ProphetBookList } from "@/components/ProphetBookList";
import { SiteHeader } from "@/components/SiteChrome";
import { FeedbackEntry } from "@/components/FeedbackEntry";
import * as prophets from "@/content/prophets";
import { SavedPagesProvider } from "@/components/SavedPagesProvider";
import { usePathname } from "next/navigation";
import { SAVED_PAGE_CATALOG } from "@/lib/saved-page-catalog";

const define = (target: object, key: string, value: unknown) => Object.defineProperty(target, key, { value, configurable: true, writable: true });
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); localStorage.clear(); });

function pushEnv(opts: { config?: object | null; existing?: boolean; permission?: string; request?: string; unsub?: boolean } = {}) {
  const sub = { endpoint: "https://push/1", toJSON: () => ({ endpoint: "https://push/1", keys: {} }), unsubscribe: vi.fn(async () => opts.unsub ?? true) };
  let current: typeof sub | null = opts.existing ? sub : null;
  const pushManager = { getSubscription: vi.fn(async () => current), subscribe: vi.fn(async () => { current = sub; return sub; }) };
  const reg = { pushManager };
  define(navigator, "serviceWorker", { register: vi.fn(async () => reg), ready: Promise.resolve(reg) });
  define(window, "PushManager", function () {});
  define(window, "isSecureContext", true);
  define(window, "Notification", Object.assign(function () {}, { permission: opts.permission ?? "default", requestPermission: vi.fn(async () => opts.request ?? "granted") }));
  return { sub, pushManager };
}
type R = (u: string, i: RequestInit) => Response;
function routes(r: R) { vi.spyOn(globalThis, "fetch").mockImplementation(async (u, i) => r(String(u), i ?? {})); }
const cfg = { enabled: true, canSendTest: true, scheduled: true, publicKey: "AAAA" };

describe("DailyVersePreferences", () => {
  beforeEach(() => { define(window, "matchMedia", () => ({ matches: false, addEventListener() {}, removeEventListener() {} })); });
  it("reports unsupported and install-only devices", async () => {
    define(window, "PushManager", undefined); delete (window as { PushManager?: unknown }).PushManager;
    render(<DailyVersePreferences />);
    expect(await screen.findByText(/does not support reminders/)).toBeTruthy(); cleanup();
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue("iPhone");
    render(<DailyVersePreferences />);
    expect(await screen.findByText(/Add to Home Screen. Open/)).toBeTruthy();
  });
  it("enables, saves a time, sends tests and disables", async () => {
    pushEnv();
    let testStatus = 200, del = 200;
    routes((u, i) => u.includes("config") ? Response.json(cfg) : u.includes("test") ? new Response("", { status: testStatus }) : i.method === "DELETE" ? new Response("", { status: del }) : u.includes("?id=") ? Response.json({ reminderTime: "07:00", timeZone: "Europe/London" }) : new Response("{}"));
    render(<DailyVersePreferences />);
    const toggle = await screen.findByRole("switch");
    await waitFor(() => expect((toggle as HTMLInputElement).disabled).toBe(false));
    await act(async () => { fireEvent.click(toggle); });
    expect(await screen.findByText(/Saved. Your daily verse/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Remind me at"), { target: { value: "09:30" } });
    fireEvent.change(screen.getByLabelText("Timezone"), { target: { value: "UTC" } });
    await act(async () => { fireEvent.click(screen.getByText("Save time")); });
    for (const [s, text] of [[200, /Test sent/], [429, /wait five minutes/], [410, /Turn reminders off/], [500, /could not be sent/]] as const) {
      testStatus = s; await act(async () => { fireEvent.click(screen.getByText("Send test notification")); }); expect(await screen.findByText(text)).toBeTruthy();
    }
    del = 500; await act(async () => { fireEvent.click(screen.getByRole("switch")); });
    expect(await screen.findByText(/Server cleanup/)).toBeTruthy();
    await act(async () => { fireEvent.click(screen.getByRole("switch")); });
    del = 200; await act(async () => { fireEvent.click(screen.getByRole("switch")); });
    expect(await screen.findByText(/Reminders are off. Your daily/)).toBeTruthy();
  });
  it("restores a saved schedule and handles failures", async () => {
    localStorage.setItem("bible-compass-push-token", "tok");
    pushEnv({ existing: true, permission: "granted", unsub: false });
    routes((u) => u.includes("config") ? Response.json({ ...cfg, scheduled: false }) : u.includes("?id=") ? Response.json({ reminderTime: "07:00", timeZone: "Asia/Tokyo" }) : new Response("", { status: 500 }));
    render(<DailyVersePreferences />);
    expect(await screen.findByDisplayValue("07:00")).toBeTruthy();
    expect(screen.getByText(/Scheduled reminders start after release/)).toBeTruthy();
    await act(async () => { fireEvent.click(screen.getByRole("switch")); });
    expect(await screen.findByText(/Could not turn reminders off/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Remind me at"), { target: { value: "09:30" } });
    await act(async () => { fireEvent.click(screen.getByText("Save time")); });
    expect(await screen.findByText(/Could not save your reminder/)).toBeTruthy();
  });
  it("handles denied permission, config failure and disabled config", async () => {
    pushEnv({ request: "denied" });
    routes((u) => u.includes("config") ? Response.json({ ...cfg, canSendTest: false, scheduled: false }) : new Response("{}"));
    render(<DailyVersePreferences />);
    const toggle = await screen.findByRole("switch");
    await waitFor(() => expect((toggle as HTMLInputElement).disabled).toBe(false));
    await act(async () => { fireEvent.click(toggle); });
    expect(await screen.findByText(/Reminders remain off/)).toBeTruthy(); cleanup();
    pushEnv({ permission: "granted" });
    routes((u) => u.includes("config") ? Response.json({ ...cfg, scheduled: false }) : new Response("{}"));
    render(<DailyVersePreferences />);
    await waitFor(() => expect((screen.getByRole("switch") as HTMLInputElement).disabled).toBe(false));
    await act(async () => { fireEvent.click(screen.getByRole("switch")); });
    expect(await screen.findByText(/Time saved for testing/)).toBeTruthy(); cleanup();
    pushEnv({ permission: "denied" });
    routes((u) => u.includes("config") ? Response.json({ ...cfg, enabled: false }) : new Response("{}"));
    render(<DailyVersePreferences />);
    expect(await screen.findByText(/not available yet/)).toBeTruthy();
    expect(screen.getByText(/Allow notifications/)).toBeTruthy(); cleanup();
    pushEnv();
    routes(() => new Response("", { status: 500 }));
    render(<DailyVersePreferences />);
    expect(await screen.findByText(/could not load/)).toBeTruthy();
  });
});

describe("ProfilePreferences and header", () => {
  it("changes theme and skin tone and reacts to storage events", async () => {
    define(window, "matchMedia", () => ({ matches: true }));
    routes(() => new Response("", { status: 500 }));
    define(HTMLDialogElement.prototype, "showModal", function (this: HTMLDialogElement) { this.setAttribute("open", ""); this.dispatchEvent(new Event("toggle")); });
    define(HTMLDialogElement.prototype, "close", function (this: HTMLDialogElement) { this.removeAttribute("open"); this.dispatchEvent(new Event("toggle")); this.dispatchEvent(new Event("close")); });
    render(<SavedPagesProvider catalog={SAVED_PAGE_CATALOG}><SiteHeader /></SavedPagesProvider>);
    fireEvent.click(screen.getByLabelText("Open profile"));
    fireEvent.click(screen.getByRole("switch", { name: /Dark mode/ }));
    expect(document.documentElement.dataset.theme).toBe("dark");
    const radios = document.querySelectorAll<HTMLInputElement>("input[type=radio]");
    fireEvent.click(radios[radios.length - 1]);
    await act(async () => {
      window.dispatchEvent(new StorageEvent("storage", { key: "bible-compass-theme", newValue: null, storageArea: localStorage }));
      window.dispatchEvent(new StorageEvent("storage", { key: null, newValue: "light", storageArea: localStorage }));
      window.dispatchEvent(new StorageEvent("storage", { key: "x", storageArea: sessionStorage }));
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("x"); });
    fireEvent.click(screen.getByRole("switch", { name: /Dark mode/ }));
    fireEvent.click(screen.getByLabelText("Close"));
    vi.mocked(usePathname).mockReturnValue("/how-to-use");
    cleanup(); render(<SavedPagesProvider catalog={SAVED_PAGE_CATALOG}><SiteHeader /><FeedbackEntry /></SavedPagesProvider>);
    vi.mocked(usePathname).mockReturnValue("/feedback");
    cleanup(); render(<FeedbackEntry />);
    vi.mocked(usePathname).mockReturnValue("/");
  });
});

describe("ProphetBookList", () => {
  it("opens and closes summaries", () => {
    define(HTMLDialogElement.prototype, "showModal", function (this: HTMLDialogElement) { this.setAttribute("open", ""); });
    define(HTMLDialogElement.prototype, "close", function (this: HTMLDialogElement) { this.removeAttribute("open"); this.dispatchEvent(new Event("close")); });
    const books = Object.values(prophets).find(Array.isArray) as prophets.ProphetBook[];
    render(<ProphetBookList books={books.slice(0, 2)} />);
    fireEvent.click(screen.getAllByRole("button", { name: books[0].title })[0]);
    fireEvent.click(screen.getByText("Close"));
    fireEvent.click(screen.getAllByRole("button", { name: books[1].title })[0]);
    const dialog = document.querySelector("dialog")!;
    vi.spyOn(dialog, "getBoundingClientRect").mockReturnValue({ left: 10, right: 20, top: 10, bottom: 20 } as DOMRect);
    fireEvent.pointerUp(dialog.firstElementChild!);
    fireEvent.pointerUp(dialog, { clientX: 15, clientY: 15 });
    fireEvent.pointerUp(dialog, { clientX: 1, clientY: 1 });
  });
});

describe("PwaRegistration", () => {
  it("registers the worker, guards unload and checks for updates", async () => {
    const register = vi.fn(async () => { throw new Error("x"); });
    define(navigator, "serviceWorker", { register }); define(window, "isSecureContext", true);
    routes(() => Response.json({ commit: "b".repeat(40) }));
    const { unmount } = render(<PwaRegistration commit={"a".repeat(40)} surface="web" />);
    window.dispatchEvent(new Event("beforeunload"));
    document.dispatchEvent(new Event("visibilitychange")); window.dispatchEvent(new Event("online"));
    await act(async () => { await new Promise(r => setTimeout(r, 20)); });
    expect(register).toHaveBeenCalled(); unmount();
  });
});

describe("SplashController", () => {
  const mount = () => { document.body.innerHTML = '<div id="bc-splash"><p class="bc-splash__kicker"></p><p data-splash-recover-copy></p><button data-splash-retry></button></div><main id="main"><p>x</p></main>'; };
  beforeEach(() => { vi.useFakeTimers(); delete document.documentElement.dataset.splash; delete document.documentElement.dataset.shell; define(window, "matchMedia", () => ({ matches: false })); define(navigator, "onLine", true); });
  it("fades the splash once the shell is ready", () => {
    mount(); render(<SplashController />); vi.advanceTimersByTime(2000);
    expect(document.documentElement.dataset.splash).toBe("seen");
    window.dispatchEvent(new Event("offline"));
  });
  it("skips work when already seen and with reduced motion", () => {
    mount(); document.documentElement.dataset.splash = "seen"; render(<SplashController />); cleanup();
    delete document.documentElement.dataset.splash; define(window, "matchMedia", () => ({ matches: true }));
    mount(); render(<SplashController />); vi.advanceTimersByTime(1000); expect(document.documentElement.dataset.splash).toBe("seen");
  });
  it("shows faults for assets, offline and slow loads", () => {
    mount(); render(<SplashController />);
    const s = document.createElement("script"); document.body.append(s); s.dispatchEvent(new Event("error"));
    window.dispatchEvent(new ErrorEvent("error"));
    expect(document.documentElement.dataset.shell).toBe("fault"); vi.advanceTimersByTime(9000); cleanup();
    delete document.documentElement.dataset.shell; define(navigator, "onLine", false);
    mount(); render(<SplashController />); vi.advanceTimersByTime(9000); cleanup();
    delete document.documentElement.dataset.shell; define(navigator, "onLine", true);
    document.body.innerHTML = '<div id="bc-splash"></div>'; render(<SplashController />); vi.advanceTimersByTime(9000);
    expect(document.documentElement.dataset.shell).toBe("fault"); cleanup();
    delete document.documentElement.dataset.shell;
    mount(); render(<SplashController />); vi.advanceTimersByTime(1000);
    document.documentElement.dataset.shell = "fault"; vi.advanceTimersByTime(1000); cleanup();
    document.body.innerHTML = ""; render(<SplashController />);
  });
  it("keeps reading available when the optional Preview toolbar is blocked", () => {
    mount(); render(<SplashController />);
    const toolbar = document.createElement("script");
    toolbar.src = "https://vercel.live/_next-live/feedback/feedback.js";
    document.body.append(toolbar);
    toolbar.dispatchEvent(new Event("error"));
    vi.advanceTimersByTime(2000);
    expect(document.documentElement.dataset.shell).not.toBe("fault");
    expect(document.documentElement.dataset.splash).toBe("seen");

    // Required application scripts must still trigger recovery.
    const appScript = document.createElement("script");
    appScript.src = "/_next/static/chunks/app.js";
    document.body.append(appScript);
    appScript.dispatchEvent(new Event("error"));
    expect(document.documentElement.dataset.shell).toBe("fault");
  });
});
