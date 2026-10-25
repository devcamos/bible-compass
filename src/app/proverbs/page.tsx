import { SavedPageActions } from "@/components/SavedPageActions";
import type { Metadata } from "next";
import Link from "next/link";
import { getConcept } from "@/content/concepts";
import {
  PROVERBS_CATEGORIES,
  PROVERBS_CONCEPT_MAPPING,
  PROVERBS_GRACE_GUARDRAIL,
  PROVERBS_INTRODUCTION,
  PROVERBS_SELECTION_NOTE,
} from "@/content/proverbs";

export const metadata: Metadata = {
  title: "Proverbs — Wisdom for everyday life",
  description: "Explore the Book of Proverbs by category, with key chapters, selected verses and guidance for reading in context.",
  alternates: { canonical: "/proverbs" },
};

export default function ProverbsPage() {
  const concept = getConcept(PROVERBS_CONCEPT_MAPPING.conceptSlug)!;
  return (
    <article>
      <Link href="/" className="mb-5 inline-flex min-h-11 items-center text-sm text-link">← Back to the compass</Link>
      <header className="mb-7">
        <p className="bc-kicker m-0 mb-2">Book of Proverbs</p>
        <h1 className="bc-title m-0 mb-3 text-3xl leading-tight sm:text-4xl">Wisdom for everyday life</h1>
        <p className="m-0 leading-7 text-muted-foreground">{PROVERBS_GRACE_GUARDRAIL}</p>
        <SavedPageActions path={"/proverbs"} />
      </header>
      <nav className="mb-4 flex items-center gap-2 text-sm" aria-label="Book-to-concept mapping">
        <span>{PROVERBS_CONCEPT_MAPPING.book}</span>
        <span aria-hidden="true">→</span><span className="sr-only">{PROVERBS_CONCEPT_MAPPING.relationship}</span>
        <Link href={`/concepts/${concept.slug}`} className="inline-flex min-h-11 items-center font-medium text-link underline underline-offset-4">{concept.title}</Link>
      </nav>
      <details className="mb-6 border-y border-border py-3">
        <summary className="cursor-pointer py-2 font-medium">Introduction to Proverbs</summary>
        <ul className="mt-3 mb-2 list-disc space-y-3 pl-5 text-muted-foreground">
          {PROVERBS_INTRODUCTION.map((point) => (
            <li key={point.title} className="leading-7">
              <strong className="font-medium text-foreground">{point.title}.</strong> {point.text}
            </li>
          ))}
        </ul>
        <p className="mt-4 mb-2 text-sm leading-6 text-muted-foreground">{PROVERBS_SELECTION_NOTE}</p>
      </details>
      <section aria-label="Proverbs categories">
        <ul className="m-0 grid list-none gap-3 p-0">
          {PROVERBS_CATEGORIES.map((category) => (
            <li key={category.slug}>
              <Link href={`/proverbs/${category.slug}`} className="block rounded-2xl border border-border bg-card px-5 py-4 text-foreground no-underline hover:border-copper">
                <span className="flex items-center justify-between gap-3 font-medium"><span>{category.title}</span><span aria-hidden="true">→</span></span>
                <span className="mt-1 block text-sm leading-6 text-muted-foreground">{category.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
