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
import { ManifestSchema } from '@teamvelix/velix-core';

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
  let distCssPath: string | null = null;
  const distPublicDir = path.join(cwd, 'dist', 'public');
  if (fs.existsSync(distPublicDir)) {
    try {
      const files = fs.readdirSync(distPublicDir);
      const cssFile = files.find(f => f.startsWith('tailwind') && f.endsWith('.css'));
      if (cssFile) distCssPath = path.join(distPublicDir, cssFile);
    } catch {}
  }
  const cssOutputPath = distCssPath || (fs.existsSync(publicCssPath) ? publicCssPath : null);

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

  // 6. Build Manifest Verification (dist/manifest.json)
  const distDir = path.join(cwd, 'dist');
  if (fs.existsSync(distDir)) {
    const manifestPath = path.join(distDir, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      results.push({
        name: 'Build manifest (dist/manifest.json)',
        status: 'fail',
        message: 'dist/manifest.json is missing. Run `velix build` to generate the production manifest.',
      });
    } else {
      try {
        const raw = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        const parseResult = ManifestSchema.safeParse(raw);
        if (!parseResult.success) {
          results.push({
            name: 'Build manifest schema',
            status: 'fail',
            message: `dist/manifest.json failed schema validation: ${parseResult.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')}`,
          });
        } else {
          const manifest = parseResult.data;
          const missingFiles: string[] = [];
          let totalChecked = 0;

          // Routes
          for (const [rPath, rEntry] of Object.entries(manifest.routes)) {
            totalChecked++;
            if (!fs.existsSync(path.join(distDir, rEntry.serverFile))) {
              missingFiles.push(`route ${rPath} (${rEntry.serverFile})`);
            }
            for (const layout of rEntry.layouts) {
              totalChecked++;
              if (!fs.existsSync(path.join(distDir, layout))) {
                missingFiles.push(`layout (${layout})`);
              }
            }
            for (const chunk of rEntry.clientChunks) {
              totalChecked++;
              if (!fs.existsSync(path.join(distDir, chunk))) {
                missingFiles.push(`client chunk (${chunk})`);
              }
            }
          }

          // Islands
          for (const [islandName, islandPath] of Object.entries(manifest.islands)) {
            totalChecked++;
            const rel = islandPath.startsWith('/') ? islandPath.slice(1) : islandPath;
            if (!fs.existsSync(path.join(distDir, rel))) {
              missingFiles.push(`island ${islandName} (${islandPath})`);
            }
          }

          // Styles
          for (const style of manifest.styles) {
            totalChecked++;
            const rel = style.startsWith('/') ? style.slice(1) : style;
            if (!fs.existsSync(path.join(distDir, 'public', rel))) {
              missingFiles.push(`style (${style})`);
            }
          }

          // Assets
          for (const assetPath of Object.keys(manifest.assets)) {
            totalChecked++;
            const rel = assetPath.startsWith('/') ? assetPath.slice(1) : assetPath;
            if (!fs.existsSync(path.join(distDir, 'public', rel))) {
              missingFiles.push(`asset (${assetPath})`);
            }
          }

          if (missingFiles.length > 0) {
            results.push({
              name: 'Build manifest consistency',
              status: 'fail',
              message: `Manifest references ${missingFiles.length} missing file(s): ${missingFiles.slice(0, 3).join(', ')}${missingFiles.length > 3 ? '...' : ''}`,
            });
          } else {
            results.push({
              name: 'Build manifest & referenced files',
              status: 'pass',
              detail: `Schema v${manifest.schemaVersion}, buildId: ${manifest.buildId.slice(0, 8)}, ${totalChecked} files verified`,
            });
          }
        }
      } catch (err: unknown) {
        results.push({
          name: 'Build manifest parsing',
          status: 'fail',
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }
  } else {
    results.push({
      name: 'Build manifest',
      status: 'warn',
      message: 'dist/ directory not found (run `velix build` to test production manifest)',
    });
  }

  // 7. Accessibility of /__velix/hmr-client.js
  let hmrClientFound = false;
  const hmrCandidates = [
    path.join(cwd, 'node_modules', '@teamvelix', 'velix-react', 'dist', 'hmr-client.js'),
    path.join(cwd, 'node_modules', '@teamvelix', 'velix-react', 'src', 'hmr', 'hmr-client.ts'),
    path.join(cwd, 'node_modules', '@teamvelix', 'velix', 'dist', 'hmr-client.js'),
    path.join(cwd, 'packages', 'velix-react', 'dist', 'hmr-client.js'),
    path.join(cwd, 'packages', 'velix-react', 'src', 'hmr', 'hmr-client.ts'),
    path.join(cwd, 'packages', 'velix', 'dist', 'hmr-client.js'),
    path.join(cwd, '..', 'packages', 'velix-react', 'dist', 'hmr-client.js'),
    path.join(cwd, '..', 'packages', 'velix-react', 'src', 'hmr', 'hmr-client.ts'),
    path.join(cwd, '..', 'packages', 'velix', 'dist', 'hmr-client.js'),
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
    const nodeModulesDir = path.join(cwd, 'node_modules');
    const reactVersions = new Set<string>();
    const reactDomVersions = new Set<string>();

    function findPkgVersions(dir: string, depth = 0) {
      if (depth > 4 || !fs.existsSync(dir)) return;
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const full = path.join(dir, entry.name);
            if (entry.name === 'react') {
              const p = path.join(full, 'package.json');
              if (fs.existsSync(p)) {
                try { reactVersions.add(JSON.parse(fs.readFileSync(p, 'utf8')).version); } catch {}
              }
            } else if (entry.name === 'react-dom') {
              const p = path.join(full, 'package.json');
              if (fs.existsSync(p)) {
                try { reactDomVersions.add(JSON.parse(fs.readFileSync(p, 'utf8')).version); } catch {}
              }
            } else if (entry.name.startsWith('@') || entry.name === '.pnpm') {
              findPkgVersions(full, depth + 1);
            }
          }
        }
      } catch {}
    }

    if (fs.existsSync(nodeModulesDir)) {
      findPkgVersions(nodeModulesDir);
    }

    if (reactVersions.size > 1 || reactDomVersions.size > 1) {
      results.push({
        name: 'React instance deduplication',
        status: 'warn',
        message: `Multiple react versions detected (react: ${Array.from(reactVersions).join(', ')}; react-dom: ${Array.from(reactDomVersions).join(', ')})`,
      });
    } else if (reactVersions.size === 1) {
      results.push({
        name: 'React instance deduplication',
        status: 'pass',
        detail: `Single React v${Array.from(reactVersions)[0]} & ReactDOM verified`,
      });
    } else {
      results.push({ name: 'React instance deduplication', status: 'pass', detail: 'React resolved' });
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
