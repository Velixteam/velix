const fs = require('fs');
const path = require('path');

module.exports = async function generateReport(results) {
  const outputDir = path.join(process.cwd(), 'bench-results');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Generate JSON
  const jsonPath = path.join(outputDir, 'latest.json');
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));

  // Generate Markdown
  const mdPath = path.join(outputDir, 'BENCHMARKS.md');
  const date = new Date().toISOString().split('T')[0];
  const nodeVersion = process.version;
  const platform = process.platform;
  
  const getFw = (name) => results[name] || {};
  const velix = getFw('velix');
  const nextjs = getFw('nextjs');
  const remix = getFw('remix');
  const astro = getFw('astro');

  const formatMs = (val) => val != null ? `${Math.round(val)}ms` : 'Coming soon';
  const formatKb = (val) => val != null ? `${val}KB` : 'Coming soon';

  const md = `# Velix Performance Benchmarks

> Measured on: ${date} · Node ${nodeVersion} · ${platform}
> Methodology: 5 runs averaged, production build, local mock API

## Build Performance

| Framework | Build Time | JS Bundle (gzip) | CSS Bundle (gzip) |
|---|---|---|---|
| **Velix v5.2** | ${formatMs(velix.buildTime)} | ${formatKb(velix.bundleSizeJS)} | ${formatKb(velix.bundleSizeCSS)} |
| Next.js 15 | ${formatMs(nextjs.buildTime)} | ${formatKb(nextjs.bundleSizeJS)} | ${formatKb(nextjs.bundleSizeCSS)} |
| Remix 2 | ${formatMs(remix.buildTime)} | ${formatKb(remix.bundleSizeJS)} | ${formatKb(remix.bundleSizeCSS)} |
| Astro 5 | ${formatMs(astro.buildTime)} | ${formatKb(astro.bundleSizeJS)} | ${formatKb(astro.bundleSizeCSS)} |

## Runtime Performance (SSR)

| Framework | TTFB p50 | TTFB p95 | FCP p50 | FCP p95 |
|---|---|---|---|---|
| **Velix v5.2** | ${formatMs(velix.ttfb?.p50)} | ${formatMs(velix.ttfb?.p95)} | ${formatMs(velix.fcp?.p50)} | ${formatMs(velix.fcp?.p95)} |
| Next.js 15 | ${formatMs(nextjs.ttfb?.p50)} | ${formatMs(nextjs.ttfb?.p95)} | ${formatMs(nextjs.fcp?.p50)} | ${formatMs(nextjs.fcp?.p95)} |
| Remix 2 | ${formatMs(remix.ttfb?.p50)} | ${formatMs(remix.ttfb?.p95)} | ${formatMs(remix.fcp?.p50)} | ${formatMs(remix.fcp?.p95)} |
| Astro 5 | ${formatMs(astro.ttfb?.p50)} | ${formatMs(astro.ttfb?.p95)} | ${formatMs(astro.fcp?.p50)} | ${formatMs(astro.fcp?.p95)} |

## Notes
- Honnêteté : si Velix est plus lent sur une métrique, c'est affiché tel quel
- "Coming soon" si métrique non encore implémentée
- Methodology complète : scripts/bench/README.md
`;

  fs.writeFileSync(mdPath, md);
  console.log(`Report generated at ${mdPath}`);
};
