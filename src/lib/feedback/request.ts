export class FeedbackRequestError extends Error {
  constructor(readonly status: number) { super("Invalid feedback request"); }
}

export function sameFeedbackOrigin(request: Request): boolean {
  return request.headers.get("origin") === new URL(request.url).origin && request.headers.get("sec-fetch-site") !== "cross-site";
}

export async function readFeedbackBody(request: Request): Promise<unknown> {
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") ?? "")) throw new FeedbackRequestError(415);
  if (request.headers.get("content-encoding") && request.headers.get("content-encoding") !== "identity") throw new FeedbackRequestError(415);
  const length = request.headers.get("content-length");
  if (length && (!/^\d+$/.test(length) || Number(length) > 32_768)) throw new FeedbackRequestError(413);
  const reader = request.body?.getReader();
  if (!reader) throw new FeedbackRequestError(400);
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      (async () => {
        let size = 0;
        const parts: Uint8Array[] = [];
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.length;
          if (size > 32_768) { await reader.cancel(); throw new FeedbackRequestError(413); }
          parts.push(value);
        }
        try { return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(parts))); }
        catch { throw new FeedbackRequestError(400); }
      })(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => { void reader.cancel().catch(() => {}); reject(new FeedbackRequestError(408)); }, 5_000);
      }),
    ]);
  } finally { clearTimeout(timer); reader.releaseLock(); }
}

export function feedbackJson(value: unknown, status = 200, headers?: HeadersInit): Response {
  const combined = new Headers(headers);
  combined.set("Cache-Control", "no-store");
  combined.set("X-Content-Type-Options", "nosniff");
  return Response.json(value, { status, headers: combined });
}
