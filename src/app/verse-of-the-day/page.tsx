import { redirect } from "next/navigation";
import { parseVerseDate } from "@/lib/verse-of-the-day";

export default async function DailyVersePage({ searchParams }: PageProps<"/verse-of-the-day">) {
  const { date } = await searchParams;
  const selected = parseVerseDate(date);
  redirect(`/${selected ? `?verse=${selected.toISOString().slice(0, 10)}` : ""}#verse-of-the-day-heading`);
}
