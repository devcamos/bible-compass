import assert from "node:assert/strict";
import test from "node:test";
import { TOPIC_SLUGS } from "../src/content";
import { lifeAreas } from "../src/content/home";
import ontology from "../src/content/concepts/ontology.json";
import {
  PSALMS_CATEGORIES,
  PSALMS_CONCEPT_MAPPING,
  PSALMS_VERSES,
  getPsalmsCategory,
  getPsalmsGroups,
  getPsalmsVerse,
  getPsalmsVersesForCategory,
  psalmUrl,
  psalmVerseUrl,
} from "../src/content/psalms";

// English verse counts for the selected Psalms; ranges use English numbering.
const VERSE_COUNTS: Record<number, number> = {
  1: 6, 8: 9, 10: 18, 13: 6, 19: 14, 23: 6, 30: 12,
  32: 11, 42: 11, 46: 11, 51: 19, 72: 20, 82: 8,
  88: 18, 90: 17, 95: 11, 100: 5, 107: 43, 121: 8,
  130: 8, 150: 6,
};

test("Psalms is a compact Foundations entry and maps to published concepts", () => {
  const foundations = lifeAreas.find(({ id }) => id === "foundations");
  assert.ok(foundations?.links?.some(({ href }) => href === "/proverbs"));
  assert.equal(foundations?.links?.filter(({ href }) => href === "/psalms").length, 1);
  assert.deepEqual(PSALMS_CONCEPT_MAPPING.conceptSlugs, ["prayer", "worship"]);
  for (const slug of PSALMS_CONCEPT_MAPPING.conceptSlugs) {
    assert.ok(ontology.concepts.some((concept) => concept.slug === slug));
  }
});

test("canonical highlights have valid unique references, ranges and published topic destinations", () => {
  const ids = new Set<string>();
  const topics = new Set(TOPIC_SLUGS);
  const categories = new Set<string>(PSALMS_CATEGORIES.map(({ slug }) => slug));
  for (const verse of PSALMS_VERSES) {
    const { psalm, verseStart, verseEnd } = verse;
    assert.ok(Number.isInteger(psalm) && VERSE_COUNTS[psalm]);
    assert.ok(Number.isInteger(verseStart) && verseStart >= 1);
    const end = verseEnd ?? verseStart;
    assert.ok(Number.isInteger(end) && end >= verseStart && end <= VERSE_COUNTS[psalm]);
    assert.equal(verse.id, `psalm-${psalm}-${verseStart}${verseEnd === undefined ? "" : `-${verseEnd}`}`);
    assert.ok(!ids.has(verse.id), `Duplicate reference ${verse.id}`);
    ids.add(verse.id);
    assert.equal(getPsalmsVerse(verse.id), verse);
    assert.ok(verse.title.trim() && verse.summary.trim() && verse.context.trim());
    assert.ok(verse.categorySlugs.length && verse.relatedTopics.length);
    assert.equal(new Set(verse.categorySlugs).size, verse.categorySlugs.length);
    for (const slug of verse.categorySlugs) assert.ok(categories.has(slug));
    for (const slug of verse.relatedTopics) assert.ok(topics.has(slug), `${verse.id}: unknown topic ${slug}`);
  }
  assert.equal(PSALMS_VERSES.length, 42);
  assert.equal(new Set(PSALMS_VERSES.map(({ psalm }) => psalm)).size, 21);
  assert.equal(getPsalmsVerse("not-a-verse"), undefined);
});

test("all seven themes contain the agreed Psalm groups and their verse highlights", () => {
  const expected: Record<string, number[]> = {
    "trust-and-refuge": [23, 46, 121],
    "lament-and-honest-prayer": [13, 42, 88],
    "praise-and-worship": [8, 95, 150],
    "thanksgiving-and-remembrance": [30, 100, 107],
    "confession-and-renewal": [32, 51, 130],
    "wisdom-and-everyday-living": [1, 19, 90],
    "justice-and-hope": [10, 72, 82],
  };
  assert.equal(PSALMS_CATEGORIES.length, 7);
  assert.equal(new Set(PSALMS_CATEGORIES.map(({ slug }) => slug)).size, 7);
  for (const category of PSALMS_CATEGORIES) {
    assert.equal(getPsalmsCategory(category.slug), category);
    const groups = getPsalmsGroups(category.slug);
    assert.deepEqual(groups.map(({ psalm }) => psalm), expected[category.slug]);
    assert.equal(getPsalmsVersesForCategory(category.slug).length, 6);
    for (const group of groups) {
      assert.equal(group.verses.length, 2);
      assert.deepEqual(group.verses.map(({ verseStart }) => verseStart),
        group.verses.map(({ verseStart }) => verseStart).sort((a, b) => a - b));
      for (const verse of group.verses) assert.ok(verse.categorySlugs.includes(category.slug));
    }
  }
  assert.equal(getPsalmsCategory("not-a-category"), undefined);
  assert.deepEqual(getPsalmsGroups("not-a-category"), []);
  assert.deepEqual(getPsalmsVersesForCategory("not-a-category"), []);
});

test("Scripture links preserve exact single verses, ranges and whole Psalms", () => {
  for (const verse of PSALMS_VERSES) {
    const passage = new URL(psalmVerseUrl(verse.psalm, verse.verseStart, verse.verseEnd));
    const whole = new URL(psalmUrl(verse.psalm));
    for (const url of [passage, whole]) {
      assert.equal(url.origin, "https://biblehub.com");
      assert.equal(url.pathname, `/bsb/psalms/${verse.psalm}.htm`);
    }
    assert.equal(passage.hash, `#${verse.verseStart}`);
    assert.equal(whole.hash, "");
  }
});
