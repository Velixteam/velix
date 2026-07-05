/**
 * bench-build.js
 * Mesure les métriques de build Velix et les écrit dans bench-results.json.
 *
 * Métriques collectées :
 * - buildTime (ms) : durée complète du build
 * - bundleSize (KB) : taille totale des fichiers JS dans dist/
 * - routeCount : nombre de routes détectées
 * - scanTime (ms) : temps de scan du système de fichiers
 * - timestamp : ISO string
 * - commit : SHA Git court (depuis GITHUB_SHA)
 */

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ── Mesure du scan de routes ──────────────────────────────────────────────────

let routeCount = 0;
let scanTime = 0;

try {
  const scanStart = performance.now();
  // Utilise le scanner Velix pour mesurer sans trigger de build
  const scanResult = spawnSync('node', [
    '-e',
    `
    import('../packages/velix-core/dist/index.js').then(({ buildRouteTree }) => {
      return buildRouteTree('./app');
    }).then(routes => {
      console.log(JSON.stringify({ count: routes.appRoutes?.length ?? 0 }));
    }).catch(() => console.log('{"count":0}'));
    `
  ], { encoding: 'utf8', shell: true });

  scanTime = Math.round(performance.now() - scanStart);

  if (scanResult.stdout) {
    try {
      const parsed = JSON.parse(scanResult.stdout.trim());
      routeCount = parsed.count ?? 0;
    } catch {
      routeCount = 0;
    }
  }
} catch {
  // Non critique — le build time reste la métrique principale
}

// ── Mesure du build complet ────────────────────────────────────────────────────

console.log('🔨 Démarrage du build Velix...');
const buildStart = performance.now();

execSync('pnpm velix build', { stdio: 'pipe' });

const buildTime = Math.round(performance.now() - buildStart);

// ── Calcul de la taille du bundle ──────────────────────────────────────────────

const distDir = path.join(process.cwd(), 'dist');
let totalSize = 0;
let fileCount = 0;

if (fs.existsSync(distDir)) {
  function walkDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (entry.name.endsWith('.js')) {
        totalSize += fs.statSync(fullPath).size;
        fileCount++;
      }
    }
  }
  walkDir(distDir);
}

const bundleSize = Math.round(totalSize / 1024); // Convertir en KB

// ── Résultats ──────────────────────────────────────────────────────────────────

const results = {
  buildTime,
  bundleSize,
  routeCount,
  scanTime,
  jsFileCount: fileCount,
  timestamp: new Date().toISOString(),
  commit: process.env.GITHUB_SHA?.slice(0, 7) ?? 'local',
  nodeVersion: process.version,
};

fs.writeFileSync('bench-results.json', JSON.stringify(results, null, 2));

console.log('\n✅ Benchmark results:');
console.log(`  Build time  : ${buildTime}ms`);
console.log(`  Bundle size : ${bundleSize}KB (${fileCount} JS files)`);
console.log(`  Routes      : ${routeCount} routes (scan: ${scanTime}ms)`);
console.log(`  Commit      : ${results.commit}`);
