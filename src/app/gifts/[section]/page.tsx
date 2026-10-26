import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SavedPageActions } from "@/components/SavedPageActions";
import { GIFTS_FOUNDATIONS, GIFTS_GRACE, getGiftsFoundation } from "@/content/gifts";
import { GiftsRelated, ScriptureContext } from "../GiftsReading";

type Props = Readonly<{ params: Promise<{ section: string }> }>;
export const dynamicParams = false;
export function generateStaticParams() { return GIFTS_FOUNDATIONS.map(({id}) => ({section:id})); }
export async function generateMetadata({params}: Props): Promise<Metadata> {
  const section=getGiftsFoundation((await params).section);
  return section ? {title:`${section.title} — Gifts from God`,description:section.summary,alternates:{canonical:`/gifts/${section.id}`}} : {title:"Gifts from God"};
}
export default async function GiftsFoundationPage({params}: Props) {
  const section=getGiftsFoundation((await params).section);
  if(!section) notFound();
  return <article>
    <Link href="/gifts" className="mb-5 inline-flex min-h-11 items-center text-sm text-link">← Gifts from God</Link>
    <header className="mb-7"><p className="bc-kicker m-0 mb-2">Gifts from God</p><h1 className="bc-title m-0 mb-3 text-3xl leading-tight">{section.title}</h1><p className="m-0 leading-7 text-muted-foreground">{section.summary}</p><SavedPageActions path={`/gifts/${section.id}`} /></header>
    <p className="leading-7">{section.body}</p>
    <ScriptureContext references={section.refs ?? []} />
    <GiftsRelated links={section.related ?? []} />
    <aside className="bc-callout mt-7" aria-label="Grace and service"><p className="m-0 leading-7">{GIFTS_GRACE}</p></aside>
  </article>;
}
