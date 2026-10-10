/** @typedef {{ id: string, verseStart: number, verseEnd: number }} SourcePassage */
/** @typedef {{ passageId: string, verseStart: number, verseEnd: number }} ScriptureReference */
/** @typedef {{ book: string, chapter: number, verseStart: number, verseEnd: number }} CanonicalPassage */

/** @param {CanonicalPassage} passage */
export function scriptureReference(passage) {
  const end = passage.verseEnd === passage.verseStart ? "" : `-${passage.verseEnd}`;
  return `${passage.book} ${passage.chapter}:${passage.verseStart}${end}`;
}

/** @param {CanonicalPassage} passage */
export function scriptureUrl(passage) {
  return `https://www.biblegateway.com/passage/?search=${encodeURIComponent(scriptureReference(passage))}&version=NIV`;
}

/**
 * Resolve curated action references without expanding them to their context range.
 * @template {SourcePassage} T
 * @param {readonly T[]} passages
 * @param {readonly ScriptureReference[]} references
 * @returns {T[]}
 */
export function resolveScriptureReferences(passages, references) {
  if (!Array.isArray(references) || references.length === 0) {
    throw new Error("An action must have specific Scripture references.");
  }
  const sources = new Map(passages.map((passage) => [passage.id, passage]));
  const seen = new Set();
  return references.map((reference) => {
    const source = sources.get(reference.passageId);
    if (!source) throw new Error(`Unknown Scripture passage: ${reference.passageId}`);
    const { verseStart, verseEnd } = reference;
    if (!Number.isInteger(verseStart) || !Number.isInteger(verseEnd) ||
        verseStart < source.verseStart || verseEnd > source.verseEnd || verseEnd < verseStart) {
      throw new Error(`Invalid Scripture range: ${reference.passageId} ${verseStart}-${verseEnd}`);
    }
    const key = `${reference.passageId}:${verseStart}:${verseEnd}`;
    if (seen.has(key)) throw new Error(`Duplicate Scripture reference: ${key}`);
    seen.add(key);
    return { ...source, verseStart, verseEnd };
  });
}
