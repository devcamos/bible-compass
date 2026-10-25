import assert from "node:assert/strict";
import test from "node:test";
import { IDBFactory } from "fake-indexeddb";
import { TOPIC_SLUGS } from "../src/content";
import { CONCEPT_SLUGS } from "../src/content/concepts";
import { entryPaths, lifeAreas } from "../src/content/home";
import { PROVERBS_CATEGORIES, PROVERBS_VERSES } from "../src/content/proverbs";
import { PSALMS_CATEGORIES, PSALMS_VERSES } from "../src/content/psalms";
import {
  REVELATION_CATEGORIES,
  REVELATION_CONCEPT_MAPPING,
  REVELATION_INTRODUCTION,
  REVELATION_PASSAGES,
  getRevelationCategory,
  getRevelationGroups,
  getRevelationPassage,
  getRevelationPassagesForCategory,
  revelationPassageUrl,
  revelationUrl,
  revelationVerseReference,
} from "../src/content/revelation";
import { SAVED_PAGE_CATALOG } from "../src/lib/saved-page-catalog";
import { mutateSavedPage, openSavedPages, readSavedPages } from "../src/lib/saved-pages";
import RevelationCategoryPage, { generateStaticParams as categoryParams } from "../src/app/revelation/[category]/page";
import RevelationPassagePage, { generateStaticParams as passageParams } from "../src/app/revelation/[category]/verses/[id]/page";

// The agreed editorial selections are the oracle, independently of content filters.
// English chapter lengths prevent a well-formed ID from naming a nonexistent verse.
const VERSE_COUNTS: Record<number, number> = {
  1: 20, 2: 29, 3: 22, 4: 11, 5: 14, 6: 17,
  7: 17, 13: 18, 14: 20, 21: 27, 22: 21,
};
type Theme = {
  slug: string;
  title: string;
  groups: readonly { chapter: number; ranges: readonly (readonly [number, number])[] }[];
  relatedPaths: readonly string[];
};
const THEMES: readonly Theme[] = [
  {
    slug: "jesus-and-worship", title: "Jesus & worship",
    groups: [{ chapter: 1, ranges: [[17, 18]] }, { chapter: 4, ranges: [[8, 11]] }, { chapter: 5, ranges: [[9, 10], [12, 13]] }],
    relatedPaths: ["/psalms/praise-and-worship", "/topics/jesus-and-the-gospel"],
  },
  {
    slug: "faithfulness-under-pressure", title: "Faithfulness under pressure",
    groups: [{ chapter: 2, ranges: [[10, 11]] }, { chapter: 3, ranges: [[7, 13]] }, { chapter: 14, ranges: [[12, 13]] }],
    relatedPaths: ["/proverbs/wisdom-and-discernment", "/psalms/trust-and-refuge"],
  },
  {
    slug: "discernment-and-allegiance", title: "Discernment & allegiance",
    groups: [{ chapter: 13, ranges: [[1, 4], [11, 14]] }, { chapter: 14, ranges: [[6, 7]] }],
    relatedPaths: ["/proverbs/wisdom-and-discernment", "/psalms/wisdom-and-everyday-living"],
  },
  {
    slug: "justice-and-hope", title: "Justice & hope",
    groups: [{ chapter: 6, ranges: [[9, 11]] }, { chapter: 7, ranges: [[9, 12], [13, 17]] }],
    relatedPaths: ["/psalms/lament-and-honest-prayer", "/psalms/justice-and-hope"],
  },
  {
    slug: "restoration-and-new-creation", title: "Restoration & new creation",
    groups: [{ chapter: 21, ranges: [[1, 4], [22, 27]] }, { chapter: 22, ranges: [[1, 5]] }],
    relatedPaths: ["/psalms/justice-and-hope", "/topics/jesus-and-the-gospel"],
  },
];
const selections = THEMES.flatMap(theme => theme.groups.flatMap(group => group.ranges.map(([start, end]) => ({
  id: `revelation-${group.chapter}-${start}-${end}`,
  category: theme.slug, chapter: group.chapter, start, end,
}))));
const revelationPaths = ["/revelation", ...THEMES.map(({ slug }) => `/revelation/${slug}`),
  ...selections.map(({ category, id }) => `/revelation/${category}/verses/${id}`)];
const existingReadingPaths = [
  ...TOPIC_SLUGS.map(slug => `/topics/${slug}`), ...CONCEPT_SLUGS.map(slug => `/concepts/${slug}`),
  "/proverbs", ...PROVERBS_CATEGORIES.map(({ slug }) => `/proverbs/${slug}`),
  ...PROVERBS_VERSES.map(({ id }) => `/proverbs/verses/${id}`),
  "/psalms", ...PSALMS_CATEGORIES.map(({ slug }) => `/psalms/${slug}`),
  ...PSALMS_VERSES.flatMap(verse => verse.categorySlugs.map(slug => `/psalms/${slug}/verses/${verse.id}`)),
];

