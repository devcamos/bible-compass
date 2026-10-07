import ontology from "./ontology.json";
import { resolveScriptureReferences } from "@/lib/scripture-mapping.mjs";

export { ontology };
export { scriptureReference as passageRef, scriptureUrl as passageUrl } from "@/lib/scripture-mapping.mjs";
export type Concept = (typeof ontology.concepts)[number];
export type Passage = Concept["scripture"][number];
export const concepts = ontology.concepts;
export const CONCEPT_SLUGS = concepts.map((concept) => concept.slug);
const bySlug = new Map(concepts.map((concept) => [concept.slug, concept]));

export function getConcept(slug: string) {
  return bySlug.get(slug);
}

export function conceptsForTopic(slug: string) {
  return concepts.filter((concept) => concept.topicSlugs.includes(slug));
}

export function guidancePassages(concept: Concept, action: Concept["livingGuidance"][number]) {
  const sources = concept.scripture.filter((passage) => action.scriptureIds.includes(passage.id));
  return resolveScriptureReferences(sources, action.scriptureReferences);
}

export function relationsForConcept(id: string) {
  return ontology.relations.filter((relation) => relation.sourceId === id || relation.targetId === id);
}
