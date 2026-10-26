import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLinkIcon } from "@/app/revelation/ExternalLinkIcon";
import { SavedPageActions } from "@/components/SavedPageActions";
import { GIFTS, getGift, giftUrl, giftReferenceUrl, giftChapterUrl } from "@/content/gifts";
import { GiftsRelated, ScriptureContext, ScriptureLink } from "../../GiftsReading";

type Props = Readonly<{ params: Promise<{ gift: string }> }>;
export const dynamicParams = false;
export function generateStaticParams() { return GIFTS.map(({ id }) => ({ gift:id })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const gift=getGift((await params).gift);
  return gift ? { title:`${gift.title} — Gifts from God`, description:gift.meaning, alternates:{canonical:giftUrl(gift.id)} } : {title:"Gift"};
}

export default async function GiftPage({ params }: Props) {
  const gift=getGift((await params).gift);
  if(!gift) notFound();
  const quote=gift.namingScripture;
  const start=quote.text.indexOf(quote.highlight);
  return <article>
    <Link href={`/gifts/spiritual-gifts#gift-${gift.id}`} className="mb-5 inline-flex min-h-11 items-center text-sm text-link">← All gifts for serving</Link>
    <header className="mb-7">
      <p className="bc-kicker m-0 mb-2">{gift.kind==="role" ? "People who equip the church" : "Gifts for serving"}</p>
      <h1 className="bc-title m-0 mb-3 text-3xl leading-tight">{gift.title}</h1>
      <p className="m-0 leading-7 text-muted-foreground">{gift.summary}</p>
      <SavedPageActions path={giftUrl(gift.id)} />
    </header>
    <section className="bc-gifts-quote" aria-labelledby="quotation-heading" data-naming-scripture>
      <h2 id="quotation-heading" className="bc-gifts-quote-label">Scripture · BSB</h2>
      <blockquote cite={giftReferenceUrl(quote.ref)}><p>{quote.text.slice(0,start)}<mark><strong>{quote.highlight}</strong></mark>{quote.text.slice(start+quote.highlight.length)}</p></blockquote>
      <div className="flex flex-wrap gap-x-4">
        <a href={giftReferenceUrl(quote.ref)} target="_blank" rel="noopener noreferrer" className="bc-gifts-reference">{quote.ref.label} · BSB<ExternalLinkIcon /><span className="sr-only">, opens in a new tab</span></a>
        <a href={giftChapterUrl(quote.ref)} target="_blank" rel="noopener noreferrer" className="bc-gifts-reference">Read {quote.ref.book} {quote.ref.chapter}<ExternalLinkIcon /><span className="sr-only"> · full chapter, opens in a new tab</span></a>
      </div>
    </section>
    <section aria-labelledby="meaning-heading"><h2 id="meaning-heading" className="bc-title bc-heading mb-3">What it means</h2><p className="m-0 leading-7">{gift.meaning}</p></section>
    <ScriptureContext references={gift.refs} />
    <section className="mt-7" aria-labelledby="context-heading"><h2 id="context-heading" className="bc-title bc-heading mb-3">Read in context</h2><p className="m-0 leading-7 text-muted-foreground">{gift.context}</p></section>
    <section className="mt-7" aria-labelledby="everyday-heading">
      <h2 id="everyday-heading" className="bc-title bc-heading mb-3">In everyday life</h2>
      <p className="m-0 leading-7 text-muted-foreground">{gift.example}</p>
      {gift.everydayInsights ? <>
        <p className="mt-4 mb-2 leading-7 text-muted-foreground">{gift.everydayInsights.introduction}</p>
        <div className="flex flex-wrap gap-x-4">{gift.everydayInsights.references.map(reference => <ScriptureLink key={reference.label} reference={reference} />)}</div>
        {gift.everydayInsights.contexts.map(context => <section key={context.id} data-everyday-context={context.id} className="mt-6 border-t border-border pt-5" aria-labelledby={`everyday-${context.id}-heading`}>
          <h3 id={`everyday-${context.id}-heading`} className="bc-title mb-3 text-xl leading-snug">{context.title}</h3>
          <p className="m-0 mb-3 leading-7">{context.situation}</p>
          <p className="m-0 mb-3 leading-7 text-muted-foreground"><strong className="font-medium text-foreground">What to notice. </strong>{context.insight}</p>
          <p className="m-0 mb-2 leading-7 text-muted-foreground"><strong className="font-medium text-foreground">How to respond. </strong>{context.response}</p>
          <div className="flex flex-wrap gap-x-4">{context.references.map(reference => <ScriptureLink key={reference.label} reference={reference} />)}</div>
        </section>)}
        <p className="mt-6 mb-0 leading-7 text-muted-foreground">{gift.everydayInsights.closing}</p>
      </> : null}
    </section>
    <aside className="mt-7 rounded-2xl border border-border bg-card p-5" aria-labelledby="reflection-heading">
      <h2 id="reflection-heading" className="bc-title bc-heading mb-3">Reflect</h2>
      <p className="leading-7">{gift.step}</p>
      {gift.everydayInsights ? <ul className="mb-4 list-disc space-y-3 pl-5 leading-7">{gift.everydayInsights.questions.map(question => <li key={question}>{question}</li>)}</ul> : null}
      <p className="m-0 text-sm leading-6 text-muted-foreground">An illustration, not a test that identifies your gift or appoints you to a ministry role. Read, pray and reflect with trusted Christian community.</p>
    </aside>
    <GiftsRelated links={gift.related} />
  </article>;
}
