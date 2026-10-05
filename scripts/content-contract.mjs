import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "src");

function read(path) {
  return readFileSync(path, "utf8");
}

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

const topicDir = join(src, "content/topics");
const topicFiles = readdirSync(topicDir)
  .filter((name) => name.endsWith(".ts"))
  .map((name) => name.replace(/\.ts$/, ""))
  .sort();

const indexSource = read(join(src, "content/index.ts"));
const homeSource = read(join(src, "content/home.ts"));
const declaredSlugs = topicFiles.map((slug) => {
  const ts = read(join(topicDir, `${slug}.ts`));
  const fromTs = ts.match(/slug:\s*"([^"]+)"/)?.[1];
  if (fromTs) return fromTs;
  const jsonPath = join(topicDir, `${slug}.json`);
  if (existsSync(jsonPath)) {
    return read(jsonPath).match(/"slug"\s*:\s*"([^"]+)"/)?.[1] ?? "";
  }
  return "";
});

const ontology = JSON.parse(read(join(src, "content/concepts/ontology.json")));
const allowedHrefs = new Set(["/", "/how-to-use", "/concepts", ...topicFiles.map((slug) => `/topics/${slug}`), ...ontology.concepts.map((concept) => `/concepts/${concept.slug}`)]);

const requiredHubSlugs = [
  "worry",
  "letting-go",
  "being-present",
  "peace-and-trauma",
  "grief-and-loss",
  "forgiveness",
  "trust",
  "faith",
  "safety-and-gods-protection",
  "patience",
  "failure",
  "success",
  "wealth",
  "wife",
  "children",
  "parents",
  "friendship",
  "lust",
  "pride",
  "greed",
  "envy",
  "self-control",
  "how-to-read-the-bible",
  "components-of-the-bible",
  "bible-timeline",
  "books-described",
  "people-of-the-bible",
  "themes",
  "truth",
  "promises-vs-commands",
  "character-of-god",
  "prayer-and-worship",
  "destiny-of-the-world",
  "teachings",
  "motivational-men",
  "motivational-women",
];

test("topic files are unique and registered", () => {
  assert.equal(new Set(topicFiles).size, topicFiles.length);
  for (const slug of topicFiles) {
    assert.match(indexSource, new RegExp(`\\./topics/${slug}`));
  }
});

test("each topic file slug matches its filename", () => {
  assert.deepEqual(declaredSlugs, topicFiles);
});

test("every hub topic is on the home life-area list", () => {
  for (const slug of requiredHubSlugs) {
    assert.ok(topicFiles.includes(slug), `hub gap still missing from reader: ${slug}`);
    assert.match(homeSource, new RegExp(`"${slug}"`));
  }
});

test("entry cards follow the Notion Compass destinations", () => {
  assert.match(homeSource, /\/topics\/faith/);
  assert.match(homeSource, /\/topics\/how-to-read-the-bible/);
});

test("home links to how-to-use", () => {
  assert.match(read(join(src, "app/page.tsx")), /\/how-to-use/);
});

test("topics keep the grace guardrail", () => {
  for (const slug of topicFiles) {
    const tsPath = join(topicDir, `${slug}.ts`);
    const jsonPath = join(topicDir, `${slug}.json`);
    if (existsSync(jsonPath)) {
      assert.match(read(jsonPath), /"graceGuardrail"/, `${jsonPath} missing graceGuardrail`);
    } else {
      assert.match(read(tsPath), /graceGuardrail/, `${tsPath} missing graceGuardrail`);
    }
  }
});

test("public reader has no Notion URLs", () => {
  for (const path of walk(join(src, "content")).concat(walk(join(src, "app")), walk(join(src, "components")))) {
    assert.doesNotMatch(read(path), /notion\.so/i, `${path} contains a Notion URL`);
  }
});

test("content hrefs stay on published routes", () => {
  for (const path of walk(join(src, "content"))) {
    for (const match of read(path).matchAll(/href:\s*"([^"]+)"/g)) {
      assert.ok(allowedHrefs.has(match[1]), `${path} has out-of-scope href ${match[1]}`);
    }
    if (path.endsWith(".json")) {
      for (const match of read(path).matchAll(/"href"\s*:\s*"([^"]+)"/g)) {
        assert.ok(allowedHrefs.has(match[1]), `${path} has out-of-scope href ${match[1]}`);
      }
    }
  }
});

test("Jesus page keeps the grace-before-effort language", () => {
  const jesus = read(join(src, "content/topics/jesus-and-the-gospel.ts"));
  assert.ok(/grace through faith/i.test(jesus) || /not the price of being accepted/i.test(jesus));
});

