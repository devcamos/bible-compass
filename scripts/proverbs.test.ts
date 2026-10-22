import assert from "node:assert/strict";
import test from "node:test";
import { TOPIC_SLUGS } from "../src/content";
import ontology from "../src/content/concepts/ontology.json";
import {
  PROVERBS_CATEGORIES,
  PROVERBS_CONCEPT_MAPPING,
  PROVERBS_VERSES,
  getProverbsChapterGroups,
  getProverbsVersesForCategory,
  proverbsChapterUrl,
  proverbsVerseUrl,
} from "../src/content/proverbs";

// Proverbs chapter lengths; prevents references to non-existent verses.
const VERSE_COUNTS = [33, 22, 35, 27, 23, 35, 27, 36, 18, 32, 31, 28, 25, 35, 33, 33, 28, 24, 29, 30, 31, 29, 35, 34, 28, 28, 27, 28, 27, 33, 31];

test("Proverbs maps to a published concept with curated Scripture evidence", () => {
  assert.ok(ontology.concepts.some((concept) => concept.slug === PROVERBS_CONCEPT_MAPPING.conceptSlug));
  for (const id of PROVERBS_CONCEPT_MAPPING.verseIds) {
    assert.ok(PROVERBS_VERSES.some((verse) => verse.id === id), `Missing mapping evidence ${id}`);
  }
});

test("curated Proverbs references are canonical, unique and within chapter bounds", () => {
  const ids = new Set<string>();
  const references = new Set<string>();
  const categorySlugs = new Set(PROVERBS_CATEGORIES.map((category) => category.slug));
  for (const entry of PROVERBS_VERSES) {
    assert.ok(Number.isInteger(entry.chapter) && entry.chapter >= 1 && entry.chapter <= 31);
    assert.ok(Number.isInteger(entry.verse) && entry.verse >= 1 && entry.verse <= VERSE_COUNTS[entry.chapter - 1]);
    assert.equal(entry.id, `proverbs-${entry.chapter}-${entry.verse}`);
    assert.ok(!ids.has(entry.id), `Duplicate canonical ID ${entry.id}`);
    assert.ok(!references.has(`${entry.chapter}:${entry.verse}`), `Duplicate source reference ${entry.id}`);
    ids.add(entry.id);
    references.add(`${entry.chapter}:${entry.verse}`);
    assert.ok(entry.title.trim() && entry.summary.trim() && entry.context.trim());
    assert.ok(entry.categorySlugs.length > 0);
    assert.equal(new Set(entry.categorySlugs).size, entry.categorySlugs.length);
    for (const slug of entry.categorySlugs) assert.ok(categorySlugs.has(slug), `Unknown category ${slug}`);
  }
});

test("every approved category has useful selections across multiple chapters", () => {
  assert.equal(PROVERBS_CATEGORIES.length, 8);
  assert.equal(new Set(PROVERBS_CATEGORIES.map((category) => category.slug)).size, 8);
  for (const category of PROVERBS_CATEGORIES) {
    const selections = getProverbsVersesForCategory(category.slug);
    assert.ok(selections.length >= 4, `${category.slug} needs at least four selections`);
    assert.ok(new Set(selections.map((entry) => entry.chapter)).size >= 2, `${category.slug} needs multiple chapters`);
    const groups = getProverbsChapterGroups(category.slug);
    assert.deepEqual(groups.map((group) => group.chapter), groups.map((group) => group.chapter).sort((a, b) => a - b));
    assert.equal(groups.flatMap((group) => group.verses).length, selections.length);
  }
  assert.deepEqual(getProverbsChapterGroups("not-a-category"), []);
});

test("Words and speech preserves all approved sample references", () => {
  assert.deepEqual(getProverbsVersesForCategory("words-and-speech").map((entry) => `${entry.chapter}:${entry.verse}`), ["12:18", "12:19", "12:22", "15:1", "15:4", "15:28", "18:13", "18:21"]);
});

test("Explore further destinations name existing published topics", () => {
  const topicSlugs = new Set(TOPIC_SLUGS);
  for (const entry of PROVERBS_VERSES) {
    assert.ok(entry.relatedTopics.length > 0, `${entry.id} needs an Explore further destination`);
    for (const slug of entry.relatedTopics) assert.ok(topicSlugs.has(slug), `${entry.id} links to missing topic ${slug}`);
  }
});

test("verse links target the specific passage and chapter links target the whole chapter", () => {
  for (const entry of PROVERBS_VERSES) {
    const passage = new URL(proverbsVerseUrl(entry.chapter, entry.verse));
    const chapter = new URL(proverbsChapterUrl(entry.chapter));
    for (const link of [passage, chapter]) {
      assert.equal(link.origin, "https://www.biblegateway.com");
      assert.equal(link.pathname, "/passage/");
      assert.equal(link.searchParams.get("version"), "BSB");
    }
    assert.equal(passage.searchParams.get("search"), `Proverbs ${entry.chapter}:${entry.verse}`);
    assert.equal(chapter.searchParams.get("search"), `Proverbs ${entry.chapter}`);
  }
});
