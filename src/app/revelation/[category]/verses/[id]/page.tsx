import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SavedPageActions } from "@/components/SavedPageActions";
import { requireTopic } from "@/content";
import {
  REVELATION_GRACE_GUARDRAIL,
  REVELATION_PASSAGES,
  getRevelationCategory,
  getRevelationPassage,
  revelationPassageUrl,
  revelationUrl,
  revelationVerseReference,
} from "@/content/revelation";
import { ExternalLinkIcon } from "../../../ExternalLinkIcon";

type Props = Readonly<{ params: Promise<{ category: string; id: string }> }>;

export const dynamicParams = false;
export function generateStaticParams() {
  return REVELATION_PASSAGES.flatMap(({ id, categorySlugs }) => categorySlugs.map((category) => ({ category, id })));
}

function findPassage(categorySlug: string, id: string) {
  const category = getRevelationCategory(categorySlug);
  const passage = getRevelationPassage(id);
  if (!category || !passage || !passage.categorySlugs.includes(category.slug)) return undefined;
  return { category, passage };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: slug, id } = await params;
  const result = findPassage(slug, id);
  if (!result) return { title: "Revelation passage" };
  const { category, passage } = result;
  return {
    title: `${revelationVerseReference(passage)} — ${passage.title}`,
    description: passage.summary,
    alternates: { canonical: revelationPassageUrl(category.slug, passage.id) },
  };
}

export default async function RevelationPassagePage({ params }: Props) {
  const { category: slug, id } = await params;
  const result = findPassage(slug, id);
  if (!result) notFound();
  const { category, passage } = result;
  const reference = revelationVerseReference(passage);

  return (
    <article>
      <Link href={`/revelation/${category.slug}#${passage.id}`} className="mb-5 inline-flex min-h-11 items-center text-sm text-link">← Back to {category.title}</Link>
      <header className="mb-6">
        <p className="bc-kicker m-0 mb-2">{reference}</p>
        <h1 className="bc-title m-0 text-3xl leading-tight">{passage.title}</h1>
        <SavedPageActions path={revelationPassageUrl(category.slug, passage.id)} />
      </header>
      <section className="mb-7 rounded-2xl border border-border bg-card p-5" aria-label="Passage summary">
        <p className="m-0 mb-3 text-sm text-muted-foreground">Paraphrased summary · not a Bible quotation</p>
        <p className="bc-title m-0 mb-4 text-2xl leading-snug">{passage.summary}</p>
        <a href={revelationUrl(passage.chapter, passage.verseStart)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-link underline underline-offset-4" aria-label={`Read ${reference} in BSB on Bible Hub (opens in a new tab)`}>Read {reference} (BSB) <ExternalLinkIcon /></a>
      </section>
      <section aria-labelledby="context-heading">
        <h2 id="context-heading" className="bc-title bc-heading mb-3">Consider the context</h2>
        <p className="m-0 leading-7 text-muted-foreground">{passage.context}</p>
        <a href={revelationUrl(passage.chapter)} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center text-link underline underline-offset-4" aria-label={`Read the full Revelation ${passage.chapter} in BSB on Bible Hub (opens in a new tab)`}>Read Revelation {passage.chapter} →</a>
        <p className="mt-1 text-sm text-muted-foreground">Scripture links open the Berean Standard Bible on Bible Hub in a new tab.</p>
      </section>
      <section className="mt-7 border-t border-border pt-6" aria-labelledby="explore-heading">
        <h2 id="explore-heading" className="bc-title bc-heading mb-3">Explore further</h2>
        <p className="mb-4 leading-7 text-muted-foreground">Read alongside wisdom, prayer and hope in Bible Compass.</p>
        <div className="flex flex-wrap gap-2">
          {passage.relatedLinks.map((link) => (
            <Link key={link.href} href={link.href} className="bc-btn bc-btn--quiet">{link.title} →</Link>
          ))}
          {passage.relatedTopics.map((topicSlug) => {
            const topic = requireTopic(topicSlug);
            return <Link key={topicSlug} href={`/topics/${topicSlug}`} className="bc-btn bc-btn--quiet">{topic.title} →</Link>;
          })}
        </div>
      </section>
      <aside className="bc-callout mt-7" aria-label="Grace and faithful hope"><p className="m-0 leading-7">{REVELATION_GRACE_GUARDRAIL}</p></aside>
    </article>
  );
}
