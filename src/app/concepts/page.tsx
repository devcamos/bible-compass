import type { Metadata } from "next";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ConceptExplorer } from "@/components/ConceptExplorer";
import { concepts, ontology } from "@/content/concepts";
import { lifeAreas } from "@/content/home";

export const metadata: Metadata = {
  title: "Concepts",
  description: "Explore biblical concepts and their connections to Scripture, life areas and related topics.",
  alternates: { canonical: "/concepts" },
};

export default function ConceptsPage() {
  return (
    <article>
      <Breadcrumb current="Concepts" />
      <h1 className="bc-title bc-heading mb-2">Concepts</h1>
      <p className="mb-6 leading-7 text-muted-foreground">Explore biblical beliefs, frameworks, practices, principles and themes. See the passages behind them and the connections between them.</p>
      <ConceptExplorer
        entries={concepts.map(({ id, slug, title, summary, aliases, categoryId, typeIds, domainIds, lifeAreaIds, topicSlugs, scripture }) => ({ id, slug, title, summary, aliases, categoryId, typeIds, domainIds, lifeAreaIds, topicCount: topicSlugs.length, passageCount: scripture.length }))}
        categories={ontology.categories} types={ontology.types} domains={ontology.domains}
        lifeAreas={lifeAreas.map(({ id, title }) => ({ id, title }))}
        relations={ontology.relations.map(({ sourceId, targetId }) => ({ sourceId, targetId }))}
      />
      <p className="mt-6 text-sm leading-6 text-muted-foreground">{ontology.classificationNote}</p>
    </article>
  );
}
