import { vi } from "vitest";
vi.mock("next/navigation", () => ({
  notFound: () => { throw new Error("NEXT_NOT_FOUND"); },
  redirect: (url: string) => { throw new Error("NEXT_REDIRECT " + url); },
  usePathname: vi.fn(() => "/"),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("next/link", async () => {
  const { createElement } = await import("react");
  return { default: ({ href, children, onNavigate, ...props }: Record<string, unknown>) =>
    createElement("a", { ...Object.fromEntries(Object.entries(props).filter(([k]) => k !== "prefetch")), href: String(href), onClick: (e: Event) => { e.preventDefault(); (onNavigate as (() => void) | undefined)?.(); } }, children as never) };
});
