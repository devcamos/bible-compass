import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { requireTopic } from "@/content";
import { CONCEPT_SLUGS, getConcept, ontology, passageRef, passageUrl, relationsForConcept } from "@/content/concepts";
import { lifeAreas } from "@/content/home";

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
  const labels = (options: { id: string; title: string }[], ids: string[]) => options.filter((option) => ids.includes(option.id)).map((option) => option.title).join(", ");
  const relations = relationsForConcept(concept.id);
  const keySource = concept.scripture.find((passage) => passage.id === concept.keyVerse.passageId)!;
  const keyPassage = { ...keySource, verseStart: concept.keyVerse.verseStart, verseEnd: concept.keyVerse.verseEnd };
  const conceptType = conceptTypeLabels[concept.categoryId];
  return (
    <article>
      <Breadcrumb current={concept.title} />
      <Link href="/concepts" className="text-sm text-link">All concepts</Link>
      <h1 className="bc-title mb-2 text-[2rem]">{concept.title}</h1>
      <p className="mb-6 text-sm text-muted-foreground">{conceptType}</p>

      <section className="bc-callout" aria-labelledby="key-verse-heading">
        <h2 id="key-verse-heading" className="bc-title mt-0 text-xl">Key Bible Verse</h2>
        <blockquote className="mx-0 my-4 text-lg leading-8">
          <p className="m-0">“{concept.keyVerse.text}”</p>
        </blockquote>
        <a href={passageUrl(keyPassage)} className="font-medium text-link" target="_blank" rel="noreferrer">
          {passageRef(keyPassage)} ({concept.keyVerse.translation}{concept.keyVerse.isExcerpt ? ", excerpt" : ""})
        </a>
        <p className="mb-0 text-sm text-muted-foreground">Read in context: <a href={passageUrl(keySource)} className="text-link" target="_blank" rel="noreferrer">{passageRef(keySource)}</a>.</p>
      </section>

      <section className="mt-8" aria-labelledby="explanation-heading">
        <h2 id="explanation-heading" className="bc-title text-xl">Concept Explained</h2>
        {concept.explanation.map((paragraph) => <p key={paragraph} className="leading-8">{paragraph}</p>)}
      </section>

      <section className="mt-8" aria-labelledby="living-heading">
        <h2 id="living-heading" className="bc-title text-xl">How the Bible Suggests Living With This {conceptType}</h2>
        <ul className="m-0 list-none space-y-3 p-0">
          {concept.livingGuidance.map((action) => (
            <li key={action.id} className="rounded-2xl border border-border bg-card p-4">
              <h3 className="mt-0 mb-2 text-base font-medium">{action.title}</h3>
              <p className="mt-0 leading-7 text-muted-foreground">{action.detail}</p>
              <p className="mb-0 text-sm">Based on {concept.scripture.filter((passage) => action.scriptureIds.includes(passage.id)).map((passage, index) => <span key={passage.id}>{index ? ", " : ""}<a className="text-link" href={passageUrl(passage)} target="_blank" rel="noreferrer">{passageRef(passage)}</a></span>)}.</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="bc-callout mt-8" aria-label="Theological guardrail">{concept.graceGuardrail}</section>

      <details className="mt-8 rounded-2xl border border-border p-4">
      <summary className="font-medium"><span className="summary-label">Read More and Explore Mappings</span></summary>
      <section aria-labelledby="classification-heading">
        <h2 id="classification-heading" className="bc-title text-xl">Classification</h2>
        <dl className="space-y-2 text-base">
          {[["Concept family", labels(ontology.categories, [concept.categoryId])], ["Concept type", labels(ontology.types, concept.typeIds)], ["Theological domain", labels(ontology.domains, concept.domainIds)], ["Life area", labels(lifeAreas, concept.lifeAreaIds)]].map(([name, value]) => <div key={name}><dt className="inline font-medium">{name}: </dt><dd className="m-0 inline text-muted-foreground">{value}</dd></div>)}
        </dl>
      </section>
      <section className="mt-8" aria-labelledby="scripture-heading">
        <h2 id="scripture-heading" className="bc-title text-xl">Scripture in context</h2>
        <ul className="space-y-4 pl-5">{concept.scripture.map((passage) => <li key={passage.id} className="leading-7"><a href={passageUrl(passage)} className="font-medium text-link" target="_blank" rel="noreferrer">{passageRef(passage)} (NIV)</a><p className="mt-1 text-muted-foreground">{passage.insight}</p></li>)}</ul>
        <p className="text-sm text-muted-foreground">These descriptions are study summaries. Read the linked passage and surrounding chapter in context.</p>
      </section>
      <section className="mt-8" aria-labelledby="relationships-heading">
        <h2 id="relationships-heading" className="bc-title text-xl">Related concepts</h2>
        {relations.length ? <ul className="m-0 list-none space-y-3 p-0">{relations.map((relation) => {
          const source = getConcept(relation.sourceId)!;
          const target = getConcept(relation.targetId)!;
          const passages = source.scripture.filter((passage) => relation.scriptureIds.includes(passage.id));
          return <li key={relation.id} className="rounded-2xl border border-border bg-card p-4">
            <p className="mt-0 leading-7"><Link className="font-medium text-link" href={`/concepts/${source.slug}`}>{source.title}</Link>{" "}<span className="text-muted-foreground">{relation.predicate.replaceAll("-", " ")}</span>{" "}<Link className="font-medium text-link" href={`/concepts/${target.slug}`}>{target.title}</Link></p>
            <p className="text-muted-foreground">{relation.note}</p>
            <p className="mb-0 text-sm">Study mapping based on {passages.map((passage, index) => <span key={passage.id}>{index ? ", " : ""}<a className="text-link" href={passageUrl(passage)} target="_blank" rel="noreferrer">{passageRef(passage)}</a></span>)}.</p>
          </li>;
        })}</ul> : <p className="text-muted-foreground">No concept relationships have been mapped yet. Explore the passages and topic connections below.</p>}
      </section>
      <nav className="mt-8" aria-label="Related life topics">
        <h2 className="bc-title text-xl">Explore in daily life</h2>
        <div className="flex flex-wrap gap-2">{concept.topicSlugs.map((topicSlug) => <Link key={topicSlug} href={`/topics/${topicSlug}`} className="bc-btn bc-btn--quiet">{requireTopic(topicSlug).title}</Link>)}</div>
      </nav>
      </details>
      <p className="mt-6 text-sm leading-6 text-muted-foreground">Classification and relationships are editorial study mappings. Scripture is the authority.</p>
    </article>
  );
}
