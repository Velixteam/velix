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
    if ((server as any).broadcastHMR) {
      (server as any).broadcastHMR('reload');
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
