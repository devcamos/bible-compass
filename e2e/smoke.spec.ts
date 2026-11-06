import { expect, test, type Page } from "@playwright/test";

// Vercel Web Analytics is only served on Vercel; off-Vercel this request 404s.
const KNOWN_OFF_VERCEL = /\/_vercel\/insights\//;

test("a blocked optional Preview toolbar does not obscure the reader", async ({ page }) => {
  await page.goto("/topics/fear");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.evaluate(() => new Promise<void>((resolve) => {
    const script = document.createElement("script");
    script.src = "https://vercel.live/_next-live/feedback/feedback.js";
    script.addEventListener("error", () => resolve(), { once: true });
    document.body.append(script);
  }));
  await expect(page.locator("html")).not.toHaveAttribute("data-shell", "fault");
  await expect(page.getByRole("link", { name: /Isaiah 41:10/ })).toBeVisible();
});

test("Fear reset references open the matching Scripture passages", async ({ page }) => {
  await page.goto("/topics/fear");
  const firstStep = page.locator("details").nth(0);
  await expect(firstStep.getByRole("link", { name: /Isaiah 41:10/ })).toHaveAttribute("href", "https://biblehub.com/bsb/isaiah/41.htm#10");
  const peaceStep = page.locator("details").nth(2);
  await peaceStep.locator("summary").click();
  const rangeLink = peaceStep.getByRole("link", { name: /Philippians 4:6–7/ });
  await expect(rangeLink).toBeVisible();
  await expect(rangeLink).toHaveAttribute("href", "https://biblehub.com/bsb/philippians/4.htm#6");
  await expect(rangeLink).toHaveAttribute("target", "_blank");
});

function watchForProblems(page: Page, expectedNotFoundPath?: string): string[] {
  const problems: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    const url = msg.location()?.url ?? "";
    if (KNOWN_OFF_VERCEL.test(text) || KNOWN_OFF_VERCEL.test(url)) return;
    // On the not-found check, the document's own 404 is the expected result.
    if (expectedNotFoundPath && /status of 404/.test(text) && new URL(url).pathname === expectedNotFoundPath) return;
    problems.push(`console error: ${text}`);
  });
  page.on("pageerror", (err) => problems.push(`uncaught error: ${err.message}`));
  return problems;
}

async function collectCspViolations(page: Page): Promise<string[]> {
  return page.evaluate(() => (window as unknown as { __csp?: string[] }).__csp ?? []);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __csp: string[] };
    w.__csp = [];
    document.addEventListener("securitypolicyviolation", (e) => {
      if (/\/_vercel\/insights\//.test(e.blockedURI)) return;
      w.__csp.push(`${e.violatedDirective} blocked ${e.blockedURI || "inline"}`);
    });
  });
});

const pages: Array<{ path: string; status: number; heading: RegExp }> = [
  { path: "/", status: 200, heading: /Come as you are/ },
  { path: "/topics/jesus-and-the-gospel", status: 200, heading: /Jesus and the Gospel/ },
  { path: "/gifts", status: 200, heading: /Gifts from God/ },
  { path: "/gifts/grace", status: 200, heading: /Grace and salvation/ },
  { path: "/gifts/spiritual-gifts", status: 200, heading: /Gifts for serving/ },
  { path: "/feedback", status: 200, heading: /Give feedback/ },
  { path: "/this-page-does-not-exist", status: 404, heading: /not in v0\.1/ },
];

for (const { path, status, heading } of pages) {
  test(`${path} renders without console errors or CSP violations`, async ({ page }) => {
    const problems = watchForProblems(page, status === 404 ? path : undefined);
    const response = await page.goto(path, { waitUntil: "networkidle" });
    expect(response?.status()).toBe(status);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
    problems.push(...(await collectCspViolations(page)));
    expect(problems).toEqual([]);
  });
}
