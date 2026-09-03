/**
 * Velix v5 — Build Script
 * Build the application for production
 */

import { build } from '../build/index.js';
import logger from '../logger.js';

async function runBuild() {
  const isPack = process.argv.includes('--pack');
  if (isPack) {
    try {
      const { VelixPack, formatBuildStats } = await import('@teamvelix/velix-pack');
      const pack = new VelixPack({ projectRoot: process.cwd(), mode: 'production', minify: true });
      const stats = await pack.build();
      console.log('\n' + formatBuildStats(stats) + '\n');
      return;
    } catch (err: any) {
      logger.warn(`Velix Pack build failed, falling back to standard build: ${err.message}`);
    }
  }

  await build();
}

runBuild().catch(err => {
  logger.error('Build failed', err);
  process.exit(1);
});
