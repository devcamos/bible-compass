import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
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
  const match = read(join(topicDir, `${slug}.ts`)).match(/slug:\s*"([^"]+)"/);
  return match?.[1] ?? "";
});

const allowedHrefs = new Set(["/", "/how-to-use", ...topicFiles.map((slug) => `/topics/${slug}`)]);

const requiredHubSlugs = [
  "trust",
  "faith",
  "safety-and-gods-protection",
  "patience",
  "failure",
  "success",
  "wife",
  "children",
  "parents",
  "how-to-read-the-bible",
  "components-of-the-bible",
  "bible-timeline",
  "books-described",
  "people-of-the-bible",
  "themes",
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
  for (const path of walk(join(src, "content/topics"))) {
    assert.match(read(path), /graceGuardrail/, `${path} missing graceGuardrail`);
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
  }
});

test("Jesus page keeps the grace-before-effort language", () => {
  const jesus = read(join(src, "content/topics/jesus-and-the-gospel.ts"));
  assert.ok(/grace through faith/i.test(jesus) || /not the price of being accepted/i.test(jesus));
});
