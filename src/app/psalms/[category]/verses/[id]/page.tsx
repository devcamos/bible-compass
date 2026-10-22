import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTopic } from "@/content";
import {
  PSALMS_GRACE_GUARDRAIL,
  PSALMS_VERSES,
  getPsalmsCategory,
  getPsalmsVerse,
  psalmUrl,
  psalmVerseReference,
  psalmVerseUrl,
} from "@/content/psalms";

type Props = Readonly<{ params: Promise<{ category: string; id: string }> }>;

export const dynamicParams = false;
export function generateStaticParams() {
  return PSALMS_VERSES.flatMap(({ id, categorySlugs }) => categorySlugs.map((category) => ({ category, id })));
}

function findPassage(categorySlug: string, id: string) {
  const category = getPsalmsCategory(categorySlug);
  const verse = getPsalmsVerse(id);
  if (!category || !verse || !verse.categorySlugs.includes(category.slug)) return undefined;
  return { category, verse };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: categorySlug, id } = await params;
  const passage = findPassage(categorySlug, id);
  if (!passage) return { title: "Psalms passage" };
  const { category, verse } = passage;
  return {
    title: `Psalm ${verse.psalm}:${psalmVerseReference(verse.verseStart, verse.verseEnd)} — ${verse.title}`,
    description: verse.summary,
    alternates: { canonical: `/psalms/${category.slug}/verses/${verse.id}` },
  };
}

export default async function PsalmsPassagePage({ params }: Props) {
  const { category: categorySlug, id } = await params;
  const passage = findPassage(categorySlug, id);
  if (!passage) notFound();
  const { category, verse } = passage;
  const reference = `${verse.psalm}:${psalmVerseReference(verse.verseStart, verse.verseEnd)}`;

  return (
    <article>
      <Link href={`/psalms/${category.slug}`} className="mb-5 inline-flex min-h-11 items-center text-sm text-link">← Back to {category.title}</Link>
      <header className="mb-6">
        <p className="bc-kicker m-0 mb-2">Psalm {reference}</p>
        <h1 className="bc-title m-0 text-3xl leading-tight">{verse.title}</h1>
      </header>
      <section className="mb-7 rounded-2xl border border-border bg-card p-5" aria-label="Passage summary">
        <p className="m-0 mb-3 text-sm text-muted-foreground">Paraphrased summary · not a Bible quotation</p>
        <p className="bc-title m-0 mb-4 text-2xl leading-snug">{verse.summary}</p>
        <a href={psalmVerseUrl(verse.psalm, verse.verseStart, verse.verseEnd)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-link underline underline-offset-4" aria-label={`Read Psalm ${reference} in BSB on Bible Gateway (opens in a new tab)`}>Read Psalm {reference} (BSB) ↗</a>
      </section>
      <section aria-labelledby="context-heading">
        <h2 id="context-heading" className="bc-title bc-heading mb-3">Consider the context</h2>
        <p className="m-0 leading-7 text-muted-foreground">{verse.context}</p>
        <a href={psalmUrl(verse.psalm)} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center text-link underline underline-offset-4" aria-label={`Read the full Psalm ${verse.psalm} in BSB on Bible Gateway (opens in a new tab)`}>Read Psalm {verse.psalm} →</a>
        <p className="mt-1 text-sm text-muted-foreground">Scripture links open the Berean Standard Bible on Bible Hub in a new tab.</p>
      </section>
      <section className="mt-7 border-t border-border pt-6" aria-labelledby="explore-heading">
        <h2 id="explore-heading" className="bc-title bc-heading mb-3">Explore further</h2>
        <p className="mb-4 leading-7 text-muted-foreground">Continue into related teaching in Bible Compass.</p>
        <div className="flex flex-wrap gap-2">
          {verse.relatedTopics.map((slug) => {
            const topic = requireTopic(slug);
            return <Link key={slug} href={`/topics/${slug}`} className="bc-btn bc-btn--quiet">{topic.title} →</Link>;
          })}
        </div>
      </section>
      <aside className="bc-callout mt-7" aria-label="Grace and prayer"><p className="m-0 leading-7">{PSALMS_GRACE_GUARDRAIL}</p></aside>
    </article>
  );
}
