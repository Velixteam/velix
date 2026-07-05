// Pour chaque framework, mesurer :
export const METRICS = {
  // Build
  buildTime: null,          // ms — temps total de production build
  bundleSizeJS: null,       // KB — taille JS initial (gzippé)
  bundleSizeCSS: null,      // KB — taille CSS initial (gzippé)
  routeCount: null,         // nombre de routes dans l'app test

  // Runtime (via Playwright headless)
  ttfb: {
    p50: null,              // ms — médiane
    p95: null,              // ms — 95ème percentile
    p99: null,              // ms — 99ème percentile
  },
  fcp: null,                // ms — First Contentful Paint
  lcp: null,                // ms — Largest Contentful Paint
  tti: null,                // ms — Time to Interactive

  // Dev Server
  devStartTime: null,       // ms — temps avant premier HMR ready
  hmrTime: null,            // ms — temps HMR après modification CSS

  // Cold Start (serverless simulation)
  coldStartTime: null,      // ms — premier request après démarrage
};
