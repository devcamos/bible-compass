/** Basic dependency-cruiser config used by PR Architecture Intelligence. */
module.exports = {
  forbidden: [
    { name: "no-circular", severity: "error", from: {}, to: { circular: true } },
    {
      name: "no-orphans",
      severity: "info",
      comment:
        "A module nothing imports is usually dead code. Next.js App Router special files are the exception: the framework loads them by file name, so they are entry points, not orphans.",
      from: {
        orphan: true,
        pathNot: [
          "\\.d\\.ts$",
          "(^|/)\\.[^/]+\\.(js|cjs|mjs|ts|json)$",
          "^src/app/(.*/|)(page|layout|template|default|loading|error|global-error|not-found|route|opengraph-image|twitter-image|icon|apple-icon|sitemap|robots|manifest)\\.(js|jsx|ts|tsx)$",
          "^src/(middleware|proxy|instrumentation)\\.(js|ts)$",
        ],
      },
      to: {},
    },
    { name: "not-to-test", severity: "error", from: { pathNot: "^(tests|scripts)" }, to: { path: "^tests" } },
    { name: "no-non-package-json", severity: "error", from: {}, to: { dependencyTypes: ["npm-no-pkg", "npm-unknown"] } },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    exclude: { path: "(^|/)(node_modules|\\.next|coverage|dist)/" },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.json" },
    enhancedResolveOptions: { exportsFields: ["exports"], conditionNames: ["import", "require", "node", "default"] },
  },
}
