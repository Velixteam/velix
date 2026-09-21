import fs from 'fs';
import path from 'path';
import pc from 'picocolors';
import { showBanner, log } from './shared.js';

export async function analyzeCommand() {
  showBanner();
  log.info('Analyzing project build bundles...');

  const projectRoot = process.cwd();
  const distDir = path.join(projectRoot, 'dist');
  const velixDir = path.join(projectRoot, '.velix');

  const targetDir = fs.existsSync(distDir) ? distDir : (fs.existsSync(velixDir) ? velixDir : null);

  if (!targetDir) {
    log.error('No build output found. Please run `velix build` before analyzing.');
    process.exit(1);
  }

  const files: { path: string; size: number; isJs: boolean }[] = [];

  function scan(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scan(full);
      } else if (entry.isFile()) {
        const stats = fs.statSync(full);
        files.push({
          path: path.relative(projectRoot, full),
          size: stats.size,
          isJs: /\.(mjs|js|cjs)$/.test(entry.name),
        });
      }
    }
  }

  scan(targetDir);

  const jsFiles = files.filter(f => f.isJs).sort((a, b) => b.size - a.size);
  const totalJsSize = jsFiles.reduce((acc, f) => acc + f.size, 0);

  console.log('\n' + pc.bold('=== Bundle Analysis Report ===') + '\n');
  console.log(`  ${pc.bold('Target Directory:')} ${path.relative(projectRoot, targetDir)}`);
  console.log(`  ${pc.bold('Total JS Bundle Size:')} ${(totalJsSize / 1024).toFixed(2)} KB\n`);

  console.log(pc.bold('  Top JavaScript Assets:'));
  jsFiles.slice(0, 10).forEach(file => {
    const kb = (file.size / 1024).toFixed(2);
    console.log(`    ${pc.cyan(file.path.padEnd(45))} ${pc.yellow(kb + ' KB')}`);
  });

  console.log('\n' + pc.bold('=== Optimization Recommendations ==='));
  if (totalJsSize > 500 * 1024) {
    console.log(`  ${pc.yellow('⚠ Total bundle exceeds 500 KB.')} Consider using dynamic imports or Islands for heavy components.`);
  } else {
    console.log(`  ${pc.green('✓ Bundle size is within recommended limits.')}`);
  }
  console.log('');
}
