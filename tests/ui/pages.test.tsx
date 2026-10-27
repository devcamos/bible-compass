// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import type { ReactNode } from "react";
import { SavedPagesProvider } from "@/components/SavedPagesProvider";
import { SAVED_PAGE_CATALOG } from "@/lib/saved-page-catalog";

const pages = import.meta.glob(["../../src/app/**/page.tsx", "!../../src/app/verse-of-the-day/page.tsx"]);
afterEach(cleanup);

async function resolveTree(node: unknown): Promise<unknown> { return node instanceof Promise ? resolveTree(await node) : node; }

describe("every page renders for every static param", () => {
  for (const [path, load] of Object.entries(pages)) {
    it(path, async () => {
      const mod = (await load()) as { default: (p: unknown) => unknown; generateStaticParams?: () => unknown; generateMetadata?: (p: unknown) => unknown };
      const params = mod.generateStaticParams ? ((await mod.generateStaticParams()) as Record<string, string>[]) : [{}];
      expect(params.length).toBeGreaterThan(0);
      for (const p of params) {
        const props = { params: Promise.resolve(p), searchParams: Promise.resolve({}) };
        if (mod.generateMetadata) await mod.generateMetadata(props);
        const tree = await resolveTree(mod.default(props));
        const { container } = render(<SavedPagesProvider catalog={SAVED_PAGE_CATALOG}>{tree as ReactNode}</SavedPagesProvider>);
        expect(container).toBeTruthy();
        cleanup();
      }
      if (mod.generateStaticParams) {
        const bad = { params: Promise.resolve(Object.fromEntries(Object.keys(params[0]).map(k => [k, "does-not-exist"]))), searchParams: Promise.resolve({}) };
        await expect((async () => { if (mod.generateMetadata) await mod.generateMetadata(bad); await resolveTree(mod.default(bad)); })()).rejects.toThrow();
      }
    });
  }
});

describe("verse-of-the-day redirect", () => {
  it("redirects to home with or without a date", async () => {
    const { default: Page } = await import("@/app/verse-of-the-day/page");
    await expect(Page({ searchParams: Promise.resolve({ date: "2026-01-02" }) } as never)).rejects.toThrow("?verse=2026-01-02#verse");
    await expect(Page({ searchParams: Promise.resolve({}) } as never)).rejects.toThrow("NEXT_REDIRECT /#verse");
  });
});
