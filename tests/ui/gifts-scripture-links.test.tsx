// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import GiftPage from "@/app/gifts/spiritual-gifts/[gift]/page";
import { ScriptureContext } from "@/app/gifts/GiftsReading";
import { GIFTS, giftChapterUrl, giftReferenceUrl } from "@/content/gifts";
import { SavedPagesProvider } from "@/components/SavedPagesProvider";
import { SAVED_PAGE_CATALOG } from "@/lib/saved-page-catalog";

afterEach(cleanup);
const reference = (verse: number, label = `1 Corinthians 12:${verse}`) => ({
  book: "1 Corinthians", chapter: 12, verse, label,
});

describe("Gifts Scripture links", () => {
  it.each(GIFTS)("offers each full chapter once on $title", async gift => {
    const page = await GiftPage({ params: Promise.resolve({ gift: gift.id }) });
    const { container } = render(<SavedPagesProvider catalog={SAVED_PAGE_CATALOG}>{page}</SavedPagesProvider>);
    const chapterUrls = new Set([gift.namingScripture.ref, ...gift.refs].map(giftChapterUrl));
    for (const href of chapterUrls) {
      expect(container.querySelectorAll(`a[href="${href}"]`), `${gift.id}: ${href}`).toHaveLength(1);
    }
    // The quoted Scripture, highlighted words and each supporting reference stay intact.
    expect(container.querySelector("[data-naming-scripture] blockquote p")?.textContent).toBe(gift.namingScripture.text);
    expect(container.querySelector("[data-naming-scripture] mark")?.textContent).toBe(gift.namingScripture.highlight);
    for (const ref of gift.refs) {
      expect(container.querySelectorAll(`a[href="${giftReferenceUrl(ref)}"]`).length).toBeGreaterThan(0);
    }
    const supporting = container.querySelector('[aria-labelledby="scripture-heading"]');
    const repeatedNamingVerse = [...(supporting?.querySelectorAll("a") ?? [])].filter(link =>
      link.getAttribute("href") === giftReferenceUrl(gift.namingScripture.ref)
      && link.textContent?.startsWith(`${gift.namingScripture.ref.label} ·`));
    expect(repeatedNamingVerse).toHaveLength(0);
  });

  it("keeps different verses from one chapter and removes identical reference copies", () => {
    const { container } = render(<ScriptureContext references={[reference(8), reference(9), reference(8)]} />);
    expect(container.querySelectorAll(`a[href="${giftReferenceUrl(reference(8))}"]`)).toHaveLength(1);
    expect(container.querySelectorAll(`a[href="${giftReferenceUrl(reference(9))}"]`)).toHaveLength(1);
    expect(container.querySelectorAll(`a[href="${giftChapterUrl(reference(8))}"]`)).toHaveLength(1);
  });

  it("preserves a wider passage label even when it starts at the quoted verse", () => {
    const { container, getByText } = render(<ScriptureContext references={[reference(8, "1 Corinthians 12:8–11")]} quotedReference={reference(8)} />);
    expect(getByText("1 Corinthians 12:8–11")).toBeTruthy();
    expect(container.querySelector(`a[href="${giftReferenceUrl(reference(8))}"]`)).toBeTruthy();
    expect(container.querySelector(`a[href="${giftChapterUrl(reference(8))}"]`)).toBeNull();
  });

  it("does not render an empty section when its only reference is already quoted", () => {
    const { container } = render(<ScriptureContext references={[reference(8)]} quotedReference={reference(8)} />);
    expect(container.children).toHaveLength(0);
  });

  it("does not render a section without references", () => {
    const { container } = render(<ScriptureContext references={[]} />);
    expect(container.children).toHaveLength(0);
  });
});
