import { createHash, timingSafeEqual } from "node:crypto";

const PUSH_HOSTS = new Set(["fcm.googleapis.com", "updates.push.services.mozilla.com", "web.push.apple.com"]);
export type SubscriptionInput = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  token: string;
  reminderTime: string;
  timeZone: string;
};

export function parseSchedule(value: { reminderTime?: unknown; timeZone?: unknown }): { reminderTime: string; timeZone: string } {
  const reminderTime = value.reminderTime ?? "08:00";
  const timeZone = value.timeZone ?? "UTC";
  if (typeof reminderTime !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(reminderTime)) throw new Error("Invalid reminder time");
  if (typeof timeZone !== "string" || timeZone.length > 80 || !/^(UTC|[A-Za-z_]+(?:\/[A-Za-z0-9_+-]+)+)$/.test(timeZone)) throw new Error("Invalid timezone");
  new Intl.DateTimeFormat("en", { timeZone }).format();
  return { reminderTime, timeZone };
}

export function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function secretEquals(a: string, b: string): boolean {
  return timingSafeEqual(Buffer.from(hash(a)), Buffer.from(hash(b)));
}

export function validToken(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{43}$/.test(value);
}

export function parseSubscription(value: unknown): SubscriptionInput {
  if (!value || typeof value !== "object") throw new Error("Invalid subscription");
  const input = value as Partial<SubscriptionInput>;
  if (!validToken(input.token) || typeof input.endpoint !== "string" || input.endpoint.length > 2048) throw new Error("Invalid subscription");
  const url = new URL(input.endpoint);
  if (url.protocol !== "https:" || !PUSH_HOSTS.has(url.hostname) || url.port || url.username || url.password || url.hash) throw new Error("Unsupported push service");
  if (!input.keys || typeof input.keys.p256dh !== "string" || typeof input.keys.auth !== "string") throw new Error("Invalid subscription keys");
  if (!/^[A-Za-z0-9_-]+={0,2}$/.test(input.keys.p256dh) || Buffer.from(input.keys.p256dh, "base64url").length !== 65 ||
      !/^[A-Za-z0-9_-]+={0,2}$/.test(input.keys.auth) || Buffer.from(input.keys.auth, "base64url").length !== 16) throw new Error("Invalid subscription keys");
  return { endpoint: input.endpoint, keys: input.keys, token: input.token, ...parseSchedule(input) };
}

export function sameOrigin(request: Request): boolean {
  return request.headers.get("origin") === new URL(request.url).origin;
}
