import type { Metadata } from "next";
import Link from "next/link";
import { SavedPageActions } from "@/components/SavedPageActions";
import { GIFTS, GIFTS_FOR_SERVING, GIFTS_MINISTRY_ROLES, GIFTS_PURPOSE, GIFTS_SELECTION_NOTE, giftUrl } from "@/content/gifts";
import { PassageReturnFocus } from "@/app/revelation/PassageReturnFocus";
import { ScriptureLink } from "../GiftsReading";

export const metadata: Metadata = {
  title:"Gifts for serving", description:"Plain meanings and linked Scripture for spiritual gifts, with the Ephesians ministry roles shown separately.",
  alternates:{ canonical:"/gifts/spiritual-gifts" },
};

export default function SpiritualGiftsPage() {
  return <article>
    <PassageReturnFocus passageIds={GIFTS.map(({ id }) => `gift-${id}`)} />
    <Link href="/gifts" className="mb-5 inline-flex min-h-11 items-center text-sm text-link">← Gifts from God</Link>
    <header className="mb-6">
      <p className="bc-kicker m-0 mb-2">Spiritual gifts</p>
      <h1 className="bc-title m-0 mb-3 text-3xl leading-tight">Gifts for serving</h1>
      <p className="m-0 leading-7 text-muted-foreground">{GIFTS_PURPOSE}</p>
      <div className="mt-2 flex flex-wrap gap-x-4"><ScriptureLink reference={{book:"1 Corinthians",chapter:12,verse:7,label:"1 Corinthians 12:7"}} /><ScriptureLink reference={{book:"1 Corinthians",chapter:13,verse:1,label:"1 Corinthians 13:1–3"}} /></div>
      <SavedPageActions path="/gifts/spiritual-gifts" />
    </header>
    <table className="bc-gifts-table" role="table">
      <caption className="sr-only">Gifts, their plain meanings and main Scripture passages</caption>
      <thead role="rowgroup"><tr role="row"><th scope="col" role="columnheader">Gift</th><th scope="col" role="columnheader">What it means</th><th scope="col" role="columnheader">Scripture</th></tr></thead>
      <tbody role="rowgroup">{GIFTS_FOR_SERVING.map(gift => <tr key={gift.id} role="row" data-gift={gift.id}>
        <th scope="row" role="rowheader"><Link id={`gift-${gift.id}`} href={giftUrl(gift.id)} className="inline-flex min-h-11 scroll-mt-6 items-center text-link underline underline-offset-4">{gift.title}</Link></th>
        <td role="cell"><p>{gift.meaning}</p></td>
        <td role="cell"><span className="bc-gifts-cell-label" aria-hidden="true">Scripture</span>{gift.overviewRefs.map(ref => <div key={ref.label}><ScriptureLink reference={ref} /></div>)}</td>
      </tr>)}</tbody>
    </table>
    <section className="mt-8" aria-labelledby="roles-heading">
      <h2 id="roles-heading" className="bc-title bc-heading mb-3">People who equip the church</h2>
      <p className="m-0 leading-7 text-muted-foreground">Ephesians names people given to equip the church for service and maturity.</p>
      <ScriptureLink reference={{book:"Ephesians",chapter:4,verse:11,label:"Ephesians 4:11–13"}} />
      <ul className="mt-3 list-disc space-y-4 pl-5">{GIFTS_MINISTRY_ROLES.map(gift => <li key={gift.id} data-role={gift.id} className="leading-7">
        <Link id={`gift-${gift.id}`} href={giftUrl(gift.id)} className="inline-flex min-h-11 scroll-mt-6 items-center font-medium text-link underline underline-offset-4">{gift.title}</Link>: {gift.meaning}
      </li>)}</ul>
    </section>
    <p className="mt-7 border-t border-border pt-6 leading-7 text-muted-foreground">{GIFTS_SELECTION_NOTE}</p>
  </article>;
}
