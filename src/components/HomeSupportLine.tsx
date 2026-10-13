import { SupportCoffeeLink } from "@/components/SupportCoffeeLink";

/**
 * One quiet support line at the very bottom of the home page —
 * after every home section, never between them.
 */
export function HomeSupportLine() {
  return (
    <p className="mt-10 mb-0 text-center text-sm leading-6 text-muted-foreground">
      <SupportCoffeeLink
        label="Find this useful? Get me a coffee"
        className="inline-flex items-center gap-1.5 whitespace-nowrap font-medium text-link no-underline"
      />
    </p>
  );
}
