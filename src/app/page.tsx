import Link from "next/link";
import type { Metadata } from "next";
import { PathCard } from "@/components/PathCard";
import { LifeAreaList } from "@/components/LifeAreaList";
import { entryPaths, homeCopy, lifeAreas } from "@/content/home";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <div>
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

      <section
        className="mb-6 rounded-2xl bg-grace p-5"
        aria-labelledby="foundation-heading"
      >
        <h2 id="foundation-heading" className="bc-title m-0 mb-2 text-lg">
          {homeCopy.foundationTitle}
        </h2>
        <p className="m-0 mb-3 leading-7 text-muted-foreground">{homeCopy.foundationBody}</p>
        <Link
          href="/topics/jesus-and-the-gospel"
          className="inline-flex min-h-11 items-center rounded-full bg-foreground px-4 text-sm font-medium text-background no-underline"
        >
          Jesus and the Gospel
        </Link>
      </section>

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
    </div>
  );
}
