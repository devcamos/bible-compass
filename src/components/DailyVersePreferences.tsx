"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";

const TOKEN_KEY = "bible-compass-push-token";
type Config = { enabled: boolean; publicKey: string | null };
type Schedule = { reminderTime: string; timeZone: string };
type Device = "loading" | "unsupported" | "install" | "supported";

function notificationSupport(): Device {
  const appleMobile = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const standalone = matchMedia("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  if (appleMobile && !standalone) return "install";
  if (!window.isSecureContext || !("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return "unsupported";
  return "supported";
}

function reminderDisabled(busy: boolean, subscribed: boolean, device: Device, enabled: boolean, permission: NotificationPermission): boolean {
  if (busy) return true;
  if (subscribed) return false;
  return device !== "supported" || !enabled || permission === "denied";
}

async function readSavedSchedule(current: PushSubscription | null): Promise<Schedule | null> {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!current || !token) return null;
  const result = await fetch(`/api/notifications/subscriptions?id=${await subscriptionId(current.endpoint)}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!result.ok) throw new Error("Could not restore reminder schedule");
  return result.json();
}

function applicationKey(value: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(value.replaceAll("-", "+").replaceAll("_", "/")), (character) => character.codePointAt(0)!);
}

async function subscriptionId(endpoint: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(endpoint));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function DailyVersePreferences() {
  const headingId = useId();
  const timeId = useId();
  const zoneId = useId();
  const [device, setDevice] = useState<Device>("loading");
  const [config, setConfig] = useState<Config | null>(null);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [schedule, setSchedule] = useState<Schedule>({ reminderTime: "08:00", timeZone: "UTC" });
  const [savedSchedule, setSavedSchedule] = useState<Schedule | null>(null);
  const [zones, setZones] = useState<string[]>(["UTC"]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const changed = !savedSchedule || schedule.reminderTime !== savedSchedule.reminderTime || schedule.timeZone !== savedSchedule.timeZone;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      setSchedule({ reminderTime: "08:00", timeZone: zone });
      const available = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : [];
      setZones(Array.from(new Set([zone, "UTC", ...available])));
      const support = notificationSupport();
      setDevice(support);
      if (support !== "supported") return;
      setPermission(Notification.permission);
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
        const [current, response] = await Promise.all([registration.pushManager.getSubscription(), fetch("/api/notifications/config", { cache: "no-store" })]);
        if (!response.ok) throw new Error("Reminder configuration unavailable");
        const settings: Config = await response.json();
        if (cancelled) return;
        setSubscription(current);
        setConfig(settings);
        const stored = await readSavedSchedule(current);
        if (stored && !cancelled) {
          setZones((previous) => Array.from(new Set([stored.timeZone, ...previous])));
          setSchedule(stored);
          setSavedSchedule(stored);
        }
      } catch {
        if (!cancelled) { setFailed(true); setMessage("Reminder settings could not load. Refresh the page to try again."); }
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  async function save() {
    if (!config?.publicKey) return;
    setBusy(true);
    setMessage("");
    setFailed(false);
    let created: PushSubscription | null = null;
    try {
      let token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        token = btoa(String.fromCodePoint(...crypto.getRandomValues(new Uint8Array(32)))).replaceAll("+", "-").replaceAll("/", "_").split("=")[0];
        localStorage.setItem(TOKEN_KEY, token);
      }
      // Permission must stay directly in the button gesture, particularly on iOS.
      const allowed = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
      setPermission(allowed);
      if (allowed !== "granted") { setMessage("Reminders remain off. You can change permission in your browser or device settings."); return; }
      const registration = await navigator.serviceWorker.ready;
      const current = await registration.pushManager.getSubscription();
      const next = current ?? await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: applicationKey(config.publicKey) });
      if (!current) created = next;
      const response = await fetch("/api/notifications/subscriptions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...next.toJSON(), token, ...schedule }) });
      if (!response.ok) throw new Error("Could not save subscription");
      setSubscription(next);
      setSavedSchedule({ ...schedule });
      setMessage(`Saved. Your daily verse is set for ${schedule.reminderTime} in ${schedule.timeZone.replaceAll("_", " ")}.`);
    } catch {
      if (created) await created.unsubscribe().catch(() => false);
      setFailed(true);
      setMessage("Could not save your reminder. Check your connection and browser settings, then try again.");
    } finally { setBusy(false); }
  }

  async function disable() {
    if (!subscription) return;
    setBusy(true);
    setMessage("");
    setFailed(false);
    try {
      const previous = subscription;
      if (!await previous.unsubscribe()) throw new Error("Device could not unsubscribe");
      setSubscription(null);
      setSavedSchedule(null);
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        const response = await fetch("/api/notifications/subscriptions", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: previous.endpoint, token }) });
        if (!response.ok) { setMessage("Reminders are off on this device. Server cleanup will finish when the expired subscription is detected."); return; }
      }
      setMessage("Reminders are off. Your daily verse is always here when you need it.");
    } catch { setFailed(true); setMessage("Could not turn reminders off. Check notification permission in your device settings."); }
    finally { setBusy(false); }
  }

  return (
    <>
      <section className="bc-reminders rounded-2xl border border-border p-4" aria-labelledby={headingId}>
        <div className="flex items-center justify-between gap-3">
          <div><h3 id={headingId} className="m-0 text-sm font-semibold">Daily verse reminder</h3><p className="mb-0 mt-1 text-xs text-muted-foreground">{subscription ? "Enabled" : "Disabled"}</p></div>
          <label className="relative flex min-h-11 min-w-11 cursor-pointer items-center">
            <input type="checkbox" role="switch" aria-label="Daily verse reminder" checked={Boolean(subscription)} disabled={reminderDisabled(busy, Boolean(subscription), device, Boolean(config?.enabled), permission)} onChange={(event) => { if (event.target.checked) void save(); else void disable(); }} className="peer sr-only" />
            <span aria-hidden="true" className="h-6 w-11 rounded-full bg-border transition-colors peer-checked:bg-copper peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-copper peer-disabled:opacity-50" />
            <span aria-hidden="true" className="pointer-events-none absolute left-1 h-4 w-4 rounded-full bg-cream transition-transform peer-checked:translate-x-5 peer-disabled:opacity-50" />
          </label>
        </div>
        {device === "loading" ? <p className="text-sm">Checking this device…</p> : null}
        {device === "install" ? <p className="rounded-xl border border-border bg-background p-3 text-sm leading-6">On iPhone or iPad (iOS/iPadOS 16.4+), choose Share → Add to Home Screen. Open the saved icon to enable reminders.</p> : null}
        {device === "unsupported" ? <p className="text-sm leading-6">This browser does not support reminders. Today’s verse is still here to read.</p> : null}
        {device === "supported" && subscription ? <>
          <fieldset disabled={busy || !config?.enabled} className="m-0 mt-4 min-w-0 space-y-3 border-0 border-t border-border p-0 pt-4">
            <legend className="sr-only">Daily reminder schedule</legend>
            <div className="flex items-center justify-between gap-3">
              <label htmlFor={timeId} className="text-sm font-medium">Remind me at</label>
              <input id={timeId} type="time" required value={schedule.reminderTime} onChange={(event) => setSchedule({ ...schedule, reminderTime: event.target.value })} className="min-h-11 min-w-0 rounded-lg border border-border bg-card px-3 text-base font-medium text-foreground" />
            </div>
            <div><label htmlFor={zoneId} className="mb-1.5 block text-xs text-muted-foreground">Timezone</label>
              <select id={zoneId} value={schedule.timeZone} onChange={(event) => setSchedule({ ...schedule, timeZone: event.target.value })} className="min-h-11 w-full min-w-0 rounded-lg border border-border bg-card px-2 text-sm text-foreground">
                {zones.map((zone) => <option key={zone} value={zone}>{zone.replaceAll("_", " ")}</option>)}
              </select>
            </div>
          </fieldset>
          <p className="mb-0 mt-2 text-xs leading-5 text-muted-foreground">Daily, in your selected timezone. Delivery may be delayed.</p>
          {changed ? <button type="button" className="bc-btn mt-3 justify-center disabled:opacity-50" disabled={busy || !schedule.reminderTime || !config?.enabled} onClick={() => void save()}>{busy ? "Saving…" : "Save time"}</button> : null}
        </> : null}
        {device === "supported" && permission === "denied" ? <p className="text-sm leading-6">Allow notifications in your browser or device settings to enable reminders.</p> : null}
        {device === "supported" && config && !config.enabled ? <p className="text-sm">Reminders are not available yet.</p> : null}
        {message ? <p role="status" aria-live="polite" className={`mb-0 mt-3 rounded-xl border border-border bg-background p-3 text-sm leading-5 ${failed ? "text-link" : "text-muted-foreground"}`}>{message}</p> : null}
        <Link href="/verse-of-the-day" className="mt-2 inline-flex min-h-11 items-center text-sm font-medium text-link no-underline">Read today’s verse <span aria-hidden="true" className="ml-2">→</span></Link>
      </section>
      <div className="divide-y divide-border rounded-2xl border border-border bg-card px-4">
        <details className="text-sm"><summary className="min-h-14"><span className="summary-label">Save to your Home Screen</span></summary><p className="mt-0 pb-3 leading-6 text-muted-foreground">On iPhone or iPad: Share → Add to Home Screen. On Android or desktop: browser menu → Install app or Add to Home Screen, if offered. Open the saved icon for your own quiet reading window. An internet connection is still required.</p></details>
        <details className="text-sm"><summary className="min-h-14"><span className="summary-label">Your privacy & reminders</span></summary><p className="mt-0 pb-3 leading-6 text-muted-foreground">Reminders store this browser’s push address, encryption keys, time and timezone. No name, email, or reading history is collected. Turn them off here to remove the subscription when connected. Verse text may appear on your lock screen.</p></details>
      </div>
    </>
  );
}
