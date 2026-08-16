import Link from "next/link";
import { requireTopic } from "@/content";

type LifeAreaListProps = {
  icon: string;
  title: string;
  summary: string;
  topicSlugs: string[];
  defaultOpen?: boolean;
};

export function LifeAreaList({
  icon,
  title,
  summary,
  topicSlugs,
  defaultOpen,
}: LifeAreaListProps) {
  return (
    <details
      className="border-b border-border py-3"
      open={defaultOpen}
    >
      <summary className="cursor-pointer py-2 text-[1.02rem] font-medium">
        <span className="summary-label">
          <span aria-hidden="true">{icon}</span> {title}
        </span>
      </summary>
      <p className="m-0 pb-2 text-sm text-muted-foreground">{summary}</p>
      <div className="flex flex-wrap gap-2 py-3">
        {topicSlugs.map((slug) => {
          const topic = requireTopic(slug);
          return (
            <Link
              key={slug}
              href={`/topics/${slug}`}
              className="inline-flex min-h-11 items-center rounded-full border border-border bg-card px-3.5 text-sm font-medium text-foreground no-underline"
            >
              {topic.title}
            </Link>
          );
        })}
      </div>
    </details>
  );
}
