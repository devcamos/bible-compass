import { getSupportUrl } from "@/lib/site";

type SupportCoffeeLinkProps = {
  /** Visible label before the external-link arrow. */
  label: string;
  className?: string;
};

/**
 * Personal Buy Me a Coffee link with a consistent label↔arrow gap.
 * Opens in a new tab. No company branding.
 */
export function SupportCoffeeLink({ label, className }: SupportCoffeeLinkProps) {
  const href = getSupportUrl();

  return (
    <a
      href={href}
      className={className}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span>{label}</span>
      <span aria-hidden="true">↗</span>
    </a>
  );
}
