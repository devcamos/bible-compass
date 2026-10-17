/* Push only: no fetch handler, page caching, or forced reloads. */
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = {};
  try { payload = event.data?.json() ?? {}; } catch { /* Show a safe fallback. */ }
  if (typeof payload !== "object" || Array.isArray(payload)) payload = {};
  const date = /^\d{4}-\d{2}-\d{2}$/.test(payload.date) ? payload.date : "";
  const testId = typeof payload.testId === "string" && /^[a-f0-9-]{36}$/.test(payload.testId) ? payload.testId : "";
  event.waitUntil(self.registration.showNotification("Verse of the day · Bible Compass", {
    body: typeof payload.body === "string" ? payload.body.slice(0, 500) : "A quiet moment in Scripture awaits.",
    icon: "/pwa/icon-192.png",
    tag: testId ? `bible-compass-test-${testId}` : `bible-compass-verse-${date}`,
    data: { date },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  // Never navigate to a URL supplied by an external push sender.
  const date = event.notification.data?.date;
  const path = /^\d{4}-\d{2}-\d{2}$/.test(date) ? `/?verse=${date}#verse-of-the-day-heading` : "/#verse-of-the-day-heading";
  const url = new URL(path, self.location.origin).href;
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
