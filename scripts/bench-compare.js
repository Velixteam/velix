/**
 * bench-compare.js
 * Compare les résultats actuels au baseline stocké dans .bench-baseline.json.
 *
 * Règles :
 * - Build time régresse de plus de 20% → exit(1) → CI fail
 * - Bundle size augmente de plus de 10% → warning dans les logs
 * - Première exécution (pas de baseline) → sauvegarde comme baseline
 */

const fs = require('fs');
const path = require('path');

const RESULTS_PATH = path.join(process.cwd(), 'bench-results.json');
const BASELINE_PATH = path.join(process.cwd(), '.bench-baseline.json');

// ── Lecture des résultats actuels ──────────────────────────────────────────────

if (!fs.existsSync(RESULTS_PATH)) {
  console.error('❌ bench-results.json introuvable. Lancez bench-build.js d\'abord.');
  process.exit(1);
}

const current = JSON.parse(fs.readFileSync(RESULTS_PATH, 'utf8'));

// ── Première exécution → création du baseline ──────────────────────────────────

if (!fs.existsSync(BASELINE_PATH)) {
  console.log('ℹ️  Pas de baseline trouvé — sauvegarde des résultats actuels comme baseline.');
  fs.writeFileSync(BASELINE_PATH, JSON.stringify(current, null, 2));
  console.log('✅ Baseline créé :');
  console.log(`  Build time  : ${current.buildTime}ms`);
  console.log(`  Bundle size : ${current.bundleSize}KB`);
  process.exit(0);
}

// ── Comparaison avec le baseline ───────────────────────────────────────────────

const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));

const buildRegression  = (current.buildTime  - baseline.buildTime)  / baseline.buildTime;
const sizeRegression   = (current.bundleSize - baseline.bundleSize) / baseline.bundleSize;

const buildPct = (buildRegression * 100).toFixed(1);
const sizePct  = (sizeRegression  * 100).toFixed(1);
const buildSign = buildRegression >= 0 ? '+' : '';
const sizeSign  = sizeRegression  >= 0 ? '+' : '';

// Affichage des résultats
console.log('\n📊 Benchmark Comparison\n');
console.log('┌─────────────────────────────────────────────┐');
console.log('│ Metric       │ Current   │ Baseline  │ Delta │');
console.log('├─────────────────────────────────────────────┤');
console.log(`│ Build Time   │ ${String(current.buildTime + 'ms').padEnd(9)} │ ${String(baseline.buildTime + 'ms').padEnd(9)} │ ${buildSign}${buildPct}% │`);
console.log(`│ Bundle Size  │ ${String(current.bundleSize + 'KB').padEnd(9)} │ ${String(baseline.bundleSize + 'KB').padEnd(9)} │ ${sizeSign}${sizePct}% │`);
console.log('└─────────────────────────────────────────────┘');
console.log(`  Commit: ${current.commit} → ${baseline.commit ?? 'N/A'}`);

// ── Évaluation des seuils ──────────────────────────────────────────────────────

let exitCode = 0;

// Build time : régression > 20% → CI fail
if (buildRegression > 0.20) {
  console.error(`\n🔴 Build time regression: +${buildPct}% (seuil: +20%)`);
  console.error(`   ${baseline.buildTime}ms → ${current.buildTime}ms (+${current.buildTime - baseline.buildTime}ms)`);
  exitCode = 1;
} else if (buildRegression > 0.10) {
  console.warn(`\n🟡 Warning: build time en hausse de +${buildPct}% (seuil alerte: +10%)`);
} else {
  console.log(`\n🟢 Build time OK: ${buildSign}${buildPct}%`);
}

// Bundle size : augmentation > 10% → warning (pas de fail)
if (sizeRegression > 0.10) {
  console.warn(`🟡 Bundle size increase: +${sizePct}% (seuil: +10%)`);
  console.warn(`   ${baseline.bundleSize}KB → ${current.bundleSize}KB (+${current.bundleSize - baseline.bundleSize}KB)`);
} else if (sizeRegression > 0) {
  console.log(`🟢 Bundle size OK: +${sizePct}%`);
} else {
  console.log(`🟢 Bundle size OK: ${sizePct}% (réduit)`);
}

if (exitCode === 0) {
  console.log('\n✅ Benchmarks passés avec succès !');
}

process.exit(exitCode);
