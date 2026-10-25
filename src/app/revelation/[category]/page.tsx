import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SavedPageActions } from "@/components/SavedPageActions";
import {
  REVELATION_CATEGORIES,
  REVELATION_GRACE_GUARDRAIL,
  getRevelationCategory,
  getRevelationGroups,
  revelationPassageUrl,
  revelationUrl,
  revelationVerseReference,
} from "@/content/revelation";
import { ExternalLinkIcon } from "../ExternalLinkIcon";
import { PassageReturnFocus } from "../PassageReturnFocus";

type Props = Readonly<{ params: Promise<{ category: string }> }>;

export const dynamicParams = false;
export function generateStaticParams() {
  return REVELATION_CATEGORIES.map(({ slug }) => ({ category: slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: slug } = await params;
  const category = getRevelationCategory(slug);
  return category ? {
    title: `${category.title} — Revelation`,
    description: category.description,
    alternates: { canonical: `/revelation/${category.slug}` },
  } : { title: "Revelation category" };
}

export default async function RevelationCategoryPage({ params }: Props) {
  const { category: slug } = await params;
  const category = getRevelationCategory(slug);
  if (!category) notFound();
  const groups = getRevelationGroups(slug);

  return (
    <article>
      <PassageReturnFocus passageIds={groups.flatMap(({ passages }) => passages.map(({ id }) => id))} />
      <Link href="/revelation" className="mb-5 inline-flex min-h-11 items-center text-sm text-link">← All Revelation categories</Link>
      <header className="mb-6">
        <p className="bc-kicker m-0 mb-2">Revelation</p>
        <h1 className="bc-title m-0 mb-3 text-3xl leading-tight">{category.title}</h1>
        <p className="m-0 leading-7 text-muted-foreground">{category.description}</p>
        <SavedPageActions path={`/revelation/${category.slug}`} />
      </header>
      <p className="mb-4 text-sm leading-6 text-muted-foreground">Verse links open the BSB chapter on Bible Hub at the first selected verse. Summaries below are original paraphrases.</p>
      <div className="space-y-4">
        {groups.map(({ chapter, passages }) => (
          <details key={chapter} open className="rounded-2xl border border-border bg-card">
            <summary className="cursor-pointer px-5 py-4">
              <span className="font-medium">Revelation {chapter}</span>
              <span className="mt-1 block text-sm text-muted-foreground">{passages.length} selected {passages.length === 1 ? "passage" : "passages"}</span>
            </summary>
            <div className="px-5 pb-4">
              <ul className="m-0 list-none p-0">
                {passages.map((passage) => {
                  const reference = revelationVerseReference(passage);
                  return (
                    <li key={passage.id} className="border-t border-border py-3">
                      <a href={revelationUrl(chapter, passage.verseStart)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center py-2 font-medium leading-7 text-link underline underline-offset-4" aria-label={`Read ${reference} in BSB on Bible Hub (opens in a new tab)`}>
                        {reference.replace("Revelation ", "")} · {passage.title} <ExternalLinkIcon />
                      </a>
                      <p className="m-0 mb-1 leading-7 text-muted-foreground">{passage.summary}</p>
                      <Link id={passage.id} href={revelationPassageUrl(category.slug, passage.id)} className="inline-flex min-h-11 scroll-mt-6 items-center text-sm text-link">Explore this passage →<span className="sr-only"> {reference}</span></Link>
                    </li>
                  );
                })}
              </ul>
              <a href={revelationUrl(chapter)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-sm font-medium text-link underline underline-offset-4" aria-label={`Read the full Revelation ${chapter} in BSB on Bible Hub (opens in a new tab)`}>Read Revelation {chapter} →</a>
            </div>
          </details>
        ))}
      </div>
      <aside className="bc-callout mt-7" aria-label="Grace and faithful hope"><p className="m-0 leading-7">{REVELATION_GRACE_GUARDRAIL}</p></aside>
    </article>
  );
}
