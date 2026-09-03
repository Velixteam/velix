/**
 * `velix dev` — Start development server
 */
import fs from 'fs';
import path from 'path';
import { showBanner, log } from './shared.js';

export async function devCommand() {
  const args = process.argv.slice(2);
  const isPack = args.includes('--pack');

  showBanner();
  log.info(`Starting development server${isPack ? ' with Velix Pack Beta' : ''}...`);

  const { spawn } = await import('child_process');

  const cwd = process.cwd();
  const candidates = [
    path.join(cwd, 'node_modules', '@teamvelix', 'velix', 'dist', 'runtime', 'start-dev.js'),
    path.join(cwd, 'packages', 'velix', 'dist', 'runtime', 'start-dev.js'),
    path.join(cwd, 'packages', 'velix', 'runtime', 'start-dev.ts'),
  ];

  const devScript = candidates.find(c => fs.existsSync(c));
  if (!devScript) {
    log.error('Could not find Velix runtime. Run `npm install` first.');
    process.exit(1);
  }

  const packFlag = isPack ? ' --pack' : '';
  const child = spawn(`npx tsx --no-cache "${devScript}"${packFlag}`, {
    stdio: 'inherit', cwd, shell: true,
  });

  child.on('error', (err) => {
    log.error(`Failed to start dev server: ${err.message}`);
    process.exit(1);
  });
}
