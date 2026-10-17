import Link from "next/link";
import { EmojiIcon } from "@/components/EmojiIcon";
import { requireTopic } from "@/content";
import type { LifeArea } from "@/content/home";

type LifeAreaListProps = {
  icon: string;
  title: string;
  summary: string;
  topicSlugs: string[];
  links?: NonNullable<LifeArea["links"]>;
  defaultOpen?: boolean;
};

export function LifeAreaList({
  icon,
  title,
  summary,
  topicSlugs,
  links,
  defaultOpen,
}: LifeAreaListProps) {
  return (
    <details
      className="border-b border-border py-3"
      {...(defaultOpen ? { open: true } : {})}
    >
      <summary className="cursor-pointer py-2 text-base font-medium">
        <span className="summary-label">
          <EmojiIcon icon={icon} /> {title}
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
        {links?.map(({ href, title }) => (
          <Link
            key={href}
            href={href}
            className="inline-flex min-h-11 items-center rounded-full border border-border bg-card px-3.5 text-sm font-medium text-link no-underline"
          >
            {title}
          </Link>
        ))}
      </div>
    </details>
  );
}
