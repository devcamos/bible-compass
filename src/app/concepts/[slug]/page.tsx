import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { CONCEPT_SLUGS, getConcept, guidancePassages, passageRef, passageUrl } from "@/content/concepts";
import { capitaliseQuotation } from "@/lib/quotation";

const conceptTypeLabels: Record<string, string> = {
  doctrines: "Doctrine",
  frameworks: "Biblical Framework",
  practices: "Spiritual Practice",
  principles: "Principle",
  themes: "Biblical Theme",
};

export const dynamicParams = false;
export function generateStaticParams() { return CONCEPT_SLUGS.map((slug) => ({ slug })); }

export async function generateMetadata({ params }: PageProps<"/concepts/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const concept = getConcept(slug);
  return concept ? { title: concept.title, description: concept.summary, alternates: { canonical: `/concepts/${slug}` } } : { title: "Concept" };
}

export default async function ConceptPage({ params }: PageProps<"/concepts/[slug]">) {
  const { slug } = await params;
  const concept = getConcept(slug);
  if (!concept) notFound();
  const keySource = concept.scripture.find((passage) => passage.id === concept.keyVerse.passageId)!;
  const keyPassage = { ...keySource, verseStart: concept.keyVerse.verseStart, verseEnd: concept.keyVerse.verseEnd };
  const conceptType = conceptTypeLabels[concept.categoryId];
  return (
    <article>
      <Breadcrumb current={concept.title} />
      <Link href="/concepts" className="text-sm text-link">All concepts</Link>
      <header className="mt-4 mb-8">
        <h1 className="bc-title bc-heading m-0 mb-2 leading-snug">{concept.title}</h1>
        <p className="m-0 text-sm leading-6 text-muted-foreground">{conceptType}</p>
      </header>

      <section className="bc-callout" aria-labelledby="key-verse-heading">
        <h2 id="key-verse-heading" className="bc-title bc-heading m-0 mb-4 leading-snug">Key Bible Verse</h2>
        <blockquote className="m-0 mb-4 text-lg leading-8">
          <p className="m-0">“{capitaliseQuotation(concept.keyVerse.text)}”</p>
        </blockquote>
        <p className="m-0 leading-7">
          <a href={passageUrl(keyPassage)} className="font-medium text-link" target="_blank" rel="noreferrer">
            {passageRef(keyPassage)} ({concept.keyVerse.translation}{concept.keyVerse.isExcerpt ? ", excerpt" : ""})
          </a>
        </p>
        <p className="mt-3 mb-0 text-sm leading-6 text-muted-foreground">Read in context: <a href={passageUrl(keySource)} className="text-link" target="_blank" rel="noreferrer">{passageRef(keySource)}</a>.</p>
      </section>

      <section className="mt-8" aria-labelledby="explanation-heading">
        <h2 id="explanation-heading" className="bc-title bc-heading m-0 mb-4 leading-snug">Concept Explained</h2>
        <div className="space-y-4">
          {concept.explanation.map((paragraph) => <p key={paragraph} className="m-0 leading-8">{paragraph}</p>)}
        </div>
      </section>

      <section className="mt-8" aria-labelledby="living-heading">
        <h2 id="living-heading" className="bc-title bc-heading m-0 mb-4 leading-snug">How the Bible Suggests Living With This {conceptType}</h2>
        <ul className="m-0 list-none space-y-4 p-0">
          {concept.livingGuidance.map((action) => (
            <li key={action.id} className="rounded-2xl border border-border bg-card p-5">
              <h3 className="bc-heading m-0 mb-3 leading-snug font-medium">{action.title}</h3>
              <p className="m-0 mb-4 leading-7 text-muted-foreground">{action.detail}</p>
              <p className="m-0 text-sm leading-6">{guidancePassages(concept, action).map((passage, index) => <span key={`${passage.id}:${passage.verseStart}:${passage.verseEnd}`}>{index ? ", " : ""}<a className="text-link" href={passageUrl(passage)} target="_blank" rel="noreferrer">{passageRef(passage)}</a></span>)}.</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="bc-callout mt-8" aria-label="Theological guardrail">
        <p className="m-0 leading-7">{concept.graceGuardrail}</p>
      </section>
    </article>
  );
}
