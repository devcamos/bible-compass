import Link from "next/link";
import type { VerseOfTheDayEntry } from "@/content/verse-of-the-day/types";

type VerseOfTheDayProps = {
  verse: VerseOfTheDayEntry;
};

export function VerseOfTheDay({ verse }: VerseOfTheDayProps) {
  return (
    <section className="bc-votd mb-6" aria-labelledby="verse-of-the-day-heading">
      <p className="bc-kicker m-0 mb-1" id="verse-of-the-day-heading">
        Verse of the day
      </p>
      <p className="m-0 mb-3 text-sm font-medium text-foreground">
        {verse.reference}{" "}
        <span className="text-muted-foreground">{verse.translation}</span>
      </p>
      <blockquote className="bc-votd__quote m-0">
        <p className="bc-title m-0 text-[1.35rem] leading-snug sm:text-[1.5rem]">
          {verse.text}
        </p>
      </blockquote>
      {verse.topicSlug ? (
        <p className="mb-0 mt-4">
          <Link
            href={`/topics/${verse.topicSlug}`}
            className="text-sm font-medium text-link no-underline"
          >
            Explore this path in Bible Compass
          </Link>
        </p>
      ) : null}
    </section>
  );
}