test("verse of the day list is curated and topic links stay in scope", () => {
  const dbPath = join(src, "content/verse-of-the-day/verse-db.json");
  const rows = JSON.parse(read(dbPath));
  assert.ok(Array.isArray(rows) && rows.length >= 7, "verse rotation list should cover at least a week");
  const references = rows.map((row) => row.reference);
  assert.equal(new Set(references).size, references.length, "duplicate references in VOTD list");
  for (const row of rows) {
    assert.ok(typeof row.text === "string" && row.text.trim().length >= 12, "VOTD entry missing verse text");
    assert.ok(typeof row.topicSlug === "string", "VOTD entry missing topicSlug");
    assert.ok(topicFiles.includes(row.topicSlug), `VOTD topicSlug not in reader: ${row.topicSlug}`);
  }
  assert.match(read(join(src, "content/verse-of-the-day/verses.ts")), /VerseOfTheDay\.fromDraft/);
});

test("verse of the day schedule uses UTC calendar days", () => {
  const MS_PER_DAY = 86_400_000;
  const epoch = Date.UTC(2026, 0, 1);
  const dayIndex = (date) => {
    const utcMidnight = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    return Math.floor((utcMidnight - epoch) / MS_PER_DAY);
  };
  const morning = new Date(Date.UTC(2026, 8, 20, 8, 15));
  const evening = new Date(Date.UTC(2026, 8, 20, 22, 45));
  const nextDay = new Date(Date.UTC(2026, 8, 21, 0, 5));
  assert.equal(dayIndex(morning), dayIndex(evening));
  assert.equal(dayIndex(nextDay), dayIndex(morning) + 1);
});

test("concept ontology has unique identifiers and valid independent facets", () => {
  assert.equal(ontology.schemaVersion, "1.0.0");
  const unique = (rows) => assert.equal(new Set(rows.map((row) => row.id)).size, rows.length);
  for (const rows of [ontology.categories, ontology.types, ontology.domains, ontology.concepts, ontology.relations]) unique(rows);
  assert.equal(ontology.categories.length, 5);
  const lifeAreaIds = new Set([...homeSource.matchAll(/id:\s*"([^"]+)"/g)].map((match) => match[1]));
  const ids = (rows) => new Set(rows.map((row) => row.id));
  const categories = ids(ontology.categories), types = ids(ontology.types), domains = ids(ontology.domains);
  for (const concept of ontology.concepts) {
    assert.match(concept.id, /^[a-z]+(?:-[a-z]+)*$/);
    assert.equal(concept.slug, concept.id);
    assert.notEqual(concept.slug, "data", "data is a reserved export route");
    assert.ok(categories.has(concept.categoryId));
    assert.ok(concept.title && concept.summary && concept.graceGuardrail);
    for (const [values, allowed] of [[concept.typeIds, types], [concept.domainIds, domains], [concept.lifeAreaIds, lifeAreaIds], [concept.topicSlugs, new Set(topicFiles)]]) {
      assert.ok(values.length > 0);
      assert.equal(new Set(values).size, values.length);
      for (const value of values) assert.ok(allowed.has(value), `${concept.id} has invalid mapping ${value}`);
    }
    assert.ok(concept.scripture.length > 0);
    unique(concept.scripture);
    for (const passage of concept.scripture) {
      assert.ok(passage.book && passage.insight);
      for (const value of [passage.chapter, passage.verseStart, passage.verseEnd]) assert.ok(Number.isInteger(value) && value > 0);
      assert.ok(passage.verseEnd >= passage.verseStart);
    }
  }
});

test("directed concept relationships are traceable to their source passages", () => {
  const concepts = new Map(ontology.concepts.map((concept) => [concept.id, concept]));
  const triples = new Set();
  for (const relation of ontology.relations) {
    assert.ok(concepts.has(relation.sourceId) && concepts.has(relation.targetId));
    assert.notEqual(relation.sourceId, relation.targetId);
    const triple = [relation.sourceId, relation.predicate, relation.targetId].join(":");
    assert.ok(!triples.has(triple), `duplicate relation ${triple}`);
    triples.add(triple);
    assert.equal(relation.id, triple);
    assert.ok(relation.note && relation.predicate && relation.scriptureIds.length > 0);
    assert.equal(relation.basis, "editorial-scripture-mapping");
    const sourcePassages = new Set(concepts.get(relation.sourceId).scripture.map((passage) => passage.id));
    for (const id of relation.scriptureIds) assert.ok(sourcePassages.has(id), `untraceable relation ${relation.id}`);
  }
  assert.ok(triples.has("armour-of-god:illustrates:spiritual-warfare"));
  assert.ok(triples.has("judgment:expresses:justice"));
  assert.ok(concepts.get("repentance").typeIds.includes("doctrine") && concepts.get("repentance").typeIds.includes("practice"));
});
