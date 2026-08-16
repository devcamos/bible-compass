import Link from "next/link";
import type { TopicTone } from "@/content/types";

const toneClass: Record<TopicTone, string> = {
  peace: "bg-peace",
  courage: "bg-courage",
  faith: "bg-faith",
  bible: "bg-bible",
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
      className={`flex min-h-24 flex-col items-start justify-start rounded-2xl p-4 text-left no-underline ${toneClass[tone]}`}
    >
      <strong className="text-base font-medium text-foreground">
        <span aria-hidden="true">{icon}</span> {title}
      </strong>
      <span className="mt-1.5 text-sm leading-6 text-foreground/80">{summary}</span>
    </Link>
  );
}