test("Revelation has the five agreed themes and exact chapter/passage memberships", () => {
  assert.deepEqual(REVELATION_CATEGORIES.map(({ slug, title }) => ({ slug, title })),
    THEMES.map(({ slug, title }) => ({ slug, title })));
  for (const theme of THEMES) {
    const category = getRevelationCategory(theme.slug);
    assert.ok(category?.description.trim());
    const expected = selections.filter(({ category }) => category === theme.slug);
    assert.deepEqual(getRevelationPassagesForCategory(theme.slug).map(({ id }) => id), expected.map(({ id }) => id));
    assert.deepEqual(getRevelationGroups(theme.slug).map(group => ({
      chapter: group.chapter, ranges: group.passages.map(({ verseStart, verseEnd }) => [verseStart, verseEnd]),
    })), theme.groups);
  }
});

test("all 16 canonical passages across 11 chapters have unique, valid English references", () => {
  assert.equal(REVELATION_PASSAGES.length, 16);
  assert.equal(new Set(REVELATION_PASSAGES.map(({ id }) => id)).size, 16);
  assert.deepEqual(REVELATION_PASSAGES.map(({ id }) => id).sort(), selections.map(({ id }) => id).sort());
  assert.deepEqual([...new Set(REVELATION_PASSAGES.map(({ chapter }) => chapter))].sort((a, b) => a - b),
    [1, 2, 3, 4, 5, 6, 7, 13, 14, 21, 22]);
  for (const expected of selections) {
    const passage = getRevelationPassage(expected.id);
    assert.ok(passage, expected.id);
    assert.deepEqual([passage.chapter, passage.verseStart, passage.verseEnd], [expected.chapter, expected.start, expected.end]);
    assert.ok(Number.isInteger(passage.chapter) && VERSE_COUNTS[passage.chapter]);
    assert.ok(Number.isInteger(passage.verseStart) && passage.verseStart >= 1);
    assert.ok(Number.isInteger(passage.verseEnd) && passage.verseEnd >= passage.verseStart && passage.verseEnd <= VERSE_COUNTS[passage.chapter]);
    assert.equal(passage.id, `revelation-${passage.chapter}-${passage.verseStart}-${passage.verseEnd}`);
    assert.deepEqual(passage.categorySlugs, [expected.category]);
    assert.ok(passage.title.trim() && passage.summary.trim() && passage.context.trim(), passage.id);
  }
});

test("unknown lookups and mismatched category/passage pairs never become canonical readings", () => {
  for (const slug of ["missing", "Revelation", "jesus-and-worship/extra", ""]) {
    assert.equal(getRevelationCategory(slug), undefined);
    assert.deepEqual(getRevelationGroups(slug), []);
    assert.deepEqual(getRevelationPassagesForCategory(slug), []);
  }
  for (const id of ["missing", "revelation-1-17-19", "revelation-23-1-2", ""]) assert.equal(getRevelationPassage(id), undefined);
  const saved = new Set(SAVED_PAGE_CATALOG.map(({ path }) => path));
  for (const theme of THEMES) for (const selection of selections) {
    const path = revelationPassageUrl(theme.slug, selection.id);
    const belongs = theme.slug === selection.category;
    assert.equal(getRevelationPassagesForCategory(theme.slug).some(({ id }) => id === selection.id), belongs, path);
    assert.equal(saved.has(path), belongs, path);
  }
});

test("server routes generate only agreed pairs and invoke 404 for missing or mismatched resources", async () => {
  assert.deepEqual(categoryParams(), THEMES.map(({ slug }) => ({ category: slug })));
  assert.deepEqual(passageParams(), selections.map(({ category, id }) => ({ category, id })));
  const notFound = { digest: "NEXT_HTTP_ERROR_FALLBACK;404" };
  await assert.rejects(RevelationCategoryPage({ params: Promise.resolve({ category: "missing" }) }), notFound);
  for (const params of [
    { category: "missing", id: selections[0].id },
    { category: THEMES[0].slug, id: "missing" },
    ...THEMES.flatMap(theme => selections.filter(({ category }) => category !== theme.slug)
      .map(({ id }) => ({ category: theme.slug, id }))),
  ]) await assert.rejects(RevelationPassagePage({ params: Promise.resolve(params) }), notFound);
});

test("Scripture and app links preserve exact verses, readable ranges and whole chapters", () => {
  for (const selected of selections) {
    const passage = getRevelationPassage(selected.id)!;
    assert.equal(revelationUrl(selected.chapter), `https://biblehub.com/bsb/revelation/${selected.chapter}.htm`);
    assert.equal(revelationUrl(selected.chapter, selected.start), `https://biblehub.com/bsb/revelation/${selected.chapter}.htm#${selected.start}`);
    assert.equal(revelationVerseReference(passage), `Revelation ${selected.chapter}:${selected.start}–${selected.end}`);
    assert.equal(revelationPassageUrl(selected.category, selected.id), `/revelation/${selected.category}/verses/${selected.id}`);
  }
  assert.equal(revelationVerseReference({ chapter: 1, verseStart: 17, verseEnd: 17 }), "Revelation 1:17");
  assert.equal(revelationUrl(1, 17), "https://biblehub.com/bsb/revelation/1.htm#17");
});

