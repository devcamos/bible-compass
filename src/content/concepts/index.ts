import ontology from "./ontology.json";

export { ontology };
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

export function passageRef(passage: Passage) {
  const end = passage.verseEnd === passage.verseStart ? "" : `-${passage.verseEnd}`;
  return `${passage.book} ${passage.chapter}:${passage.verseStart}${end}`;
}

export function passageUrl(passage: Passage) {
  return `https://www.biblegateway.com/passage/?search=${encodeURIComponent(passageRef(passage))}&version=NIV`;
}

export function relationsForConcept(id: string) {
  return ontology.relations.filter((relation) => relation.sourceId === id || relation.targetId === id);
}
