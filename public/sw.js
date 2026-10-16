/* Push only: no fetch handler, page caching, or forced reloads. */
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = {};
  try { payload = event.data?.json() ?? {}; } catch { /* Show a safe fallback. */ }
  if (typeof payload !== "object" || Array.isArray(payload)) payload = {};
  const date = /^\d{4}-\d{2}-\d{2}$/.test(payload.date) ? payload.date : "";
  event.waitUntil(self.registration.showNotification("Verse of the day · Bible Compass", {
    body: typeof payload.body === "string" ? payload.body.slice(0, 500) : "A quiet moment in Scripture awaits.",
    icon: "/pwa/icon-192.png",
    tag: `bible-compass-verse-${date}`,
    data: { url: date ? `/verse-of-the-day?date=${date}` : "/verse-of-the-day" },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  // Never navigate to a URL supplied by an external push sender.
  const candidate = new URL(event.notification.data?.url ?? "/verse-of-the-day", self.location.origin);
  const url = candidate.origin === self.location.origin && candidate.pathname === "/verse-of-the-day"
    ? candidate.href : new URL("/verse-of-the-day", self.location.origin).href;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const existing = windows.find((client) => new URL(client.url).origin === self.location.origin);
    if (existing) {
      await existing.navigate(url);
      return existing.focus();
    }
    return self.clients.openWindow(url);
  })());
});
