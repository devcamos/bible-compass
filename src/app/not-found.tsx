import Link from "next/link";

export default function NotFound() {
  return (
    <section>
      <h1 className="bc-title text-[1.85rem]">This path is not in v0.1</h1>
      <p className="leading-7 text-muted-foreground">
        Bible Compass only publishes stable public routes that have been imported into the
        reader. Return home and choose a current path.
      </p>
      <Link
        href="/"
        className="bc-btn"
      >
        Back to Compass
      </Link>
    </section>
  );
}
