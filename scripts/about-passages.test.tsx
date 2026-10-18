import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { AboutPassages } from "../src/components/AboutPassages";
import { ScriptureCredit } from "../src/components/ScriptureCredit";
import {
  PROVERBS_SCRIPTURE_CREDIT_NOTE,
  PROVERBS_SELECTION_NOTE,
} from "../src/content/proverbs";

test("AboutPassages is a closed native disclosure with accessible summary label", () => {
  const html = renderToStaticMarkup(
    <AboutPassages>{PROVERBS_SELECTION_NOTE}</AboutPassages>,
  );

  assert.match(html, /<details\b[^>]*data-about-passages/);
  assert.doesNotMatch(html, /\bopen(=|\s|>)/);
  assert.match(html, /<summary\b/);
  assert.match(html, /About these passages/);
  assert.ok(html.includes(PROVERBS_SELECTION_NOTE));
  assert.match(html, /data-about-passages-body/);
});

test("AboutPassages accepts a custom title for non-passage catalogue notes", () => {
  const note = "Categories organise browsing.";
  const html = renderToStaticMarkup(
    <AboutPassages title="About these classifications">{note}</AboutPassages>,
  );

  assert.match(html, /About these classifications/);
  assert.ok(html.includes(note));
  assert.doesNotMatch(html, /About these passages/);
});

test("ScriptureCredit keeps a minimal always-visible NIV / Bible Gateway attribution", () => {
  const html = renderToStaticMarkup(
    <ScriptureCredit note={PROVERBS_SCRIPTURE_CREDIT_NOTE} />,
  );

  assert.match(html, /data-scripture-credit/);
  assert.match(html, /NIV on Bible Gateway/);
  assert.ok(html.includes(PROVERBS_SCRIPTURE_CREDIT_NOTE));
});

test("Proverbs selection note text stays intact for the help disclosure", () => {
  assert.equal(
    PROVERBS_SELECTION_NOTE,
    "A curated selection of passages, not a complete catalogue of Proverbs. Chapters contain several themes; these selections highlight the chosen category. All summaries are original paraphrases. Read the linked NIV passage on Bible Gateway for the Scripture text.",
  );
});
