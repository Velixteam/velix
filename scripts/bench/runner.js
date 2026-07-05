import { execSync, spawn } from 'child_process';
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const FRAMEWORKS = ['velix', 'nextjs', 'remix', 'astro'];
const RUNS = 5;
const PORT_BASE = 4000;

function percentile(arr, p) {
  if (arr.length === 0) return 0;
  arr.sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * arr.length) - 1;
  return arr[index];
}

async function waitForServer(url, timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch (e) {
      // ignore
    }
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error(`Server at ${url} did not start in time`);
}

async function benchmarkFramework(name, port) {
  const dir = path.join(process.cwd(), 'scripts', 'bench', 'frameworks', name);
  const setupPath = path.join(dir, 'setup.js');
  
  if (!fs.existsSync(setupPath)) {
    console.warn(`[WARN] Skipping ${name} - setup.js not found`);
    return null;
  }
  
  // Dynamic import of the setup module (using require since it's a script)
  const setup = require(setupPath);

  console.log(`\n⏱ Benchmarking ${name}...`);

  // 1. Build time
  const buildStart = performance.now();
  await setup.build();
  const buildTime = Math.round(performance.now() - buildStart);

  // 2. Bundle size (analyse dist/ or out/)
  const bundleSize = await setup.getBundleSize();

  // 3. Start server
  const server = await setup.start(port);
  await waitForServer(`http://localhost:${port}`);

  // 4. Runtime metrics via Playwright
  const browser = await chromium.launch();
  const ttfbs = [];
  const fcps = [];

  for (let i = 0; i < RUNS; i++) {
    const page = await browser.newPage();

    // TTFB
    const timing = await page.evaluate(async () => {
      const entry = performance.getEntriesByType('navigation')[0];
      return entry ? entry.responseStart - entry.requestStart : 0;
    });
    ttfbs.push(timing);

    // FCP
    await page.goto(`http://localhost:${port}/`);
    const fcp = await page.evaluate(() =>
      new Promise(resolve => {
        new PerformanceObserver(list => {
          const entry = list.getEntries().find(e => e.name === 'first-contentful-paint');
          if (entry) resolve(entry.startTime);
        }).observe({ type: 'paint', buffered: true });
        
        // Timeout fallback
        setTimeout(() => resolve(0), 5000);
      })
    );
    fcps.push(fcp);
    await page.close();
  }

  await browser.close();
  server.kill();

  return {
    framework: name,
    buildTime,
    bundleSizeJS: bundleSize.js,
    bundleSizeCSS: bundleSize.css,
    ttfb: {
      p50: percentile(ttfbs, 50),
      p95: percentile(ttfbs, 95),
      p99: percentile(ttfbs, 99),
    },
    fcp: {
      p50: percentile(fcps, 50),
      p95: percentile(fcps, 95),
    },
    measuredAt: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
  };
}

async function main() {
  const results = {};
  for (const [i, fw] of FRAMEWORKS.entries()) {
    const res = await benchmarkFramework(fw, PORT_BASE + i);
    if (res) results[fw] = res;
  }
  
  // Call report generator
  const reportPath = path.join(process.cwd(), 'scripts', 'bench', 'report.js');
  if (fs.existsSync(reportPath)) {
    const generateReport = require(reportPath);
    await generateReport(results);
  } else {
    console.log(JSON.stringify(results, null, 2));
  }
}

main().catch(console.error);
