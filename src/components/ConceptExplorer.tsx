"use client";

import Link from "next/link";
import { useState } from "react";

type Facet = { id: string; title: string };
type Entry = {
  id: string; slug: string; title: string; summary: string; aliases: string[];
  categoryId: string; typeIds: string[]; domainIds: string[]; lifeAreaIds: string[];
  topicCount: number; passageCount: number;
};
type Props = {
  entries: Entry[];
  categories: Facet[]; types: Facet[]; domains: Facet[]; lifeAreas: Facet[];
  relations: { sourceId: string; targetId: string }[];
};

const fieldClass = "min-h-11 w-full rounded-xl border border-border bg-card px-3 py-2 text-base text-foreground";

export function ConceptExplorer({ entries, categories, types, domains, lifeAreas, relations }: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("");
  const [domain, setDomain] = useState("");
  const [lifeArea, setLifeArea] = useState("");
  const needle = query.trim().toLocaleLowerCase();
  const filtered = entries.filter((entry) =>
    (!category || entry.categoryId === category) &&
    (!type || entry.typeIds.includes(type)) &&
    (!domain || entry.domainIds.includes(domain)) &&
    (!lifeArea || entry.lifeAreaIds.includes(lifeArea)) &&
    (!needle || [entry.title, entry.summary, ...entry.aliases].join(" ").toLocaleLowerCase().includes(needle))
  );
  const ids = new Set(filtered.map((entry) => entry.id));
  const relationCount = relations.filter((relation) => ids.has(relation.sourceId) && ids.has(relation.targetId)).length;
  const label = (options: Facet[], values: string[]) => options.filter((option) => values.includes(option.id)).map((option) => option.title).join(", ");
  const selectors = [
    { id: "category", title: "Concept family", value: category, set: setCategory, options: categories },
    { id: "type", title: "Concept type", value: type, set: setType, options: types },
    { id: "domain", title: "Theological domain", value: domain, set: setDomain, options: domains },
    { id: "life-area", title: "Life area", value: lifeArea, set: setLifeArea, options: lifeAreas },
  ];

  return (
    <div>
      <div className="mb-5 rounded-2xl border border-border bg-card p-4">
        <label htmlFor="concept-search" className="mb-2 block text-sm font-medium">Search concepts</label>
        <input id="concept-search" type="search" placeholder="Try armour, judgement or grace" className={fieldClass} value={query} onChange={(event) => setQuery(event.target.value)} />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {selectors.map((selector) => (
            <div key={selector.id}>
              <label htmlFor={selector.id} className="mb-2 block text-sm font-medium">{selector.title}</label>
              <select id={selector.id} className={fieldClass} value={selector.value} onChange={(event) => selector.set(event.target.value)}>
                <option value="">All</option>
                {selector.options.map((option) => <option key={option.id} value={option.id}>{option.title}</option>)}
              </select>
            </div>
          ))}
        </div>
        <button type="button" className="bc-btn bc-btn--quiet mt-4" onClick={() => { setQuery(""); setCategory(""); setType(""); setDomain(""); setLifeArea(""); }}>Clear filters</button>
      </div>

      <p role="status" className="text-sm text-muted-foreground">{filtered.length} of {entries.length} concepts. {relationCount} relationships between these concepts.</p>

      <details className="mb-5 rounded-2xl border border-border bg-card p-4">
        <summary className="font-medium"><span className="summary-label">Analyse mappings</span></summary>
        <p className="text-sm text-muted-foreground">Counts follow your filters. A concept can have several types and domains, so the rows may overlap. Relationships count only when both concepts are shown.</p>
        <p className="text-sm">{filtered.reduce((total, entry) => total + entry.passageCount, 0)} passage mappings and {filtered.reduce((total, entry) => total + entry.topicCount, 0)} topic mappings.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {[{ title: "By concept type", options: types, field: "typeIds" as const }, { title: "By theological domain", options: domains, field: "domainIds" as const }, { title: "By life area", options: lifeAreas, field: "lifeAreaIds" as const }].map((group) => (
            <table key={group.title} className="w-full text-left text-sm">
              <caption className="mb-2 text-left font-medium">{group.title}</caption>
              <thead><tr><th scope="col" className="pb-2 font-medium">Mapping</th><th scope="col" className="pb-2 text-right font-medium">Concepts</th></tr></thead>
              <tbody>{group.options.map((option) => <tr key={option.id} className="border-t border-border"><th scope="row" className="py-2 pr-2 font-normal">{option.title}</th><td className="py-2 text-right">{filtered.filter((entry) => entry[group.field].includes(option.id)).length}</td></tr>)}</tbody>
            </table>
          ))}
        </div>
        <a href="/concepts/data" download className="bc-btn bc-btn--quiet mt-4">Download full ontology (JSON)</a>
        <p className="mb-0 text-sm text-muted-foreground">The export includes the full catalogue, stable IDs, Scripture references, life areas, topic mappings and directed relationships. It does not apply these filters.</p>
      </details>

      {filtered.length ? (
        <ul className="m-0 list-none space-y-3 p-0">
          {filtered.map((entry) => (
            <li key={entry.id} className="rounded-2xl border border-border bg-card p-5">
              <h2 className="bc-title mt-0 mb-2 text-xl"><Link href={`/concepts/${entry.slug}`} className="text-link">{entry.title}</Link></h2>
              <p className="leading-7 text-muted-foreground">{entry.summary}</p>
              <dl className="space-y-2 text-sm">
                {[['Family', label(categories, [entry.categoryId])], ['Type', label(types, entry.typeIds)], ['Domain', label(domains, entry.domainIds)], ['Life area', label(lifeAreas, entry.lifeAreaIds)]].map(([name, value]) => <div key={name}><dt className="inline font-medium">{name}: </dt><dd className="m-0 inline text-muted-foreground">{value}</dd></div>)}
              </dl>
              <p className="mb-0 text-sm text-muted-foreground">{entry.passageCount} passages · {entry.topicCount} related topics</p>
            </li>
          ))}
        </ul>
      ) : <p className="bc-callout">No concepts match these filters. Clear a filter or try a broader search.</p>}
    </div>
  );
}
