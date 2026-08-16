import Link from "next/link";

type BreadcrumbProps = {
  current: string;
};

export function Breadcrumb({ current }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-5">
      <ol className="m-0 flex list-none flex-wrap items-center gap-2 p-0 text-sm text-muted-foreground">
        <li>
          <Link href="/" className="inline-flex min-h-11 items-center text-link no-underline">
            Home
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li aria-current="page">{current}</li>
      </ol>
    </nav>
  );
}
