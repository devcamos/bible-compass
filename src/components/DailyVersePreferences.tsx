"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const TOKEN_KEY = "bible-compass-push-token";
type Config = { enabled: boolean; publicKey: string | null };
type Device = "loading" | "unsupported" | "install" | "supported";

function applicationKey(value: string): Uint8Array<ArrayBuffer> {
  const bytes = atob(value.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(bytes, (character) => character.charCodeAt(0));
}

export function DailyVersePreferences() {
  const [device, setDevice] = useState<Device>("loading");
  const [config, setConfig] = useState<Config | null>(null);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const appleMobile = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      const standalone = matchMedia("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
      if (appleMobile && !standalone) { setDevice("install"); return; }
      if (!window.isSecureContext || !("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) { setDevice("unsupported"); return; }
      setDevice("supported");
      setPermission(Notification.permission);
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
        const [current, response] = await Promise.all([registration.pushManager.getSubscription(), fetch("/api/notifications/config", { cache: "no-store" })]);
        if (!response.ok) throw new Error();
        const settings: Config = await response.json();
        if (!cancelled) { setSubscription(current); setConfig(settings); }
      } catch { if (!cancelled) setMessage("Reminder settings could not load. Reopen your profile to try again."); }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  async function enable() {
    if (!config?.publicKey) return;
    setBusy(true);
    setMessage("");
    let created: PushSubscription | null = null;
    try {
      // Prepare ownership storage before prompting; never ask on page load.
      let token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        token = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
        localStorage.setItem(TOKEN_KEY, token);
      }
      // Keep the permission request directly in the user's button gesture (iOS).
      const allowed = await Notification.requestPermission();
      setPermission(allowed);
      if (allowed !== "granted") { setMessage("Reminders remain off. You can change permission in your browser or device settings."); return; }
      const registration = await navigator.serviceWorker.ready;
      const current = await registration.pushManager.getSubscription();
      const next = current ?? await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: applicationKey(config.publicKey) });
      if (!current) created = next;
      const response = await fetch("/api/notifications/subscriptions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...next.toJSON(), token }) });
      if (!response.ok) throw new Error();
      setSubscription(next);
      setMessage("Daily verse reminders are on for this device.");
    } catch {
      if (created) await created.unsubscribe().catch(() => false);
      setMessage("Could not enable reminders. Check your connection and browser settings, then try again.");
    } finally { setBusy(false); }
  }

  async function disable() {
    if (!subscription) return;
    setBusy(true);
    setMessage("");
    try {
      const previous = subscription;
      if (!await previous.unsubscribe()) throw new Error();
      setSubscription(null);
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        const response = await fetch("/api/notifications/subscriptions", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: previous.endpoint, token }) });
        if (!response.ok) { setMessage("Reminders are off on this device. Server cleanup will finish when the expired subscription is detected."); return; }
      }
      setMessage("Daily verse reminders are off on this device.");
    } catch { setMessage("Could not finish turning reminders off. Check notification permission in your device settings."); }
    finally { setBusy(false); }
  }

  return (
    <section className="rounded-xl border border-border bg-card p-3" aria-labelledby="daily-reminder-heading">
      <h3 id="daily-reminder-heading" className="m-0 font-medium">Verse of the day reminders</h3>
      <p className="mb-2 mt-1 text-sm text-muted-foreground">An optional verse at 08:00 UTC each day. Delivery may be delayed by your device. No account or streak required.</p>
      <p className="text-sm"><Link href="/verse-of-the-day" className="text-link">Read today’s verse</Link></p>
      {device === "loading" ? <p className="text-sm">Checking this device…</p> : null}
      {device === "install" ? <p className="text-sm">On iPhone or iPad (iOS/iPadOS 16.4+), use Share → Add to Home Screen, then open Bible Compass from its icon to enable reminders.</p> : null}
      {device === "unsupported" ? <p className="text-sm">This browser does not support reminders. You can still read the daily verse here.</p> : null}
      {device === "supported" ? <>
        {permission === "denied" ? <p className="text-sm">Notifications are blocked. Allow them in your browser or device settings to enable reminders.</p> : null}
        {subscription ? <button type="button" className="bc-btn bc-btn--quiet" disabled={busy} onClick={() => void disable()}>{busy ? "Updating…" : "Turn reminders off"}</button> :
          config?.enabled ? <button type="button" className="bc-btn" disabled={busy || permission === "denied"} onClick={() => void enable()}>{busy ? "Updating…" : "Enable daily verse"}</button> :
          config ? <p className="text-sm">Reminders are not available yet. Today’s verse is ready to read.</p> : null}
      </> : null}
      <p role="status" aria-live="polite" className="mb-0 text-sm text-muted-foreground">{message}</p>
      <details className="mt-3 text-sm">
        <summary>Save Bible Compass to your Home Screen</summary>
        <p>On iPhone or iPad, choose Share → Add to Home Screen. On Android or desktop, open your browser menu and choose Install app or Add to Home Screen, if offered. Open the saved icon to use Bible Compass in its own window. An internet connection is still required.</p>
      </details>
      <p className="mb-0 mt-3 text-xs text-muted-foreground">Enabling reminders stores this browser’s push address and encryption keys. Turning them off removes the saved subscription when connected. No name or email is collected. Your device may show verse text on its lock screen.</p>
    </section>
  );
}
