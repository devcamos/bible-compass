"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteHeader() {
  const pathname = usePathname();
  const onHowToUse = pathname === "/how-to-use";

  return (
    <header className="flex items-center justify-between gap-3 py-4">
      <Link
        href="/"
        className="flex min-h-11 items-center gap-2.5 text-[1.05rem] font-medium text-copper no-underline"
        aria-current={pathname === "/" ? "page" : undefined}
      >
        <span aria-hidden="true">📖</span>
        Bible Compass
      </Link>
      <nav aria-label="Primary">
        <Link
          href="/how-to-use"
          aria-current={onHowToUse ? "page" : undefined}
          className={
            onHowToUse
              ? "inline-flex min-h-11 items-center gap-1.5 rounded-full border border-copper bg-card px-3.5 text-sm font-medium text-copper no-underline"
              : "inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border bg-card px-3.5 text-sm font-medium text-foreground no-underline"
          }
        >
          <span aria-hidden="true">🧭</span>
          How to use
        </Link>
      </nav>
    </header>
  );
}
