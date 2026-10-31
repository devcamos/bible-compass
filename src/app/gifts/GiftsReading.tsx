import Link from "next/link";
import { ExternalLinkIcon } from "@/app/revelation/ExternalLinkIcon";
import { bsbUrl } from "@/lib/scripture-mapping.mjs";
import { giftReferenceUrl, type GiftReference } from "@/content/gifts";

export function ScriptureLink({ reference }: { reference: GiftReference }) {
  return <a href={giftReferenceUrl(reference)} target="_blank" rel="noopener noreferrer" className="bc-gifts-reference">
    {reference.label}<span className="sr-only"> · BSB on Bible Hub, opens in a new tab</span><ExternalLinkIcon />
  </a>;
}

export function ScriptureContext({ references, quotedReference }: {
  references: readonly GiftReference[];
  quotedReference?: GiftReference;
}) {
  // The quotation already provides its verse and chapter links. Keep wider
  // passage labels, but do not repeat identical citations or chapter actions.
  const referenceKey = (ref: GiftReference) => JSON.stringify([giftReferenceUrl(ref), ref.label]);
  const seenReferences = new Set(quotedReference ? [referenceKey(quotedReference)] : []);
  const seenChapters = new Set(quotedReference ? [bsbUrl(quotedReference.book, quotedReference.chapter)] : []);
  const readings = references.filter(ref => {
    const key = referenceKey(ref);
    if (seenReferences.has(key)) return false;
    seenReferences.add(key);
    return true;
  }).map(reference => {
    const chapterUrl = bsbUrl(reference.book, reference.chapter);
    const showChapter = !seenChapters.has(chapterUrl);
    seenChapters.add(chapterUrl);
    return { reference, chapterUrl, showChapter };
  });
  if (readings.length === 0) return null;

  return <section className="mt-7" aria-labelledby="scripture-heading">
    <h2 id="scripture-heading" className="bc-title bc-heading mb-3">Read the Scripture</h2>
    <p className="mb-3 text-sm leading-6 text-muted-foreground">Explanations are original paraphrases; quoted Scripture is BSB. Open these passages on Bible Hub for the wider context.</p>
    <ul className="m-0 list-none space-y-3 p-0">{readings.map(({ reference, chapterUrl, showChapter }) => <li key={referenceKey(reference)}>
      <ScriptureLink reference={reference} />
      {showChapter ? <><br />
        <a className="bc-gifts-reference" href={chapterUrl} target="_blank" rel="noopener noreferrer">Read {reference.book} {reference.chapter}<ExternalLinkIcon /><span className="sr-only"> · full chapter, opens in a new tab</span></a>
      </> : null}
    </li>)}</ul>
  </section>;
}

export function GiftsRelated({ links }: { links: readonly string[][] }) {
  return <section className="mt-7 border-t border-border pt-6" aria-labelledby="explore-heading">
    <h2 id="explore-heading" className="bc-title bc-heading mb-3">Explore further</h2>
    <div className="flex flex-wrap gap-2">{links.map(([slug, title]) => <Link key={slug} href={`/concepts/${slug}`} className="bc-btn bc-btn--quiet">{title} →</Link>)}</div>
  </section>;
}
