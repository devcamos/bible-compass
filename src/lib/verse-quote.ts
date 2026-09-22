const OPEN = "\u201C";
const CLOSE = "\u201D";

/** Wrap passage text in curly quotes unless already fully quoted. */
export function wrapVerseInQuotes(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;

  const first = trimmed[0];
  const last = trimmed[trimmed.length - 1];
  if (
    (first === OPEN && last === CLOSE) ||
    (first === '"' && last === '"') ||
    (first === "'" && last === "'")
  ) {
    return trimmed;
  }

  return `${OPEN}${trimmed}${CLOSE}`;
}
