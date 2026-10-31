// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { runInNewContext } from "node:vm";
vi.mock("next/og", () => ({ ImageResponse: class { constructor(public element: ReactElement, public init: unknown) {} } }));
vi.mock("@vercel/analytics/next", () => ({ Analytics: () => null }));

afterEach(() => { cleanup(); for (const k of ["VERCEL_ENV", "NEXT_PUBLIC_SITE_URL", "VERCEL_PROJECT_PRODUCTION_URL", "VERCEL_URL", "NEXT_PUBLIC_SUPPORT_URL"]) delete process.env[k]; vi.resetModules(); });

describe("metadata routes", () => {
  it("robots and sitemap follow the deployment surface", async () => {
    const robots = (await import("@/app/robots")).default; const sitemap = (await import("@/app/sitemap")).default;
    expect(robots().sitemap).toContain("/sitemap.xml"); expect(sitemap().length).toBeGreaterThan(10);
    process.env.VERCEL_ENV = "preview"; expect(robots().sitemap).toBeUndefined(); expect(sitemap()).toEqual([]);
    expect(((await import("@/app/manifest")).default)().name).toBeTruthy();
  });
  it("site url and support url resolution", async () => {
    const site = await import("@/lib/site");
    expect(site.getSiteUrl()).toBe("http://localhost:3003");
    process.env.VERCEL_URL = "v.app"; expect(site.getSiteUrl()).toBe("https://v.app");
    process.env.VERCEL_ENV = "production"; process.env.VERCEL_PROJECT_PRODUCTION_URL = "p.app"; expect(site.getSiteUrl()).toBe("https://p.app");
    process.env.NEXT_PUBLIC_SITE_URL = "https://s.app/"; expect(site.getSiteUrl()).toBe("https://s.app");
    expect(site.getSupportUrl()).toBe(site.DEFAULT_SUPPORT_URL); process.env.NEXT_PUBLIC_SUPPORT_URL = "https://x.y/"; expect(site.getSupportUrl()).toBe("https://x.y");
  });
  it("image routes render the book mark", async () => {
    const mods = [await import("@/app/icon"), await import("@/app/apple-icon"), await import("@/app/opengraph-image")];
    for (const m of mods) { const r = (m.default as unknown as () => { element: ReactElement })(); render(r.element); cleanup(); }
    for (const m of Object.values(import.meta.glob("../../src/app/pwa/**/route.tsx", { eager: true })) as unknown as { GET: () => { element: ReactElement } }[]) { render(m.GET().element); cleanup(); }
  });
});

describe("shell", () => {
  it("early bootstrap ignores only the optional Preview toolbar failure", async () => {
    const { default: RootLayout } = await import("@/app/layout");
    const root = (RootLayout as unknown as (props: unknown) => ReactElement)({ children: <p>child</p> });
    function scripts(node: ReactNode): string[] {
      const found: string[] = [];
      Children.forEach(node, child => {
        if (!isValidElement<{ children?: ReactNode; dangerouslySetInnerHTML?: { __html: string } }>(child)) return;
        if (child.props.dangerouslySetInnerHTML) found.push(child.props.dangerouslySetInnerHTML.__html);
        found.push(...scripts(child.props.children));
      });
      return found;
    }
    const bootstrap = scripts(root).find(script => script.includes("bible-compass-splash-seen"));
    expect(bootstrap).toBeTruthy();
    const attributes = new Map<string, string>();
    let onError: ((event: { target: Element }) => void) | undefined;
    runInNewContext(bootstrap!, {
      document: { documentElement: { setAttribute: (key: string, value: string) => attributes.set(key, value), removeAttribute: (key: string) => attributes.delete(key) } },
      sessionStorage: { getItem: () => "1" },
      window: { matchMedia: () => ({ matches: false }), addEventListener: (_type: string, handler: typeof onError) => { onError = handler; } },
    });
    const toolbar = document.createElement("script");
    toolbar.src = "https://vercel.live/_next-live/feedback/feedback.js";
    onError!({ target: toolbar });
    expect(attributes.get("data-shell")).toBeUndefined();
    expect(attributes.get("data-splash")).toBe("seen");
    for (const tag of ["script", "link"]) {
      onError!({ target: document.createElement(tag) });
      expect(attributes.get("data-shell")).toBe("fault");
      expect(attributes.has("data-splash")).toBe(false);
    }
  });
  it("root layout renders for production and preview", async () => {
    for (const env of [undefined, "preview"]) {
      if (env) process.env.VERCEL_ENV = env; vi.resetModules();
      const { default: RootLayout, metadata } = await import("@/app/layout");
      expect(metadata.robots).toBeTruthy();
      type Node = { props: { children: Node[] & ReactElement } };
      const html = (RootLayout as unknown as (p: unknown) => Node)({ children: <p>child</p> });
      const { container } = render(html.props.children[1].props.children[5].props.children);
      expect(container).toBeTruthy(); cleanup();
      render(html as unknown as ReactElement);
      cleanup();
    }
  });
  it("error boundaries retry and show references", async () => {
    const { default: RouteError } = await import("@/app/error"); const { default: GlobalError } = await import("@/app/global-error");
    const retry = vi.fn();
    render(<RouteError error={Object.assign(new Error("x"), { digest: "D1" })} retry={retry} />);
    fireEvent.click(screen.getByText("Try again")); expect(screen.getByText(/D1/)).toBeTruthy(); cleanup();
    render(<RouteError error={new Error("x")} retry={retry} />); cleanup();
    render(<GlobalError error={Object.assign(new Error("x"), { digest: "D2" })} retry={retry} />);
    fireEvent.click(screen.getByText("Try again")); expect(retry).toHaveBeenCalledTimes(2); cleanup();
    render(<GlobalError error={new Error("x")} retry={retry} />);
  });
  it("small pages and layouts", async () => {
    for (const p of ["@/app/not-found", "@/app/loading", "@/app/proverbs/layout", "@/app/psalms/layout", "@/app/gifts/layout"] as const) {
      const C = (await import(/* @vite-ignore */ p)).default as (p: unknown) => ReactElement;
      render(C({ children: <span>c</span> })); cleanup();
    }
  });
  it("revelation return focus opens the passage", async () => {
    const { PassageReturnFocus } = await import("@/app/revelation/PassageReturnFocus");
    document.body.innerHTML = '<details><a id="p1" href="#">x</a></details><span id="p2"></span>';
    window.location.hash = "#p1";
    const raf = vi.spyOn(window, "requestAnimationFrame").mockImplementation(cb => { cb(0); return 1; });
    const { unmount } = render(<PassageReturnFocus passageIds={["p1", "p2"]} />);
    expect((document.querySelector("details") as HTMLDetailsElement).open).toBe(true);
    window.location.hash = "#p2"; window.dispatchEvent(new Event("hashchange"));
    window.location.hash = "#p1"; window.dispatchEvent(new Event("hashchange"));
    window.location.hash = "#nope"; window.dispatchEvent(new Event("hashchange"));
    unmount(); raf.mockRestore();
  });
});
