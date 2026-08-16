import Link from "next/link";
import type { Topic } from "@/content/types";

type TopicViewProps = {
  topic: Topic;
};

export function TopicView({ topic }: TopicViewProps) {
  return (
    <article>
      <p className="mb-5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="text-foreground no-underline">
          <span aria-hidden="true">📖</span> Bible Compass
        </Link>
        <span aria-hidden="true">/</span>
        <span>{topic.title}</span>
      </p>

      <header className="mb-5">
        <h1 className="bc-title m-0 mb-2 text-[1.85rem] leading-tight sm:text-[2.15rem]">
          <span aria-hidden="true">{topic.icon}</span> {topic.title}
        </h1>
        <p className="m-0 text-[1.02rem] leading-7 text-muted-foreground">{topic.summary}</p>
      </header>

      <section className="mb-5 rounded-2xl bg-grace p-5" aria-label="Theological guardrail">
        <p className="m-0 text-[0.98rem] leading-7">{topic.graceGuardrail}</p>
      </section>

      {topic.kind === "reset" && topic.stateChange && topic.resetName ? (
        <section className="mb-5 rounded-2xl border border-border bg-card p-[18px]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <strong>
              {topic.stateChange.from} → {topic.stateChange.to}
            </strong>
            <span className="tracking-[0.08em] text-[1.05rem] font-medium">
              {topic.resetName}
            </span>
          </div>
          {topic.framing ? (
            <p className="mb-0 mt-3 text-muted-foreground">{topic.framing}</p>
          ) : null}
        </section>
      ) : null}

      {topic.kind === "foundation" && topic.framing ? (
        <section className="mb-5 rounded-2xl border border-border bg-card p-[18px]">
          <strong>Start with grace, not performance.</strong>
          <p className="mb-0 mt-2 text-muted-foreground">{topic.framing}</p>
        </section>
      ) : null}

      {topic.why ? (
        <p className="mb-6 leading-7 text-muted-foreground">{topic.why}</p>
      ) : null}

      {topic.kind === "reset" && topic.steps ? (
        <section aria-labelledby="reset-heading">
          <h2 id="reset-heading" className="bc-title mb-3 text-xl">
            The {topic.resetName} reset
          </h2>
          {topic.steps.map((step, index) => (
            <details
              key={step.letter}
              className="border-b border-border py-3"
              open={index === 0}
            >
              <summary className="cursor-pointer py-1.5 font-medium">
                <span className="summary-label">
                  {step.letter} — {step.title}
                </span>
              </summary>
              <div className="pt-3 pb-1">
                <strong className="mb-1.5 block">{step.verse}</strong>
                <p className="m-0 leading-7 text-muted-foreground">{step.explanation}</p>
                {step.action ? (
                  <p className="mt-2 mb-0 rounded-full bg-peace/70 px-3 py-2 text-sm">
                    <span className="font-medium">60-second action</span>
                    <span className="text-muted-foreground"> — {step.action}</span>
                  </p>
                ) : null}
              </div>
            </details>
          ))}
        </section>
      ) : null}

      {topic.sections?.map((section) => (
        <section key={section.heading} className="mt-7">
          <h2 className="bc-title mb-3 text-xl">{section.heading}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph} className="mb-3 leading-7">
              {paragraph}
            </p>
          ))}
          {section.bullets ? (
            <ul className="my-0 pl-6">
              {section.bullets.map((bullet) => (
                <li key={bullet} className="py-1.5 leading-7">
                  {bullet}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}

      {topic.whenToUse?.length ? (
        <section className="mt-7">
          <h2 className="bc-title mb-3 text-xl">When to use this</h2>
          <ul className="my-0 pl-6">
            {topic.whenToUse.map((item) => (
              <li key={item} className="py-1.5 leading-7">
                {item}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {topic.sixtySecond?.length ? (
        <section className="mt-7 rounded-2xl border border-border bg-card p-5">
          <h2 className="bc-title mt-0 mb-3 text-xl">60-second reset</h2>
          <ol className="my-0 pl-5">
            {topic.sixtySecond.map((item) => (
              <li key={item} className="py-1.5 leading-7">
                {item}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {topic.prayer ? (
        <section className="mt-7">
          <h2 className="bc-title mb-3 text-xl">A short prayer</h2>
          <p className="m-0 leading-7 whitespace-pre-wrap">{topic.prayer}</p>
        </section>
      ) : null}

      {topic.scripture?.length ? (
        <section className="mt-7">
          <h2 className="bc-title mb-3 text-xl">Scripture in context</h2>
          <ul className="my-0 pl-6">
            {topic.scripture.map((item) => (
              <li key={item.ref} className="py-1.5 leading-7">
                <strong>{item.ref}</strong> — {item.insight}
              </li>
            ))}
          </ul>
          <p className="mt-3 mb-0 text-sm text-muted-foreground">
            Read the surrounding chapter in your preferred translation. Bible Compass cites
            Scripture; it does not replace it.
          </p>
        </section>
      ) : null}

      {topic.safetyNote ? (
        <aside className="mt-7 rounded-2xl bg-bible p-4 text-sm leading-6">
          {topic.safetyNote}
        </aside>
      ) : null}

      <nav className="mt-8" aria-label="Read next">
        <h2 className="bc-title mb-3 text-xl">Read next</h2>
        <div className="flex flex-wrap gap-2.5">
          {topic.readNext.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex min-h-11 items-center rounded-full border border-border bg-card px-4 text-sm font-medium text-foreground no-underline"
            >
              {item.title}
            </Link>
          ))}
          <Link
            href="/"
            className="inline-flex min-h-11 items-center rounded-full bg-foreground px-4 text-sm font-medium text-background no-underline"
          >
            Back to Compass
          </Link>
        </div>
      </nav>
    </article>
  );
}
