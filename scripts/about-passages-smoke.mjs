import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PROVERBS_CATEGORIES, PROVERBS_SELECTION_NOTE } from "../src/content/proverbs.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ontology = JSON.parse(readFileSync(join(root, "src/content/concepts/ontology.json"), "utf8"));

const origin = process.env.READER_BASE_URL ?? "http://127.0.0.1:3003";

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function fetchHtml(path) {
  const response = await fetch(`${origin}${path}`);
  assert.equal(response.status, 200, `${path} returned ${response.status}`);
  return response.text();
}

function assertClosedAboutPassages(html, title, note) {
  const block = html.match(/<details\b[^>]*data-about-passages[^>]*>[\s\S]*?<\/details>/);
  assert.ok(block, `missing AboutPassages disclosure for "${title}"`);
  assert.doesNotMatch(block[0], /\bopen(=|\s|>)/, `"${title}" disclosure must start closed`);
  assert.match(block[0], new RegExp(escapeRegExp(title)));
  assert.ok(block[0].includes(note), `"${title}" missing full note text`);
  // Prominent copper callout for the note must not remain on the page.
  assert.doesNotMatch(
    html,
    new RegExp(`border-copper[^>]*>\\s*${escapeRegExp(note.slice(0, 40))}`),
  );
}

for (const category of PROVERBS_CATEGORIES) {
  const html = await fetchHtml(`/proverbs/${category.slug}`);
  assertClosedAboutPassages(html, "About these passages", PROVERBS_SELECTION_NOTE);
  assert.match(html, /data-scripture-credit/);
  assert.match(html, /NIV on Bible Gateway/);
}

const conceptsHtml = await fetchHtml("/concepts");
assertClosedAboutPassages(conceptsHtml, "About these classifications", ontology.classificationNote);

console.log(
  `Verified AboutPassages help toggle on ${PROVERBS_CATEGORIES.length} Proverbs categories and Concepts.`,
);
