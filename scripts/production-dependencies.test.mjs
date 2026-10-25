import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdtempSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Exercise an actual production-only install: a full development install can
// hide missing runtime dependencies after lockfile deduplication or overrides.
const root = process.argv[2]
  ? resolve(process.argv[2])
  : join(dirname(fileURLToPath(import.meta.url)), "..");
const fixture = mkdtempSync(join(tmpdir(), "bible-compass-production-deps-"));
try {
  for (const file of ["package.json", "package-lock.json"]) {
    copyFileSync(join(root, file), join(fixture, file));
  }
  const install = spawnSync(
    "npm",
    ["ci", "--omit=dev", "--ignore-scripts", "--no-audit", "--no-fund"],
    { cwd: fixture, encoding: "utf8", timeout: 120_000 },
  );
  assert.equal(install.status, 0, install.error?.message ?? install.stderr);
  const require = createRequire(join(fixture, "package.json"));
  const consumer = createRequire(require.resolve("@vercel/cli-config"));
  const { z } = consumer("zod");
  assert.equal(z.string().parse("runtime dependency available"), "runtime dependency available");
  assert.doesNotThrow(() => require("@vercel/cli-config"));
  console.log("Production-only install loads the Vercel configuration runtime and Zod.");
} finally {
  rmSync(fixture, { recursive: true, force: true });
}
