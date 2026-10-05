import { ontology } from "@/content/concepts";
import { lifeAreas } from "@/content/home";
import { topics } from "@/content";

export const dynamic = "force-static";

export function GET() {
  return Response.json({
    ...ontology,
    lifeAreas: lifeAreas.map(({ id, title, topicSlugs }) => ({ id, title, topicSlugs })),
    topics: topics.map(({ slug, title }) => ({ id: slug, title, path: `/topics/${slug}` })),
  }, {
    headers: { "Content-Disposition": 'attachment; filename="bible-compass-concepts.json"' },
  });
}
