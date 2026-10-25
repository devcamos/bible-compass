import type { Metadata } from "next";
import Link from "next/link";
import { SavedPageActions } from "@/components/SavedPageActions";
import { getConcept } from "@/content/concepts";
import {
  REVELATION_CATEGORIES,
  REVELATION_CONCEPT_MAPPING,
  REVELATION_GRACE_GUARDRAIL,
  REVELATION_INTRODUCTION,
  REVELATION_SELECTION_NOTE,
} from "@/content/revelation";

export const metadata: Metadata = {
  title: "Revelation — Faithful hope in Christ",
  description: "Explore Revelation by theme, with selected chapters, passage highlights and guidance for reading its visions in context.",
  alternates: { canonical: "/revelation" },
};

export default function RevelationPage() {
  return (
    <article>
      <Link href="/" className="mb-5 inline-flex min-h-11 items-center text-sm text-link">← Back to the compass</Link>
      <header className="mb-7">
        <p className="bc-kicker m-0 mb-2">Book of Revelation</p>
        <h1 className="bc-title m-0 mb-3 text-3xl leading-tight sm:text-4xl">Faithful hope in Christ</h1>
        <p className="m-0 leading-7 text-muted-foreground">{REVELATION_GRACE_GUARDRAIL}</p>
        <SavedPageActions path="/revelation" />
      </header>
      <nav className="mb-4 flex flex-wrap items-center gap-2 text-sm" aria-label="Related biblical concepts">
        <span>{REVELATION_CONCEPT_MAPPING.book}</span>
        <span aria-hidden="true">→</span>
        {REVELATION_CONCEPT_MAPPING.conceptSlugs.map((slug, index) => {
          const concept = getConcept(slug)!;
          return (
            <span key={slug} className="inline-flex items-center gap-2">
              {index > 0 && <span aria-hidden="true">·</span>}
              <Link href={`/concepts/${concept.slug}`} className="inline-flex min-h-11 items-center font-medium text-link underline underline-offset-4">{concept.title}</Link>
            </span>
          );
        })}
      </nav>
      <details className="mb-6 border-y border-border py-3">
        <summary className="min-h-11 cursor-pointer py-2 font-medium">Introduction to Revelation</summary>
        <ul className="mt-3 mb-2 list-disc space-y-3 pl-5 text-muted-foreground">
          {REVELATION_INTRODUCTION.map((point) => (
            <li key={point.title} className="leading-7">
              <strong className="font-medium text-foreground">{point.title}</strong> {point.text}
            </li>
          ))}
        </ul>
        <p className="mt-4 mb-2 text-sm leading-6 text-muted-foreground">{REVELATION_SELECTION_NOTE}</p>
      </details>
      <section aria-label="Revelation categories">
        <ul className="m-0 grid list-none gap-3 p-0">
          {REVELATION_CATEGORIES.map((category) => (
            <li key={category.slug}>
              <Link href={`/revelation/${category.slug}`} className="block rounded-2xl border border-border bg-card px-5 py-4 text-foreground no-underline hover:border-copper">
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
