import Link from "next/link";
import type { TopicTone } from "@/content/types";

const toneBar: Record<TopicTone, string> = {
  peace: "border-l-moss",
  courage: "border-l-gold",
  faith: "border-l-sage",
  bible: "border-l-copper",
};

type PathCardProps = {
  href: string;
  icon: string;
  title: string;
  summary: string;
  tone: TopicTone;
};

export function PathCard({ href, icon, title, summary, tone }: PathCardProps) {
  return (
    <Link
      href={href}
      className={`flex min-h-24 flex-col items-start justify-start rounded-2xl border-l-4 bg-card p-4 text-left no-underline ${toneBar[tone]}`}
    >
      <strong className="text-base font-medium text-foreground">
        <span aria-hidden="true">{icon}</span> {title}
      </strong>
      <span className="mt-1.5 text-sm leading-6 text-foreground/80">{summary}</span>
    </Link>
  );
}
