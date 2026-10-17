import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTopic } from "@/content";
import {
  PROVERBS_GRACE_GUARDRAIL,
  PROVERBS_VERSES,
  getProverbsCategory,
  getProverbsVerse,
  proverbsChapterUrl,
  proverbsVerseUrl,
} from "@/content/proverbs";

type Props = Readonly<{ params: Promise<{ id: string }> }>;

export const dynamicParams = false;
export function generateStaticParams() {
  return PROVERBS_VERSES.map(({ id }) => ({ id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const verse = getProverbsVerse(id);
  return verse ? {
    title: `Proverbs ${verse.chapter}:${verse.verse} — ${verse.title}`,
    description: verse.summary,
    alternates: { canonical: `/proverbs/verses/${verse.id}` },
  } : { title: "Proverbs verse" };
}

export default async function ProverbsVersePage({ params }: Props) {
  const { id } = await params;
  const verse = getProverbsVerse(id);
  if (!verse) notFound();
  const categories = verse.categorySlugs.map((slug) => getProverbsCategory(slug)).filter((category) => category !== undefined);

  return (
    <article>
      <Link href="/proverbs" className="mb-5 inline-flex min-h-11 items-center text-sm text-link">← All Proverbs categories</Link>
      <header className="mb-6">
        <p className="bc-kicker m-0 mb-2">Proverbs {verse.chapter}:{verse.verse}</p>
        <h1 className="bc-title m-0 text-3xl leading-tight">{verse.title}</h1>
      </header>
      <section className="mb-7 rounded-2xl border border-border bg-card p-5" aria-label="Verse summary">
        <p className="m-0 mb-3 text-sm text-muted-foreground">Paraphrased summary · not a Bible quotation</p>
        <p className="bc-title m-0 mb-4 text-2xl leading-snug">{verse.summary}</p>
        <a href={proverbsVerseUrl(verse.chapter, verse.verse)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-link underline underline-offset-4" aria-label={`Read Proverbs ${verse.chapter}:${verse.verse} in NIV on Bible Gateway (opens in a new tab)`}>Read Proverbs {verse.chapter}:{verse.verse} (NIV) ↗</a>
      </section>
      <section aria-labelledby="context-heading">
        <h2 id="context-heading" className="bc-title bc-heading mb-3">Consider the context</h2>
        <p className="m-0 leading-8 text-muted-foreground">{verse.context}</p>
        <a href={proverbsChapterUrl(verse.chapter)} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center text-link underline underline-offset-4" aria-label={`Read the full chapter Proverbs ${verse.chapter} in NIV on Bible Gateway (opens in a new tab)`}>Read Proverbs {verse.chapter} →</a>
        <p className="mt-1 text-sm text-muted-foreground">Scripture links open Bible Gateway in a new tab.</p>
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
      <nav className="mt-7" aria-label="This verse's categories">
        <p className="mb-3 text-sm text-muted-foreground">Find this verse in</p>
        <div className="flex flex-wrap gap-2">{categories.map((category) => <Link key={category.slug} href={`/proverbs/${category.slug}`} className="bc-btn bc-btn--quiet">{category.title} →</Link>)}</div>
      </nav>
      <aside className="bc-callout mt-7" aria-label="Grace and wisdom"><p className="m-0 leading-7">{PROVERBS_GRACE_GUARDRAIL}</p></aside>
    </article>
  );
}
