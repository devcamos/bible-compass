import Link from "next/link";
import { concepts, ontology } from "@/content/concepts";

export function ConceptCategories() {
  return (
    <section className="mt-8" aria-labelledby="concepts-heading">
      <h2 id="concepts-heading" className="bc-title mb-2 text-[1.2rem]">Concepts</h2>
      <p className="text-muted-foreground">Explore beliefs, practices and themes, and see how they connect.</p>
      {ontology.categories.map((category) => (
        <details key={category.id} className="border-b border-border py-3">
          <summary className="py-2 font-medium"><span className="summary-label">{category.title}</span></summary>
          <p className="m-0 pb-2 text-sm text-muted-foreground">{category.summary}</p>
          <div className="flex flex-wrap gap-2 py-3">
            {concepts.filter((concept) => concept.categoryId === category.id).map((concept) => (
              <Link key={concept.id} href={`/concepts/${concept.slug}`} className="bc-btn bc-btn--quiet">{concept.title}</Link>
            ))}
          </div>
        </details>
      ))}
      <Link href="/concepts" className="bc-btn mt-4">Explore all concepts and mappings</Link>
    </section>
  );
}
