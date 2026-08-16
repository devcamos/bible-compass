import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TopicView } from "@/components/TopicView";
import { getTopic, TOPIC_SLUGS } from "@/content";

export const dynamicParams = false;

export function generateStaticParams() {
  return TOPIC_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/topics/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const topic = getTopic(slug);
  if (!topic) {
    return { title: "Topic" };
  }
  return {
    title: topic.title,
    description: topic.summary,
    alternates: { canonical: `/topics/${slug}` },
    openGraph: {
      title: topic.title,
      description: topic.summary,
    },
  };
}

export default async function TopicPage({ params }: PageProps<"/topics/[slug]">) {
  const { slug } = await params;
  const topic = getTopic(slug);
  if (!topic) {
    notFound();
  }
  return <TopicView topic={topic} />;
}
