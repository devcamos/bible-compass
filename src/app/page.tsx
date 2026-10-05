import Link from "next/link";
import type { Metadata } from "next";
import { PathCard } from "@/components/PathCard";
import { LifeAreaList } from "@/components/LifeAreaList";
import { VerseOfTheDay } from "@/components/VerseOfTheDay";
import { ConceptCategories } from "@/components/ConceptCategories";
import { entryPaths, homeCopy, lifeAreas } from "@/content/home";
import { getVerseOfTheDay } from "@/lib/verse-of-the-day";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/** Revalidate at most once per UTC day so Preview/Production pick up the new verse on schedule. */
export const revalidate = 86_400;

export default function HomePage() {
  const verse = getVerseOfTheDay();

  return (
    <div>
      <VerseOfTheDay verse={verse} />

      <section className="mb-6 rounded-2xl border border-border bg-card p-[22px]">
        <h1 className="bc-title m-0 mb-2 text-[1.85rem] leading-tight sm:text-[2.2rem]">
          {homeCopy.welcomeTitle}
        </h1>
        <p className="m-0 leading-7 text-muted-foreground">{homeCopy.welcomeBody}</p>
      </section>

      <p className="-mt-1 mb-6">
        <Link
          href="/how-to-use"
          className="text-sm font-medium text-link no-underline"
        >
          {homeCopy.howToLabel}
        </Link>
      </p>

      <h2 className="bc-title mb-3 text-[1.35rem]">{homeCopy.carryingTitle}</h2>
      <div className="mb-7 grid gap-3 sm:grid-cols-2">
        {entryPaths.map((path) => (
          <PathCard key={`${path.title}-${path.href}`} {...path} />
        ))}
      </div>

      <section className="mb-7 rounded-2xl border border-border bg-card p-4">
        <strong>
          <span aria-hidden="true">🧭</span> {homeCopy.rhythmTitle}
        </strong>
        <p className="mt-1 mb-0 text-muted-foreground">{homeCopy.rhythmBody}</p>
      </section>

      <h2 className="bc-title mb-2 text-[1.2rem]">{homeCopy.lifeAreaTitle}</h2>
      {lifeAreas.map((area) => (
        <LifeAreaList key={area.title} {...area} />
      ))}
      <ConceptCategories />
    </div>
  );
}
