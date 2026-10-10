import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolveScriptureReferences } from "../src/lib/scripture-mapping.mjs";

const ontology = JSON.parse(readFileSync(new URL("../src/content/concepts/ontology.json", import.meta.url), "utf8"));
const origin = process.env.READER_BASE_URL ?? "http://127.0.0.1:3003";
let actionCount = 0;

for (const concept of ontology.concepts) {
  const response = await fetch(`${origin}/concepts/${concept.slug}`);
  assert.equal(response.status, 200, concept.slug);
  const html = await response.text();
  const section = html.match(/<section\b[^>]*aria-labelledby="living-heading"[^>]*>([\s\S]*?)<\/section>/)?.[1];
  assert.ok(section, `${concept.id} missing living guidance`);
  const items = [...section.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)].map((match) => match[1]);
  assert.equal(items.length, concept.livingGuidance.length, concept.id);

  for (const [index, action] of concept.livingGuidance.entries()) {
    const sources = concept.scripture.filter((passage) => action.scriptureIds.includes(passage.id));
    const expected = resolveScriptureReferences(sources, action.scriptureReferences);
    const links = [...items[index].matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)];
    assert.equal(links.length, expected.length, action.id);
    for (const [linkIndex, passage] of expected.entries()) {
      const end = passage.verseEnd === passage.verseStart ? "" : `-${passage.verseEnd}`;
      const reference = `${passage.book} ${passage.chapter}:${passage.verseStart}${end}`;
      const url = new URL(links[linkIndex][1].replaceAll("&amp;", "&"));
      assert.equal(url.origin, "https://www.biblegateway.com", action.id);
      assert.equal(url.pathname, "/passage/", action.id);
      assert.equal(url.searchParams.get("search"), reference, action.id);
      assert.equal(url.searchParams.get("version"), "NIV", action.id);
      assert.equal(links[linkIndex][2].replace(/<[^>]*>/g, ""), reference, action.id);
    }
    actionCount += 1;
  }
}

console.log(`Verified specific verse links for ${actionCount} actions across ${ontology.concepts.length} concepts.`);
