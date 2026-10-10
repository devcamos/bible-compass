import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { scriptureReference, scriptureUrl } from "../src/lib/scripture-mapping.mjs";

const books = JSON.parse(await readFile(new URL("../src/content/prophets/books.json", import.meta.url), "utf8"));
const origin = process.env.READER_BASE_URL ?? "http://127.0.0.1:3003";
const response = await fetch(`${origin}/topics/components-of-the-bible`);
assert.equal(response.status, 200);
const html = await response.text();
const stripComments = (text) => text.replace(/<!--.*?-->/gs, "");
const triggers = [...html.matchAll(/<button\b[^>]*aria-haspopup="dialog"[^>]*>(.*?)<\/button>/gs)].map((match) => stripComments(match[1]));
assert.deepEqual(triggers, books.map((book) => book.title));
const dialogs = [...html.matchAll(/<dialog\b[^>]*aria-labelledby="([^"]+)"[^>]*>(.*?)<\/dialog>/gs)];
assert.equal(dialogs.length, 2);
assert.notEqual(dialogs[0][1], dialogs[1][1]);
for (const [, titleId, content] of dialogs) {
  assert.ok(content.includes(`id="${titleId}"`));
  assert.match(content, />Close<\/button>/);
}
const fallback = [...html.matchAll(/<noscript>(.*?)<\/noscript>/gs)].map((match) => stripComments(match[1])).join("");
assert.equal([...fallback.matchAll(/<details\b/g)].length, books.length);
const escapeHtml = (text) => text.replaceAll("&", "&amp;").replaceAll("'", "&#x27;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
for (const book of books) {
  assert.ok(fallback.includes(escapeHtml(book.summary)), `${book.title} missing static summary`);
  assert.ok(fallback.includes(escapeHtml(book.takeaway)), `${book.title} missing takeaway`);
  assert.ok(fallback.includes(`href="${escapeHtml(scriptureUrl(book.passage))}"`), `${book.title} has incorrect Scripture link`);
  assert.ok(fallback.includes(`Read ${escapeHtml(scriptureReference(book.passage))} (NIV)`));
  assert.ok(fallback.includes(`href="${book.sourceUrl}"`));
}
console.log(`Verified modal triggers and static summaries for all ${books.length} prophetic books.`);
