/** Capitalise the opening letter for display without changing source wording. */
export function capitaliseQuotation(text: string): string {
  return text.replace(/\p{L}/u, (letter) => letter.toUpperCase());
}
