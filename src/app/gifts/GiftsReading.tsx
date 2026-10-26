import Link from "next/link";
import { bsbUrl } from "@/lib/scripture-mapping.mjs";
import { giftReferenceUrl, type GiftReference } from "@/content/gifts";

export function ScriptureLink({ reference }: { reference: GiftReference }) {
  return <a href={giftReferenceUrl(reference)} target="_blank" rel="noopener noreferrer" className="bc-gifts-reference">
    {reference.label}<span className="sr-only"> · BSB on Bible Hub, opens in a new tab</span><span aria-hidden="true"> ↗</span>
  </a>;
}

export function ScriptureContext({ references }: { references: readonly GiftReference[] }) {
  return <section className="mt-7" aria-labelledby="scripture-heading">
    <h2 id="scripture-heading" className="bc-title bc-heading mb-3">Read the Scripture</h2>
    <p className="mb-3 text-sm leading-6 text-muted-foreground">Explanations are original paraphrases; quoted Scripture is BSB. Open these passages on Bible Hub for the wider context.</p>
    <ul className="m-0 list-none space-y-3 p-0">{references.map(ref => <li key={ref.label}>
      <ScriptureLink reference={ref} /><br />
      <a className="bc-gifts-reference" href={bsbUrl(ref.book, ref.chapter)} target="_blank" rel="noopener noreferrer">Read {ref.book} {ref.chapter}<span aria-hidden="true"> ↗</span><span className="sr-only"> · full chapter, opens in a new tab</span></a>
    </li>)}</ul>
  </section>;
}

export function GiftsRelated({ links }: { links: readonly string[][] }) {
  return <section className="mt-7 border-t border-border pt-6" aria-labelledby="explore-heading">
    <h2 id="explore-heading" className="bc-title bc-heading mb-3">Explore further</h2>
    <div className="flex flex-wrap gap-2">{links.map(([slug, title]) => <Link key={slug} href={`/concepts/${slug}`} className="bc-btn bc-btn--quiet">{title} →</Link>)}</div>
  </section>;
}
