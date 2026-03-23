/**
 * Velix v5 — Production Server
 * Start the production server
 */

import { createServer } from '../server/index.js';
import logger from '../logger.js';

async function startProd() {
  process.env.NODE_ENV = 'production';

  const projectRoot = process.cwd();

  await createServer({ projectRoot, mode: 'production' });

  // Graceful shutdown
  process.on('SIGINT', () => {
    logger.blank();
    logger.info('Shutting down...');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    logger.info('Received SIGTERM, shutting down gracefully...');
    process.exit(0);
  });
}

startProd().catch(err => {
  logger.error('Failed to start production server', err);
  process.exit(1);
});
