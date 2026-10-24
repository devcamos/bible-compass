import { SavedPageActions } from "@/components/SavedPageActions";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  PROVERBS_CATEGORIES,
  PROVERBS_GRACE_GUARDRAIL,
  getProverbsCategory,
  getProverbsChapterGroups,
  proverbsChapterUrl,
  proverbsVerseUrl,
} from "@/content/proverbs";

type Props = Readonly<{ params: Promise<{ category: string }> }>;

export const dynamicParams = false;
export function generateStaticParams() {
  return PROVERBS_CATEGORIES.map(({ slug }) => ({ category: slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: slug } = await params;
  const category = getProverbsCategory(slug);
  return category ? {
    title: `${category.title} — Proverbs`,
    description: category.description,
    alternates: { canonical: `/proverbs/${category.slug}` },
  } : { title: "Proverbs category" };
}

export default async function ProverbsCategoryPage({ params }: Props) {
  const { category: slug } = await params;
  const category = getProverbsCategory(slug);
  if (!category) notFound();
  const groups = getProverbsChapterGroups(slug);

  return (
    <article>
      <Link href="/proverbs" className="mb-5 inline-flex min-h-11 items-center text-sm text-link">← All Proverbs categories</Link>
      <header className="mb-6">
        <p className="bc-kicker m-0 mb-2">Proverbs</p>
        <h1 className="bc-title m-0 mb-3 text-3xl leading-tight">{category.title}</h1>
        <p className="m-0 leading-7 text-muted-foreground">{category.description}</p>
        <SavedPageActions path={`/proverbs/${category.slug}`} />
      </header>
      <p className="mb-4 text-sm leading-6 text-muted-foreground">Verse links open the BSB passage on Bible Hub in a new tab. Summaries below are paraphrases, not Bible quotations.</p>
      <div className="space-y-4">
        {groups.map(({ chapter, verses }) => (
          <details key={chapter} open className="rounded-2xl border border-border bg-card">
            <summary className="cursor-pointer px-5 py-4">
              <span className="font-medium">Proverbs {chapter}</span>
              <span className="mt-1 block text-sm text-muted-foreground">{verses.length} selected {verses.length === 1 ? "verse" : "verses"}</span>
            </summary>
            <div className="px-5 pb-4">
              <ul className="m-0 list-none p-0">
                {verses.map((verse) => (
                  <li key={verse.id} className="border-t border-border py-3">
                    <a href={proverbsVerseUrl(chapter, verse.verse)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center py-2 font-medium leading-7 text-link underline underline-offset-4" aria-label={`Read Proverbs ${chapter}:${verse.verse} in BSB on Bible Gateway (opens in a new tab)`}>
                      {chapter}:{verse.verse} · {verse.title} <span className="ml-1" aria-hidden="true">↗</span>
                    </a>
                    <p className="m-0 mb-1 leading-7 text-muted-foreground">{verse.summary}</p>
                    <Link href={`/proverbs/verses/${verse.id}`} className="inline-flex min-h-11 items-center text-sm text-link">Explore this verse →<span className="sr-only"> Proverbs {chapter}:{verse.verse}</span></Link>
                  </li>
                ))}
              </ul>
              <a href={proverbsChapterUrl(chapter)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-sm font-medium text-link underline underline-offset-4" aria-label={`Read the full chapter Proverbs ${chapter} in BSB on Bible Gateway (opens in a new tab)`}>Read Proverbs {chapter} →</a>
            </div>
          </details>
        ))}
      </div>
      <aside className="bc-callout mt-7" aria-label="Grace and wisdom"><p className="m-0 leading-7">{PROVERBS_GRACE_GUARDRAIL}</p></aside>
    </article>
  );
}