test("concept mappings and every Explore further destination resolve to existing published content", () => {
  assert.deepEqual(REVELATION_CONCEPT_MAPPING.conceptSlugs, ["worship", "wisdom"]);
  const published = new Set(existingReadingPaths);
  for (const slug of REVELATION_CONCEPT_MAPPING.conceptSlugs) assert.ok(published.has(`/concepts/${slug}`));
  for (const theme of THEMES) for (const passage of getRevelationPassagesForCategory(theme.slug)) {
    const paths = [...passage.relatedTopics.map(slug => `/topics/${slug}`), ...passage.relatedLinks.map(({ href }) => href)];
    assert.equal(new Set(paths).size, paths.length, `${passage.id}: duplicate related destination`);
    assert.deepEqual(paths.toSorted(), [...theme.relatedPaths].sort(), passage.id);
    for (const path of paths) assert.ok(published.has(path), `${passage.id}: unpublished destination ${path}`);
    for (const link of passage.relatedLinks) assert.ok(link.title.trim(), passage.id);
  }
  assert.equal(REVELATION_INTRODUCTION.length, 5);
  for (const bullet of REVELATION_INTRODUCTION) assert.ok(bullet.title.trim() && bullet.text.trim());
});

test("home adds only one compact Foundations link and preserves Jesus, Proverbs and Psalms", () => {
  assert.equal(lifeAreas.length, 8);
  const foundations = lifeAreas.find(({ id }) => id === "foundations");
  assert.deepEqual(foundations?.topicSlugs, ["jesus-and-the-gospel", "components-of-the-bible", "how-to-read-the-bible", "bible-timeline", "books-described"]);
  assert.deepEqual(foundations?.links?.map(({ href }) => href), ["/proverbs", "/psalms", "/revelation"]);
  assert.equal(lifeAreas.flatMap(area => area.links ?? []).filter(({ href }) => href === "/revelation").length, 1);
  assert.deepEqual(entryPaths.map(({ href }) => href), ["/topics/peace", "/topics/courage", "/topics/faith", "/topics/how-to-read-the-bible"]);
});

test("saved catalog expands by exactly the 22 canonical Revelation readings without losing existing paths", () => {
  const paths = SAVED_PAGE_CATALOG.map(({ path }) => path);
  assert.equal(new Set(paths).size, paths.length);
  assert.deepEqual([...paths].sort(), [...existingReadingPaths, ...revelationPaths].sort());
  assert.equal(paths.filter(path => path === "/revelation" || path.startsWith("/revelation/")).length, 22);
  for (const page of SAVED_PAGE_CATALOG) {
    assert.ok(page.title.trim() && page.context.trim(), page.path);
    assert.match(page.path, /^\/[a-z0-9/-]+$/);
  }
});

test("existing local saves survive the expanded allowlist and invalid Revelation URLs cannot be saved", async t => {
  const db = await openSavedPages(new IDBFactory());
  t.after(() => db.close());
  const oldPaths = new Set(existingReadingPaths);
  const expanded = new Set(SAVED_PAGE_CATALOG.map(({ path }) => path));
  const previous = ["/topics/jesus-and-the-gospel", "/psalms/trust-and-refuge/verses/psalm-23-1"];
  for (const path of previous) await mutateSavedPage(db, oldPaths, { type: "save", path });
  assert.deepEqual(new Set((await readSavedPages(db, expanded)).map(({ path }) => path)), new Set(previous));
  const newPath = "/revelation/faithfulness-under-pressure/verses/revelation-2-10-11";
  await mutateSavedPage(db, expanded, { type: "save", path: newPath });
  const confirmed = await readSavedPages(db, expanded);
  assert.deepEqual(new Set(confirmed.map(({ path }) => path)), new Set([...previous, newPath]));
  for (const path of ["/", "/saved", "/feedback", "/verse-of-the-day", "/api/feedback", "/concepts/data", "/health",
    "/revelation/missing", "/revelation/jesus-and-worship/verses/revelation-2-10-11",
    "/revelation/verses/revelation-2-10-11", `${newPath}?source=other`, `${newPath}#10`,
    "https://biblehub.com/bsb/revelation/2.htm#10"]) {
    assert.ok(!expanded.has(path), path);
    await assert.rejects(mutateSavedPage(db, expanded, { type: "save", path }), /cannot be saved/);
  }
  assert.deepEqual(await readSavedPages(db, expanded), confirmed);
  assert.equal(db.version, 1);
  assert.deepEqual(Array.from(db.objectStoreNames), ["pages"]);
});
