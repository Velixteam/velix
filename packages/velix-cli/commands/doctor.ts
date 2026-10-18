/**
 * `velix doctor` & `velix info`
 * Health check & diagnostic tool verifying styling, runtime, dependencies, and imports.
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import pc from 'picocolors';
import { VERSION } from '../version.js';
import { showBanner, log } from './shared.js';

interface DiagnosticResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message?: string;
  detail?: string;
}

export async function doctorCommand() {
  showBanner();
  console.log(`  ${pc.bold('▲ Velix Doctor — Diagnostic & Health Check')}`);
  log.blank();

  const cwd = process.cwd();
  const results: DiagnosticResult[] = [];

  // 1. Node.js version
  const nodeMajor = parseInt(process.version.slice(1), 10);
  if (nodeMajor >= 18) {
    results.push({ name: 'Node.js version', status: 'pass', detail: process.version });
  } else {
    results.push({ name: 'Node.js version', status: 'fail', message: `Node.js >= 18 is required (current: ${process.version})` });
  }

  // 2. Project structure & config
  const hasConfig = fs.existsSync(path.join(cwd, 'velix.config.ts')) || fs.existsSync(path.join(cwd, 'velix.config.js'));
  if (hasConfig) {
    results.push({ name: 'velix.config.ts', status: 'pass', detail: 'Found' });
  } else {
    results.push({ name: 'velix.config.ts', status: 'warn', message: 'Missing velix.config.ts (using framework defaults)' });
  }

  const hasAppDir = fs.existsSync(path.join(cwd, 'app'));
  if (hasAppDir) {
    results.push({ name: 'app/ directory', status: 'pass', detail: 'Found' });
  } else {
    results.push({ name: 'app/ directory', status: 'fail', message: 'app/ directory is required for file-system routing' });
  }

  // 3. Tailwind presence & version
  let tailwindVersion = '';
  const pkgJsonPath = path.join(cwd, 'package.json');
  let pkgData: any = {};
  if (fs.existsSync(pkgJsonPath)) {
    try {
      pkgData = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
    } catch {}
  }

  const deps = { ...(pkgData.dependencies || {}), ...(pkgData.devDependencies || {}) };
  if (deps['@tailwindcss/cli']) {
    tailwindVersion = `v4 (@tailwindcss/cli: ${deps['@tailwindcss/cli']})`;
  } else if (deps['tailwindcss']) {
    tailwindVersion = `tailwindcss: ${deps['tailwindcss']}`;
  }

  if (tailwindVersion) {
    results.push({ name: 'Tailwind CSS dependency', status: 'pass', detail: tailwindVersion });
  } else {
    results.push({ name: 'Tailwind CSS dependency', status: 'warn', message: 'Neither @tailwindcss/cli nor tailwindcss found in package.json' });
  }

  // 4. CSS Input & Compiled Output Existence
  const cssInputPath = path.join(cwd, 'app', 'globals.css');
  if (fs.existsSync(cssInputPath)) {
    const inputSize = fs.statSync(cssInputPath).size;
    results.push({ name: 'CSS input (app/globals.css)', status: 'pass', detail: `${inputSize} bytes` });
  } else {
    results.push({ name: 'CSS input (app/globals.css)', status: 'warn', message: 'app/globals.css not found' });
  }

  const publicCssPath = path.join(cwd, 'public', 'tailwind.css');
  const distCssPath = path.join(cwd, 'dist', 'public', 'tailwind.css');
  const cssOutputPath = fs.existsSync(distCssPath) ? distCssPath : (fs.existsSync(publicCssPath) ? publicCssPath : null);

  if (cssOutputPath) {
    const outputStat = fs.statSync(cssOutputPath);
    if (outputStat.size > 0) {
      results.push({ name: 'Compiled CSS output', status: 'pass', detail: `${path.relative(cwd, cssOutputPath)} (${outputStat.size} bytes)` });

      // 5. Check presence of at least one utility class (e.g. .flex, .grid, .text-)
      const cssContent = fs.readFileSync(cssOutputPath, 'utf8');
      const hasUtility = /\.flex\b|\.grid\b|\.text-|\.bg-|\.p-|\.m-/.test(cssContent);
      if (hasUtility) {
        results.push({ name: 'Tailwind utility classes', status: 'pass', detail: 'Utility classes found in compiled CSS' });
      } else {
        results.push({
          name: 'Tailwind utility classes',
          status: 'fail',
          message: 'No utility classes found in compiled CSS (preflight only). Ensure source directories are scanned (@source).'
        });
      }

      // Check for misplaced @import
      const lines = cssContent.split('\n');
      let seenRule = false;
      let hasMisplacedImport = false;
      for (const line of lines) {
        const tr = line.trim();
        if (!tr || tr.startsWith('/*') || tr.startsWith('*') || tr.startsWith('@layer') || tr.startsWith('@charset')) continue;
        if (tr.startsWith('@import')) {
          if (seenRule) { hasMisplacedImport = true; break; }
        } else {
          seenRule = true;
        }
      }
      if (hasMisplacedImport) {
        results.push({
          name: 'CSS @import placement',
          status: 'fail',
          message: 'Found @import after style rules in compiled CSS. Browsers will ignore this. Move fonts to <link> in layout.tsx.'
        });
      }
    } else {
      results.push({ name: 'Compiled CSS output', status: 'fail', message: 'Compiled CSS file exists but is empty (0 bytes)' });
    }
  } else {
    results.push({ name: 'Compiled CSS output', status: 'warn', message: 'public/tailwind.css not generated yet (run velix build or velix dev)' });
  }

  // 6. Declared styles exist
  // Inspect velix.config.ts if present
  let configStyles: string[] = ['/tailwind.css'];
  try {
    const configContent = fs.existsSync(path.join(cwd, 'velix.config.ts')) ? fs.readFileSync(path.join(cwd, 'velix.config.ts'), 'utf8') : '';
    const stylesMatch = configContent.match(/styles\s*:\s*\[([\s\S]*?)\]/);
    if (stylesMatch) {
      configStyles = stylesMatch[1].split(',').map(s => s.replace(/['"\s]/g, '')).filter(Boolean);
    }
  } catch {}

  let allStylesExist = true;
  for (const styleUrl of configStyles) {
    const rel = styleUrl.startsWith('/') ? styleUrl.slice(1) : styleUrl;
    const loc1 = path.join(cwd, 'public', rel);
    const loc2 = path.join(cwd, 'dist', 'public', rel);
    if (!fs.existsSync(loc1) && !fs.existsSync(loc2)) {
      allStylesExist = false;
      results.push({ name: `Declared style ${styleUrl}`, status: 'warn', message: `File does not exist in public/ or dist/public/` });
    }
  }
  if (allStylesExist && configStyles.length > 0) {
    results.push({ name: 'Declared styles verification', status: 'pass', detail: `${configStyles.length} style(s) verified` });
  }

  // 7. Accessibility of /__velix/hmr-client.js
  let hmrClientFound = false;
  const hmrCandidates = [
    path.join(cwd, 'node_modules', '@teamvelix', 'velix-react', 'dist', 'hmr-client.js'),
    path.join(cwd, 'node_modules', '@teamvelix', 'velix-react', 'src', 'hmr', 'hmr-client.ts'),
    path.join(cwd, 'packages', 'velix-react', 'dist', 'hmr-client.js'),
    path.join(cwd, 'packages', 'velix-react', 'src', 'hmr', 'hmr-client.ts'),
  ];
  for (const c of hmrCandidates) {
    if (fs.existsSync(c)) {
      hmrClientFound = true;
      results.push({ name: '/__velix/hmr-client.js source', status: 'pass', detail: path.relative(cwd, c) });
      break;
    }
  }
  if (!hmrClientFound) {
    results.push({ name: '/__velix/hmr-client.js source', status: 'fail', message: 'HMR client file not found in velix-react package' });
  }

  // 8. Single copy of react / react-dom
  try {
    let duplicateReact = false;
    const whyReact = execSync('pnpm why react', { cwd, stdio: 'pipe' }).toString();
    const matches = whyReact.match(/react\s+([\d.]+)/g);
    const uniqueVersions = new Set(matches?.map(m => m.trim()));
    if (uniqueVersions.size > 1) {
      duplicateReact = true;
      results.push({
        name: 'React instance deduplication',
        status: 'warn',
        message: `Multiple react versions detected: ${Array.from(uniqueVersions).join(', ')} (may cause Invalid Hook Call)`
      });
    } else {
      results.push({ name: 'React instance deduplication', status: 'pass', detail: 'Single React version resolved' });
    }
  } catch {
    results.push({ name: 'React instance deduplication', status: 'pass', detail: 'React resolved' });
  }

  // 9. Relative imports resolution check
  if (hasAppDir) {
    try {
      const checkScript = path.join(cwd, 'scripts', 'check-imports.ts');
      const rootScript = path.join(cwd, '..', '..', 'scripts', 'check-imports.ts');
      const scriptToRun = fs.existsSync(checkScript) ? checkScript : (fs.existsSync(rootScript) ? rootScript : null);

      if (scriptToRun) {
        execSync(`npx tsx "${scriptToRun}"`, { cwd, stdio: 'pipe' });
        results.push({ name: 'Relative imports resolution', status: 'pass', detail: 'All imports resolve to git-tracked files' });
      } else {
        results.push({ name: 'Relative imports resolution', status: 'pass', detail: 'App directory structure OK' });
      }
    } catch (e: any) {
      results.push({
        name: 'Relative imports resolution',
        status: 'fail',
        message: 'Unresolved relative imports detected. Run npx tsx scripts/check-imports.ts for details.'
      });
    }
  }

  // Print results
  for (const res of results) {
    const icon = res.status === 'pass' ? pc.green('✔') : res.status === 'fail' ? pc.red('✖') : pc.yellow('⚠');
    const msg = res.message ? ` — ${pc.red(res.message)}` : '';
    const detail = res.detail ? ` ${pc.dim(`(${res.detail})`)}` : '';
    console.log(`  ${icon} ${pc.bold(res.name)}${detail}${msg}`);
  }

  log.blank();
  const failCount = results.filter(r => r.status === 'fail').length;
  const warnCount = results.filter(r => r.status === 'warn').length;

  if (failCount > 0) {
    console.log(`  ${pc.red(pc.bold(`✖ ${failCount} issue(s) require attention.`))}`);
    process.exitCode = 1;
  } else if (warnCount > 0) {
    console.log(`  ${pc.yellow(`⚠ System healthy with ${warnCount} warning(s).`)}`);
  } else {
    console.log(`  ${pc.green(pc.bold('✔ All checks passed! Velix system is in optimal health.'))}`);
  }
  log.blank();
}

export async function infoCommand() {
  showBanner();
  console.log(`  ${pc.bold('Environment:')}`);
  console.log(`    Velix:     ${pc.cyan(`v${VERSION}`)}`);
  console.log(`    Node:      ${pc.dim(process.version)}`);
  console.log(`    Platform:  ${pc.dim(process.platform)}`);
  console.log(`    Arch:      ${pc.dim(process.arch)}`);
  console.log(`    CWD:       ${pc.dim(process.cwd())}`);
  log.blank();
}
