// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import HomePage from "@/app/page";
import ProverbsPage, { generateStaticParams as proverbsParams } from "@/app/proverbs/verses/[id]/page";
import PsalmsPage, { generateStaticParams as psalmsParams } from "@/app/psalms/[category]/verses/[id]/page";
import RevelationPage, { generateStaticParams as revelationParams } from "@/app/revelation/[category]/verses/[id]/page";
import { SavedPagesProvider } from "@/components/SavedPagesProvider";
import { SAVED_PAGE_CATALOG } from "@/lib/saved-page-catalog";

afterEach(cleanup);

describe("reading-area navigation", () => {
  it("keeps one Home navigation entry for each area in Foundations", () => {
    const { container } = render(<SavedPagesProvider catalog={SAVED_PAGE_CATALOG}><HomePage /></SavedPagesProvider>);
    for (const href of ["/topics/books-described", "/proverbs", "/psalms", "/revelation", "/gifts"]) {
      const links = container.querySelectorAll(`a[href="${href}"]`);
      expect(links).toHaveLength(1);
      expect(links[0].closest("details")?.querySelector("summary")?.textContent).toContain("Understand the Bible — foundations");
    }
  });

  const readings = [
    ...proverbsParams().map(params => ({ label: `Proverbs ${params.id}`, page: () => ProverbsPage({ params: Promise.resolve(params) }) })),
    ...psalmsParams().map(params => ({ label: `Psalms ${params.category}/${params.id}`, page: () => PsalmsPage({ params: Promise.resolve(params) }) })),
    ...revelationParams().map(params => ({ label: `Revelation ${params.category}/${params.id}`, page: () => RevelationPage({ params: Promise.resolve(params) }) })),
  ];

  it.each(readings)("offers distinct verse and chapter links on $label", async ({ page }) => {
    const reading = await page();
    const { container } = render(<SavedPagesProvider catalog={SAVED_PAGE_CATALOG}>{reading}</SavedPagesProvider>);
    const links = [...container.querySelectorAll<HTMLAnchorElement>('a[href^="https://biblehub.com/bsb/"]')];
    expect(links).toHaveLength(2);
    expect(new Set(links.map(link => link.href)).size).toBe(2);
    expect(links.filter(link => !new URL(link.href).hash)).toHaveLength(1);
  });
});
