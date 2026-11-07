import { bsbUrl } from "@/lib/scripture-mapping.mjs";

/** Topic reset references are single-chapter verses or ranges; link the first verse. */
export function topicVerseUrl(reference: string): string | null {
  const match = /^((?:[1-3] )?[A-Za-z]+(?: [A-Za-z]+)*) ([1-9]\d*):([1-9]\d*)(?:[–-][1-9]\d*)?(?:, [1-9]\d*(?:[–-][1-9]\d*)?)*$/.exec(reference.trim());
  if (!match) return null;
  return bsbUrl(match[1], Number(match[2]), Number(match[3]));
}
