import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: false,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

// Node 22.18+ strips types by default; older 22.x needs the experimental flag
// so content-contract can import `src/**/*.ts` helpers.
run(process.execPath, [join(root, "scripts/production-dependencies.test.mjs")]);
run(process.execPath, [
  "--experimental-strip-types",
  "--test",
  join(root, "scripts/content-contract.mjs"),
]);
// Prefer local bins over `npx` (avoids broken host npm exec in some agent VMs).
// Typed routes (LayoutProps / PageProps) live in .next/types — generate before tsc.
const bin = join(root, "node_modules", ".bin");
run(process.execPath, ["--import", "tsx", join(root, "scripts/pwa-notifications.test.ts")]);
run(process.execPath, ["--import", "tsx", join(root, "scripts/app-updates.test.ts")]);
run(process.execPath, ["--import", "tsx", join(root, "scripts/feedback.test.ts")]);
run(process.execPath, ["--import", "tsx", join(root, "scripts/feedback-client.test.ts")]);
run(process.execPath, ["--import", "tsx", join(root, "scripts/feedback-outbox.test.ts")]);
run(process.execPath, ["--import", "tsx", join(root, "scripts/saved-pages.test.ts")]);
run(process.execPath, ["--import", "tsx", "--test", join(root, "scripts/proverbs.test.ts")]);
run(process.execPath, ["--import", "tsx", "--test", join(root, "scripts/psalms.test.ts")]);
run(process.execPath, ["--import", "tsx", join(root, "scripts/revelation.test.ts")]);
run(process.execPath, ["--import", "tsx", join(root, "scripts/gifts.test.ts")]);
run(join(bin, "next"), ["typegen"]);
run(join(bin, "tsc"), ["--noEmit"]);
run(join(bin, "eslint"), [".", "--max-warnings=0"]);
run(join(bin, "next"), ["build"]);
