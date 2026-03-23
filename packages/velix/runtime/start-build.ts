/**
 * Velix v5 — Build Script
 * Build the application for production
 */

import { build } from '../build/index.js';
import logger from '../logger.js';

build().catch(err => {
  logger.error('Build failed', err);
  process.exit(1);
});
