import type { Metadata } from "next";
import Link from "next/link";
import { SavedPagesList } from "@/components/SavedPagesList";

export const metadata: Metadata = { title: "Saved pages", description: "Return to your saved Bible Compass readings on this device.", robots: { index: false, follow: true } };
export default function SavedPagesPage() {
  return <article>
    <Link href="/" className="mb-5 inline-flex min-h-11 items-center text-sm text-link">← Back to the compass</Link>
    <header className="mb-6"><p className="bc-kicker m-0 mb-2">Keep close</p><h1 className="bc-title m-0 mb-3 text-3xl leading-tight">Saved pages</h1><p className="m-0 leading-7 text-muted-foreground">A quiet place for readings you want to return to, on this device.</p></header>
    <SavedPagesList />
  </article>;
}
