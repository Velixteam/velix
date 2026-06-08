/**
 * Velix v5 — Performance Benchmark
 *
 * Measures:
 * - Route resolution time (target: < 0.1ms per match)
 * - Cache hit/miss performance over 10k operations
 * - VelixCache LRU eviction behavior
 *
 * Run: npx tsx scripts/bench.ts
 */

import { VelixCache } from '../packages/velix-core/src/cache/index.js';

// ── Helpers ──

function formatNs(ns: number): string {
  if (ns < 1_000) return `${ns.toFixed(0)}ns`;
  if (ns < 1_000_000) return `${(ns / 1_000).toFixed(2)}µs`;
  return `${(ns / 1_000_000).toFixed(2)}ms`;
}

function benchmark(name: string, fn: () => void, iterations: number = 10_000): { avgNs: number; opsPerSec: number } {
  // Warmup
  for (let i = 0; i < 100; i++) fn();

  const start = performance.now();
  for (let i = 0; i < iterations; i++) fn();
  const elapsed = performance.now() - start;

  const avgNs = (elapsed * 1_000_000) / iterations;
  const opsPerSec = Math.round(1_000_000_000 / avgNs);

  console.log(`  ${name}: ${formatNs(avgNs)}/op (${opsPerSec.toLocaleString()} ops/sec)`);
  return { avgNs, opsPerSec };
}

// ── Route resolution benchmarks ──

function benchRouteResolution() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  🔀 Route Resolution');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Simulate route patterns
  const routes = [
    { path: '/', pattern: /^\/$/ },
    { path: '/about', pattern: /^\/about$/ },
    { path: '/blog', pattern: /^\/blog$/ },
    { path: '/blog/:slug', pattern: /^\/blog\/([^/]+)$/ },
    { path: '/docs/:section/:page', pattern: /^\/docs\/([^/]+)\/([^/]+)$/ },
    { path: '/api/users', pattern: /^\/api\/users$/ },
    { path: '/api/users/:id', pattern: /^\/api\/users\/([^/]+)$/ },
    { path: '/dashboard', pattern: /^\/dashboard$/ },
    { path: '/dashboard/settings', pattern: /^\/dashboard\/settings$/ },
    { path: '/products/:category/:id', pattern: /^\/products\/([^/]+)\/([^/]+)$/ },
    { path: '/*splat', pattern: /^\/(.*)$/ },
  ];

  function matchRoute(urlPath: string) {
    for (const route of routes) {
      const match = urlPath.match(route.pattern);
      if (match) return route;
    }
    return null;
  }

  // Static route
  benchmark('Static route (/about)', () => matchRoute('/about'));

  // Dynamic route
  benchmark('Dynamic route (/blog/my-post)', () => matchRoute('/blog/my-post'));

  // Deeply nested dynamic
  benchmark('Nested dynamic (/docs/api/router)', () => matchRoute('/docs/api/router'));

  // Catch-all
  benchmark('Catch-all (/some/deep/path)', () => matchRoute('/some/deep/path'));

  // Miss (will match catch-all but still tests scanning)
  benchmark('Full scan (/api/users/123)', () => matchRoute('/api/users/123'));
}

// ── Cache benchmarks ──

function benchCache() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  💾 VelixCache Performance');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Basic set/get
  const cache = new VelixCache({ maxSize: 10_000, defaultTtl: 60_000 });

  benchmark('cache.set() (new key)', () => {
    cache.set(`/page/${Math.random()}`, { html: '<h1>Hello</h1>' });
  }, 10_000);

  // Pre-fill cache for get benchmarks
  const getCache = new VelixCache({ maxSize: 10_000, defaultTtl: 60_000 });
  for (let i = 0; i < 5_000; i++) {
    getCache.set(`/page/${i}`, { html: `<h1>Page ${i}</h1>` });
  }

  benchmark('cache.get() (hit)', () => {
    getCache.get(`/page/${Math.floor(Math.random() * 5_000)}`);
  }, 10_000);

  benchmark('cache.get() (miss)', () => {
    getCache.get(`/missing/${Math.random()}`);
  }, 10_000);

  // Tag-based invalidation
  const tagCache = new VelixCache({ maxSize: 10_000, defaultTtl: 60_000 });
  for (let i = 0; i < 1_000; i++) {
    tagCache.set(`/blog/${i}`, { title: `Post ${i}` }, { tags: ['blog', `author-${i % 10}`] });
  }

  benchmark('revalidateTag() (100 entries)', () => {
    const tag = `author-${Math.floor(Math.random() * 10)}`;
    tagCache.revalidateTag(tag);
    // Re-fill for next iteration
    for (let i = 0; i < 100; i++) {
      tagCache.set(`/blog/refill-${i}`, { title: `Refill ${i}` }, { tags: [tag] });
    }
  }, 1_000);

  // LRU eviction
  console.log('\n  📊 LRU Eviction Test:');
  const lruCache = new VelixCache({ maxSize: 100, defaultTtl: 60_000 });
  const evictionStart = performance.now();
  for (let i = 0; i < 10_000; i++) {
    lruCache.set(`/key/${i}`, { data: i });
  }
  const evictionTime = performance.now() - evictionStart;
  console.log(`  Inserted 10k items into maxSize=100 cache in ${evictionTime.toFixed(2)}ms`);
  console.log(`  Final cache size: ${lruCache.size} (expected: 100)`);

  // Hit/miss ratio simulation
  console.log('\n  📊 Hit/Miss Ratio (10k ops, 1k unique keys, maxSize=500):');
  const ratioCache = new VelixCache({ maxSize: 500, defaultTtl: 60_000 });
  let hits = 0;
  let misses = 0;

  for (let i = 0; i < 10_000; i++) {
    const key = `/data/${Math.floor(Math.random() * 1_000)}`;
    const result = ratioCache.get(key);
    if (result) {
      hits++;
    } else {
      misses++;
      ratioCache.set(key, { value: i });
    }
  }

  console.log(`  Hits: ${hits.toLocaleString()} | Misses: ${misses.toLocaleString()}`);
  console.log(`  Hit ratio: ${((hits / (hits + misses)) * 100).toFixed(1)}%`);
}

// ── Main ──

console.log('╔══════════════════════════════════════════════╗');
console.log('║        Velix v5 — Performance Benchmark      ║');
console.log('╚══════════════════════════════════════════════╝');

benchRouteResolution();
benchCache();

console.log('\n✅ Benchmark complete\n');
