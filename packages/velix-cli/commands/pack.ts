/**
 * `velix pack` — Velix Pack diagnostic & build command
 */
import { showBanner, log } from './shared.js';
import pc from 'picocolors';

export async function packCommand(args: string[]) {
  showBanner();
  log.info('Running Velix Pack Beta engine...');

  const isAnalyze = args.includes('--analyze');
  const isDebug = args.includes('--debug');
  const isProfile = args.includes('--profile');

  try {
    const { VelixPack, formatBuildStats } = await import('@teamvelix/velix-pack');

    const pack = new VelixPack({
      projectRoot: process.cwd(),
      mode: 'production',
    });

    const stats = await pack.build();

    if (isAnalyze || isProfile || isDebug) {
      console.log('\n' + formatBuildStats(stats) + '\n');
    } else {
      log.success(`Velix Pack build finished in ${(stats.duration / 1000).toFixed(2)}s`);
      console.log(pc.dim(`Modules: ${stats.modulesCount} | Chunks: ${stats.chunksCount} | Cache hits: ${stats.cacheHits}`));
    }
  } catch (err: any) {
    log.error(`Velix Pack failed: ${err?.message || String(err)}`);
    process.exit(1);
  }
}
