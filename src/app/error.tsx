"use client";

import Link from "next/link";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <section className="bc-shell-fallback" aria-labelledby="shell-error-title">
      <p className="bc-kicker m-0 mb-2">A quiet pause</p>
      <h1 id="shell-error-title" className="bc-title m-0 mb-2 text-[1.65rem]">
        This path did not finish loading
      </h1>
      <p className="m-0 mb-4 leading-7 text-muted-foreground">
        A network hitch can leave a blank screen. Stay here, check your
        connection, then try again — grace is not earned through effort.
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="bc-btn border-0" onClick={() => retry()}>
          Try again
        </button>
        <Link href="/" className="bc-btn bc-btn--quiet">
          Back to Compass
        </Link>
      </div>
      {error.digest ? (
        <p className="mt-4 mb-0 text-xs text-muted-foreground">
          Reference: {error.digest}
        </p>
      ) : null}
    </section>
  );
}
