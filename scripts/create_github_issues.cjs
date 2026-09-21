const { execSync } = require('child_process');

const issues = [
  {
    title: "[CACHE] Unify the three parallel cache systems into a single VelixCache",
    labels: "p0-critical,architecture,cache",
    body: `### Problem
Three distinct cache implementations exist simultaneously with incompatible key formats, TTL semantics, and invalidation paths:
1. \`VelixCache\` (velix-core) -> LRU Memory + ICacheAdapter
2. \`CacheManager\` (velix actions/revalidation) -> Plain Map<string, CacheEntry>
3. \`CacheManager\` (velix-pack) -> FSCache (filesystem)

\`revalidatePath('/blog')\` in the velix package deletes from the plain Map, whereas \`VelixCache.revalidatePath()\` in velix-core deletes by prefix \`route:/blog\`.

### Proposed Solution
1. Designate \`VelixCache\` (velix-core) as the single framework cache authority.
2. Deprecate and remove \`packages/velix/actions/revalidation.ts\` plain Map cache.
3. Unify on \`ICacheAdapter\` interface.`
  },
  {
    title: "[ACTIONS] Add CSRF/Origin protection to the server action endpoint",
    labels: "p0-critical,security,actions",
    body: `### Problem
\`handleServerAction()\` in \`packages/velix/server/index.ts\` accepts any POST to \`/__velix/action\` with no Origin header check, no CSRF token, and no referer validation.

### Proposed Solution
1. Validate \`Origin\` / \`Referer\` headers against configured app origin.
2. Reject unauthorized requests with 403.
3. Enforce presence of \`X-Velix-Action\` header.`
  },
  {
    title: "[ACTIONS] Fix action registry for multi-process / serverless environments",
    labels: "p0-critical,architecture,actions",
    body: `### Problem
\`globalThis.__VELIX_ACTIONS__\` stores the action registry in process memory. In serverless or multi-process clusters, process instances start with an empty registry.

### Proposed Solution
Generate a static action manifest at build time and auto-import registered actions on process startup.`
  },
  {
    title: "[ISLANDS] Move island bundling from request-time to build-time",
    labels: "p0-critical,architecture,islands",
    body: `### Problem
Island component JS bundles are generated on-demand per request via \`esbuild.build()\` in production, causing severe CPU load and returning 404 in static production builds.

### Proposed Solution
Build island components during \`velix build\` and write static bundles to \`public/islands/\`.`
  },
  {
    title: "[ISLANDS] Fix random island IDs that break SSR/hydration consistency",
    labels: "p0-critical,bug,islands",
    body: `### Problem
Island IDs are generated with \`crypto.randomBytes(4)\` at render time, breaking deterministic DOM matching during hydration.

### Proposed Solution
Use a deterministic counter per request render combined with component name.`
  },
  {
    title: "[HMR] Remove duplicate filesystem watcher in start-dev.ts",
    labels: "p1-high,architecture,hmr",
    body: `### Problem
\`start-dev.ts\` and \`VelixPack.watch()\` both run independent \`chokidar\` watchers, causing duplicate re-evaluations and CPU thrashing.`
  },
  {
    title: "[BUILD] Fix non-functional CI/CD workflow (stale paths, npm vs pnpm)",
    labels: "p1-high,bug,ci-cd",
    body: `### Problem
\`.github/workflows/ci.yml\` references non-existent paths (\`core/tsconfig.json\`) and uses \`npm ci\` instead of \`pnpm\`.`
  },
  {
    title: "[ACTIONS] Fix validateInput() false-positive on 'constructor' key",
    labels: "p1-high,bug,security",
    body: `### Problem
\`'constructor' in obj\` is true for all JavaScript objects, causing all valid object payloads to fail input validation.`
  },
  {
    title: "[ACTIONS] Replace Math.random() action IDs with crypto.randomBytes()",
    labels: "p1-high,security,actions",
    body: `### Problem
Action IDs use non-cryptographic \`Math.random()\`.`
  },
  {
    title: "[ACTIONS] Sanitize server action error messages in production",
    labels: "p1-high,security,actions",
    body: `### Problem
Internal \`error.message\` strings (DB stack traces, paths) are returned verbatim in HTTP responses.`
  }
];

console.log(`Found ${issues.length} issues to create.`);
const ghPath = `"C:\\Program Files\\GitHub CLI\\gh.exe"`;

for (let i = 0; i < issues.length; i++) {
  const issue = issues[i];
  console.log(`[${i + 1}/${issues.length}] Creating issue: ${issue.title}`);
  try {
    const cmd = `${ghPath} issue create --repo Velixteam/flexireact --title "${issue.title.replace(/"/g, '\\"')}" --body "${issue.body.replace(/"/g, '\\"')}" --label "${issue.labels}"`;
    const out = execSync(cmd, { encoding: 'utf8', env: { ...process.env, GITHUB_TOKEN: '' } });
    console.log(`  -> Created: ${out.trim()}`);
  } catch (err) {
    console.error(`  -> Failed: ${err.message}`);
  }
}
