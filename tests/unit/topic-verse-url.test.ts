import { expect, it } from "vitest";
import { topicVerseUrl } from "@/lib/topic-verse-url";
import type { Topic } from "@/content/types";

it("resolves every authored reset reference", async () => {
  const modules = import.meta.glob<{ [key: string]: Topic }>("../../src/content/topics/*.ts");
  let count = 0;
  for (const load of Object.values(modules)) {
    for (const topic of Object.values(await load())) {
      for (const step of topic.steps ?? []) {
        for (const reference of step.verse.split("; ")) {
          expect(topicVerseUrl(reference), reference).toMatch(/^https:\/\/biblehub.com\/bsb\/[a-z_0-9]+\/\d+\.htm#\d+$/);
        }
        count++;
      }
    }
  }
  expect(count).toBeGreaterThan(50);
});

it("preserves ranges and numbered or multiword book paths", () => {
  expect(topicVerseUrl(" 1 John 4:18 ")).toBe("https://biblehub.com/bsb/1_john/4.htm#18");
  expect(topicVerseUrl("Song of Songs 2:1-3")).toBe("https://biblehub.com/bsb/songs/2.htm#1");
});

it.each(["", "Not a reference", "Isaiah 0:10", "https://example.com", "Isaiah 41:10 extra"])("does not construct a link for unsupported text: %s", (text) => {
  expect(topicVerseUrl(text)).toBeNull();
});
