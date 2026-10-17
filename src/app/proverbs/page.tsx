import type { Metadata } from "next";
import Link from "next/link";
import { EmojiIcon } from "@/components/EmojiIcon";
import {
  PROVERBS_CATEGORIES,
  PROVERBS_GRACE_GUARDRAIL,
  PROVERBS_INTRODUCTION,
} from "@/content/proverbs";

export const metadata: Metadata = {
  title: "Proverbs — Wisdom for everyday life",
  description: "Explore the Book of Proverbs by category, with key chapters, selected verses and guidance for reading in context.",
  alternates: { canonical: "/proverbs" },
};

export default function ProverbsPage() {
  return (
    <article>
      <Link href="/" className="mb-5 inline-flex min-h-11 items-center text-sm text-link">← Back to the compass</Link>
      <header className="mb-7">
        <p className="bc-kicker m-0 mb-2">Book of Proverbs</p>
        <h1 className="bc-title m-0 mb-3 text-3xl leading-tight sm:text-4xl">Wisdom for everyday life</h1>
        <p className="m-0 leading-7 text-muted-foreground">Explore key chapters and selected verses by theme.</p>
      </header>
      <section aria-labelledby="categories-heading">
        <h2 id="categories-heading" className="mb-4 text-base font-medium">What would you like to explore?</h2>
        <ul className="m-0 grid list-none gap-3 p-0">
          {PROVERBS_CATEGORIES.map((category) => (
            <li key={category.slug}>
              <Link href={`/proverbs/${category.slug}`} className="block rounded-2xl border border-border bg-card px-5 py-4 text-foreground no-underline hover:border-copper">
                <span className="flex items-center justify-between gap-3 font-medium"><span><EmojiIcon icon={category.icon} /> {category.title}</span><span aria-hidden="true">→</span></span>
                <span className="mt-1 block text-sm leading-6 text-muted-foreground">{category.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <details className="mt-7 border-t border-border py-3">
        <summary className="cursor-pointer py-2 font-medium">What are Proverbs?</summary>
        <p className="mb-2 leading-7 text-muted-foreground">{PROVERBS_INTRODUCTION}</p>
      </details>
      <aside className="bc-callout mt-7" aria-label="Grace and wisdom"><p className="m-0 leading-7">{PROVERBS_GRACE_GUARDRAIL}</p></aside>
    </article>
  );
}
