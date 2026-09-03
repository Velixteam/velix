/**
 * Velix v5 — Development Server
 * Start the dev server with hot reload
 */

import { createServer } from '../server/index.js';
import chokidar from 'chokidar';
import path from 'path';
import logger from '../logger.js';

async function startDev() {
  const projectRoot = process.cwd();
  const mode = 'development';

  process.env.NODE_ENV = 'development';

  const { server, config } = await createServer({ projectRoot, mode });

  const isPack = process.argv.includes('--pack');
  let packInstance: any = null;

  if (isPack) {
    try {
      const { VelixPack } = await import('@teamvelix/velix-pack');
      packInstance = new VelixPack({ projectRoot, mode: 'development' });
      const stats = await packInstance.build();
      logger.success(`Velix Pack initialized (${stats.modulesCount} modules, ${stats.chunksCount} chunks, ${(stats.duration / 1000).toFixed(2)}s)`);
      packInstance.watch((affected: string[]) => {
        logger.info(`Velix Pack incremental rebuild: ${affected.length} modules affected`);
      });
    } catch (e: any) {
      logger.warn(`Velix Pack initialization fallback: ${e.message}`);
    }
  }

  // Watch for file changes
  const appDir = path.join(projectRoot, 'app');
  const serverDir = path.join(projectRoot, 'server');

  const watcher = chokidar.watch([appDir, serverDir], {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: true,
  });

  watcher.on('change', (filePath) => {
    const relative = path.relative(projectRoot, filePath);
    logger.hmr(relative);
    if ((server as unknown as { broadcastHMR?: (msg: any) => void }).broadcastHMR) {
      (server as unknown as { broadcastHMR: (msg: any) => void }).broadcastHMR({ type: 'full-reload' });
    }
  });

  watcher.on('add', (filePath) => {
    const relative = path.relative(projectRoot, filePath);
    logger.info(`New file: ${relative}`);
  });

  watcher.on('unlink', (filePath) => {
    const relative = path.relative(projectRoot, filePath);
    logger.warn(`Removed: ${relative}`);
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    logger.blank();
    logger.info('Shutting down...');
    watcher.close();
    server.close();
    process.exit(0);
  });
}

startDev().catch(err => {
  logger.error('Failed to start dev server', err);
  process.exit(1);
});
