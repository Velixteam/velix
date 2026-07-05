/**
 * bench-load.js (k6)
 * Test de charge pour valider les performances sous traffic.
 *
 * Seuils de réussite :
 * - p(95) TTFB < 200ms
 * - Taux d'erreurs HTTP < 1%
 * - p(99) TTFB < 500ms
 *
 * Usage :
 *   k6 run scripts/bench-load.js
 *   k6 run --env BASE_URL=http://staging.example.com scripts/bench-load.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Counter } from 'k6/metrics';

const ttfb = new Trend('ttfb', true);
const cacheHits = new Counter('cache_hits');
const cacheMisses = new Counter('cache_misses');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  scenarios: {
    baseline: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 },   // montée progressive
        { duration: '1m',  target: 50 },   // charge constante
        { duration: '10s', target: 0 },    // descente
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    ttfb:               ['p(95)<200', 'p(99)<500'],
    http_req_failed:    ['rate<0.01'],
    http_req_duration:  ['p(95)<500'],
  },
};

/**
 * Pages à tester — couverture des patterns de routes
 */
const PAGES = [
  '/',
  '/about',
  '/blog',
  '/blog/hello-world',
  '/api/health',
];

export default function () {
  group('Pages navigation', () => {
    for (const page of PAGES) {
      const res = http.get(`${BASE_URL}${page}`, {
        headers: { 'Accept': 'text/html' },
        tags: { page },
      });

      ttfb.add(res.timings.waiting, { page });

      const ok = check(res, {
        'status 200': r => r.status === 200,
        'TTFB < 200ms': r => r.timings.waiting < 200,
        'has body': r => r.body !== null && r.body.length > 0,
      });

      // Suivre les cache hits via le header X-Velix-Cache si présent
      const cacheHeader = res.headers['X-Velix-Cache'];
      if (cacheHeader === 'HIT') cacheHits.add(1);
      else if (cacheHeader === 'MISS') cacheMisses.add(1);
    }
  });

  sleep(1);
}

export function handleSummary(data) {
  return {
    stdout: JSON.stringify({
      ttfb_p95: data.metrics.ttfb?.values?.['p(95)'] ?? null,
      ttfb_p99: data.metrics.ttfb?.values?.['p(99)'] ?? null,
      error_rate: data.metrics.http_req_failed?.values?.rate ?? null,
      vus_max: data.metrics.vus_max?.values?.max ?? null,
    }, null, 2),
  };
}
