const OPEN = "\u201C";
const CLOSE = "\u201D";

/** Use one outer quote pair and single quotes for speech within the passage. */
export function wrapVerseInQuotes(text: string): string {
  let passage = text.trim();
  if (!passage) return passage;

  while (passage.length >= 2) {
    const first = passage[0];
    const last = passage[passage.length - 1];
    const isWrapped =
      (first === OPEN && last === CLOSE) ||
      (first === '"' && last === '"') ||
      (first === "'" && last === "'") ||
      (first === "‘" && last === "’");
    if (!isWrapped) break;
    passage = passage.slice(1, -1).trim();
  }

  const nested = passage
    .replace(/“/g, "‘")
    .replace(/”/g, "’")
    .replace(/"([^"]*)"/g, "‘$1’");
  return nested ? `${OPEN}${nested}${CLOSE}` : nested;
}
