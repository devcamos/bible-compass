import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { howToUse } from "@/content/how-to-use";

export const metadata: Metadata = {
  title: "How to use",
  description:
    "A simple way to meet Scripture with honesty, context, and one faithful response.",
  alternates: { canonical: "/how-to-use" },
};

export default function HowToUsePage() {
  return (
    <article>
      <Breadcrumb current="How to use" />
      <header className="mb-5">
        <p className="bc-kicker mb-2">Guide</p>
        <h1 className="bc-title m-0 mb-2 text-[1.85rem] leading-tight sm:text-[2.15rem]">
          <span aria-hidden="true">🧭</span> {howToUse.title}
        </h1>
        <p className="m-0 text-[1.02rem] leading-7 text-muted-foreground">
          {howToUse.summary}
        </p>
      </header>

      <section className="bc-callout">
        <strong>{howToUse.graceTitle}</strong>
        <p className="mt-2 mb-0 text-muted-foreground">{howToUse.graceBody}</p>
      </section>

      <ol className="my-0 pl-6">
        {howToUse.steps.map((step) => (
          <li key={step.title} className="py-2 leading-7">
            <strong>{step.title}</strong>
            <span className="text-muted-foreground"> {step.body}</span>
            {step.href ? (
              <>
                {" "}
                <Link href={step.href} className="font-medium text-link">
                  {step.linkLabel}
                </Link>
              </>
            ) : null}
          </li>
        ))}
      </ol>

      <p className="mt-6 leading-7">{howToUse.closing}</p>

      <div className="mt-8 flex flex-wrap gap-2.5">
        <Link
          href="/"
          className="bc-btn"
        >
          Explore the Compass
        </Link>
        <Link
          href="/topics/loneliness"
          className="inline-flex min-h-11 items-center rounded-full border border-border bg-card px-4 text-sm font-medium text-foreground no-underline"
        >
          See a topic page
        </Link>
      </div>
    </article>
  );
}
