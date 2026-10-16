import Link from "next/link";
import type { Metadata } from "next";
import { VerseOfTheDay } from "@/components/VerseOfTheDay";
import { getVerseOfTheDay } from "@/lib/verse-of-the-day";

export const metadata: Metadata = {
  title: "Verse of the day", alternates: { canonical: "/verse-of-the-day" },
};

export default async function DailyVersePage({ searchParams }: PageProps<"/verse-of-the-day">) {
  const { date } = await searchParams;
  const requested = typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T00:00:00Z`) : null;
  const selected = requested && Number.isFinite(requested.getTime()) && requested.toISOString().slice(0, 10) === date ? requested : new Date();
  return (
    <div className="mb-7">
      <h1 className="bc-title bc-heading">A moment in Scripture</h1>
      <p className="text-sm text-muted-foreground">Daily reading · {selected.toISOString().slice(0, 10)}</p>
      <VerseOfTheDay verse={getVerseOfTheDay(selected)} />
      <p className="text-muted-foreground">To receive a verse each day, open Your Profile and turn on Daily verse reminder.</p>
      <p className="text-muted-foreground">Grace is a gift, never something earned by keeping a daily streak.</p>
      <Link href="/" className="bc-btn bc-btn--quiet">Back to the compass</Link>
    </div>
  );
}
