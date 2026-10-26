import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    coverage: {
      provider: "v8",
      include: [
        "src/lib/feedback/validation.ts",
        "src/lib/feedback/rate-limit.ts",
        "src/lib/feedback/request.ts",
        "src/lib/feedback/worker-auth.ts",
      ],
      reporter: ["text", "json-summary"],
      thresholds: { lines: 90, branches: 90, functions: 90, statements: 90 },
    },
  },
});
