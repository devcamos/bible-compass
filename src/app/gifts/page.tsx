import type { Metadata } from "next";
import Link from "next/link";
import { SavedPageActions } from "@/components/SavedPageActions";
import { GIFTS_GRACE, GIFTS_INTRODUCTION, GIFTS_SECTIONS, GIFTS_SELECTION_NOTE } from "@/content/gifts";

export const metadata: Metadata = {
  title:"Gifts from God", description:"Explore God’s gifts, their meaning and the Scripture that names them, with grace and service at the centre.",
  alternates:{ canonical:"/gifts" },
};

export default function GiftsPage() {
  return <article>
    <Link href="/" className="mb-5 inline-flex min-h-11 items-center text-sm text-link">← Back to the compass</Link>
    <header className="mb-7">
      <p className="bc-kicker m-0 mb-2">Received in grace · used in love</p>
      <h1 className="bc-title m-0 mb-3 text-3xl leading-tight sm:text-4xl">Gifts from God</h1>
      <p className="m-0 leading-7 text-muted-foreground">{GIFTS_GRACE}</p>
      <SavedPageActions path="/gifts" />
    </header>
    <details className="mb-6 border-y border-border py-3">
      <summary className="min-h-11 cursor-pointer py-2 font-medium">Understanding biblical gifts</summary>
      <ul className="mt-3 mb-2 list-disc space-y-3 pl-5 text-muted-foreground">{GIFTS_INTRODUCTION.map(point => <li key={point} className="leading-7">{point}</li>)}</ul>
      <p className="mt-4 mb-2 text-sm leading-6 text-muted-foreground">{GIFTS_SELECTION_NOTE}</p>
    </details>
    <ul className="m-0 grid list-none gap-3 p-0" aria-label="Explore gifts from God">{GIFTS_SECTIONS.map(section => <li key={section.id}>
      <Link href={`/gifts/${section.id}`} className="block rounded-2xl border border-border bg-card px-5 py-4 text-foreground no-underline hover:border-copper">
        <span className="flex items-center justify-between gap-3 font-medium"><span>{section.title}</span><span aria-hidden="true">→</span></span>
        <span className="mt-1 block text-sm leading-6 text-muted-foreground">{section.summary}</span>
      </Link>
    </li>)}</ul>
  </article>;
}
