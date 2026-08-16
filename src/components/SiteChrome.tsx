"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/topics/jesus-and-the-gospel", label: "Jesus and the Gospel" },
  { href: "/how-to-use", label: "How to use" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();

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
      <nav aria-label="Primary" className="flex flex-wrap gap-2">
        {navItems.map((item) => {
          const current = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={current ? "page" : undefined}
              className={
                current
                  ? "inline-flex min-h-11 items-center rounded-full border border-copper bg-card px-3.5 text-sm font-medium text-copper no-underline"
                  : "inline-flex min-h-11 items-center rounded-full px-3.5 text-sm font-medium text-muted-foreground no-underline"
              }
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
