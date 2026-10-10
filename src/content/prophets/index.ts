import data from "./books.json";

export type ProphetGroup = "major-prophets" | "minor-prophets";
export type ProphetBook = {
  id: string;
  title: string;
  group: ProphetGroup;
  summary: string;
  takeaway: string;
  themes: string[];
  passage: { book: string; chapter: number; verseStart: number; verseEnd: number };
  sourceUrl: string;
};

export const prophetBooks: readonly ProphetBook[] = data as ProphetBook[];

export function getProphetBooks(group: ProphetGroup) {
  return prophetBooks.filter((book) => book.group === group);
}
