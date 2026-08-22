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

run(process.execPath, ["--test", join(root, "scripts/content-contract.mjs")]);
// Typed routes (LayoutProps / PageProps) live in .next/types — generate before tsc.
run("npx", ["next", "typegen"]);
run("npx", ["tsc", "--noEmit"]);
run("npx", ["eslint", ".", "--max-warnings=0"]);
run("npx", ["next", "build"]);
