"use client";

import { SHELL_CRITICAL_CSS } from "@/lib/shell-critical-css";

type GlobalRouteErrorProps = Readonly<{
  error: Error & { digest?: string };
  retry: () => void;
}>;

export default function GlobalRouteError({ error, retry }: GlobalRouteErrorProps) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Bible Compass</title>
        <style dangerouslySetInnerHTML={{ __html: SHELL_CRITICAL_CSS }} />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              .ge{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:1.5rem;font-family:ui-sans-serif,system-ui,sans-serif}
              .ge-card{max-width:24rem;width:100%}
              .ge-kicker{margin:0 0 .5rem;font-size:.72rem;font-weight:500;letter-spacing:.18em;text-transform:uppercase;color:#b85a2a}
              .ge-title{margin:0 0 .5rem;font-family:ui-serif,Georgia,serif;font-size:1.65rem;font-weight:600;letter-spacing:-.02em;color:#1b1510}
              .ge-body{margin:0 0 1rem;line-height:1.55;color:#6d6254}
              .ge-btn{display:inline-flex;min-height:2.75rem;align-items:center;border:0;border-radius:999px;background:#b85a2a;color:#fffaf1;padding:0 1rem;font-size:.875rem;font-weight:500;cursor:pointer}
              .ge-ref{margin:1rem 0 0;font-size:.75rem;color:#6d6254}
            `,
          }}
        />
      </head>
      <body>
        <div className="ge">
          <div className="ge-card">
            <p className="ge-kicker">A quiet pause</p>
            <h1 className="ge-title">Bible Compass could not open</h1>
            <p className="ge-body">
              A connection problem left the reader unfinished. Try again when
              you are ready — grace is not earned through effort.
            </p>
            <button type="button" className="ge-btn" onClick={() => retry()}>
              Try again
            </button>
            {error.digest ? (
              <p className="ge-ref">Reference: {error.digest}</p>
            ) : null}
          </div>
        </div>
      </body>
    </html>
  );
}
