// @vitest-environment happy-dom
import { afterEach, expect, it } from "vitest";
import { cleanup, render, within } from "@testing-library/react";
import { TopicView } from "@/components/TopicView";
import { SavedPagesProvider } from "@/components/SavedPagesProvider";
import { SAVED_PAGE_CATALOG } from "@/lib/saved-page-catalog";
import { fear } from "@/content/topics/fear";
import { faith } from "@/content/topics/faith";
import { trust } from "@/content/topics/trust";
import { friendship } from "@/content/topics/friendship";

afterEach(cleanup);

it.each([
  [fear, ["isaiah/41.htm#10", "joshua/1.htm#9", "philippians/4.htm#6", "isaiah/26.htm#3"]],
  [faith, ["proverbs/3.htm#5", "hebrews/11.htm#1", "romans/10.htm#17", "2_corinthians/5.htm#7", "mark/9.htm#24"]],
  [trust, ["psalms/56.htm#3", "proverbs/3.htm#5", "proverbs/3.htm#6", "isaiah/26.htm#3"]],
])("links each %s reset reference to its BSB verse", (topic, paths) => {
  const { container } = render(<SavedPagesProvider catalog={SAVED_PAGE_CATALOG}><TopicView topic={topic} /></SavedPagesProvider>);
  const steps = container.querySelectorAll("details");
  expect(steps.length).toBe(paths.length);
  paths.forEach((path, index) => {
    const link = within(steps[index] as HTMLElement).getByRole("link", { hidden: true });
    expect(link.getAttribute("href")).toBe(`https://biblehub.com/bsb/${path}`);
    expect(link.textContent).toContain(topic.steps![index].verse);
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
  });
});

it("gives each reference in a combined step its own destination", () => {
  const { container } = render(<SavedPagesProvider catalog={SAVED_PAGE_CATALOG}><TopicView topic={friendship} /></SavedPagesProvider>);
  const links = within(container.querySelectorAll("details")[2] as HTMLElement).getAllByRole("link", { hidden: true });
  expect(links.map(link => link.getAttribute("href"))).toEqual([
    "https://biblehub.com/bsb/proverbs/27.htm#6",
    "https://biblehub.com/bsb/galatians/6.htm#2",
  ]);
});

it("keeps unsupported reset text readable without inventing a destination", () => {
  const topic = { ...fear, steps: [{ ...fear.steps![0], verse: "A reflection" }] };
  const { container } = render(<SavedPagesProvider catalog={SAVED_PAGE_CATALOG}><TopicView topic={topic} /></SavedPagesProvider>);
  const step = container.querySelector("details")!;
  expect(step.querySelector("a")).toBeNull();
  expect(step.textContent).toContain("“A reflection”");
});
