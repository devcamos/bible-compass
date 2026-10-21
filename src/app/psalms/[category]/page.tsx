import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  PSALMS_CATEGORIES,
  PSALMS_GRACE_GUARDRAIL,
  getPsalmsCategory,
  getPsalmsGroups,
  psalmUrl,
  psalmVerseReference,
  psalmVerseUrl,
} from "@/content/psalms";

type Props = Readonly<{ params: Promise<{ category: string }> }>;

export const dynamicParams = false;
export function generateStaticParams() {
  return PSALMS_CATEGORIES.map(({ slug }) => ({ category: slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: slug } = await params;
  const category = getPsalmsCategory(slug);
  return category ? {
    title: `${category.title} — Psalms`,
    description: category.description,
    alternates: { canonical: `/psalms/${category.slug}` },
  } : { title: "Psalms category" };
}

export default async function PsalmsCategoryPage({ params }: Props) {
  const { category: slug } = await params;
  const category = getPsalmsCategory(slug);
  if (!category) notFound();
  const groups = getPsalmsGroups(slug);

  return (
    <article>
      <Link href="/psalms" className="mb-5 inline-flex min-h-11 items-center text-sm text-link">← All Psalms categories</Link>
      <header className="mb-6">
        <p className="bc-kicker m-0 mb-2">Psalms</p>
        <h1 className="bc-title m-0 mb-3 text-3xl leading-tight">{category.title}</h1>
        <p className="m-0 leading-7 text-muted-foreground">{category.description}</p>
      </header>
      <p className="mb-4 text-sm leading-6 text-muted-foreground">Verse links open the NIV passage on Bible Gateway in a new tab. Summaries below are paraphrases, not Bible quotations.</p>
      <div className="space-y-4">
        {groups.map(({ psalm, verses }) => (
          <details key={psalm} open className="rounded-2xl border border-border bg-card">
            <summary className="cursor-pointer px-5 py-4">
              <span className="font-medium">Psalm {psalm}</span>
              <span className="mt-1 block text-sm text-muted-foreground">{verses.length} selected {verses.length === 1 ? "passage" : "passages"}</span>
            </summary>
            <div className="px-5 pb-4">
              <ul className="m-0 list-none p-0">
                {verses.map((verse) => {
                  const reference = `${psalm}:${psalmVerseReference(verse.verseStart, verse.verseEnd)}`;
                  return (
                    <li key={verse.id} className="border-t border-border py-3">
                      <a href={psalmVerseUrl(psalm, verse.verseStart, verse.verseEnd)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center py-2 font-medium leading-7 text-link underline underline-offset-4" aria-label={`Read Psalm ${reference} in NIV on Bible Gateway (opens in a new tab)`}>
                        {reference} · {verse.title} <span className="ml-1" aria-hidden="true">↗</span>
                      </a>
                      <p className="m-0 mb-1 leading-7 text-muted-foreground">{verse.summary}</p>
                      <Link href={`/psalms/${category.slug}/verses/${verse.id}`} className="inline-flex min-h-11 items-center text-sm text-link">Explore this passage →<span className="sr-only"> Psalm {reference}</span></Link>
                    </li>
                  );
                })}
              </ul>
              <a href={psalmUrl(psalm)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-sm font-medium text-link underline underline-offset-4" aria-label={`Read the full Psalm ${psalm} in NIV on Bible Gateway (opens in a new tab)`}>Read Psalm {psalm} →</a>
            </div>
          </details>
        ))}
      </div>
      <aside className="bc-callout mt-7" aria-label="Grace and prayer"><p className="m-0 leading-7">{PSALMS_GRACE_GUARDRAIL}</p></aside>
    </article>
  );
}
