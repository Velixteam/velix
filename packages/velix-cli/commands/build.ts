/**
 * `velix build` — Build for production
 */
import fs from 'fs';
import path from 'path';
import { showBanner, log } from './shared.js';

export async function buildCommand() {
  showBanner();
  log.info('Building for production...');

  const { spawn } = await import('child_process');

  const cwd = process.cwd();
  const candidates = [
    path.join(cwd, 'node_modules', '@teamvelix', 'velix', 'dist', 'runtime', 'start-build.js'),
    path.join(cwd, 'packages', 'velix', 'dist', 'runtime', 'start-build.js'),
    path.join(cwd, 'packages', 'velix', 'runtime', 'start-build.ts'),
  ];

  const buildScript = candidates.find(c => fs.existsSync(c));
  if (!buildScript) {
    log.error('Could not find Velix runtime. Run `npm install` first.');
    process.exit(1);
  }

  const child = spawn(`npx tsx "${buildScript}"`, {
    stdio: 'inherit', cwd, shell: true,
  });

  child.on('error', (err) => {
    log.error(`Failed to build: ${err.message}`);
    process.exit(1);
  });
}

/**
 * `velix start` — Start production server
 */
export async function startCommand() {
  showBanner();
  log.info('Starting production server...');

  const { spawn } = await import('child_process');

  const cwd = process.cwd();
  const candidates = [
    path.join(cwd, 'node_modules', '@teamvelix', 'velix', 'dist', 'runtime', 'start-prod.js'),
    path.join(cwd, 'packages', 'velix', 'dist', 'runtime', 'start-prod.js'),
    path.join(cwd, 'packages', 'velix', 'runtime', 'start-prod.ts'),
  ];

  const prodScript = candidates.find(c => fs.existsSync(c));
  if (!prodScript) {
    log.error('Could not find Velix runtime. Run `npm install` first.');
    process.exit(1);
  }

  const child = spawn(`npx tsx "${prodScript}"`, {
    stdio: 'inherit', cwd, shell: true,
  });

  child.on('error', (err) => {
    log.error(`Failed to start production server: ${err.message}`);
    process.exit(1);
  });
}
