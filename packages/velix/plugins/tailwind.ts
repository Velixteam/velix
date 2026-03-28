import { spawnSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { PluginHooks, definePlugin } from './index.js';
import logger from '../logger.js';

export interface TailwindPluginOptions {
  input?: string;
  output?: string;
  config?: string;
  minify?: boolean;
}

/**
 * Native Velix Tailwind CSS Plugin
 * Automatically handles CSS compilation and injection.
 */
export default function tailwindPlugin(options: TailwindPluginOptions = {}) {
  const input = options.input || './app/globals.css';
  const output = options.output || './public/tailwind.css';
  const configPath = options.config || './tailwind.config.ts';

  return definePlugin({
    name: 'velix:tailwind',
    hooks: {
      [PluginHooks.CONFIG]: (config: any) => {
        // Automatically ensure the output CSS is in the styles array
        const relativeOutput = output.startsWith('./') ? output.substring(1) : output;
        const stylePath = relativeOutput.startsWith('/public') ? relativeOutput.substring(7) : relativeOutput;
        
        if (!config.styles) config.styles = [];
        if (!config.styles.includes(stylePath)) {
          config.styles.push(stylePath);
        }
      },

      [PluginHooks.BUILD_START]: async () => {
        logger.info('Building Tailwind CSS...');
        try {
          const args = ['tailwindcss', '-i', input, '-o', output];
          if (options.minify !== false) args.push('--minify');
          spawnSync('npx', args, { 
            stdio: 'inherit',
            cwd: process.cwd()
          });
          logger.success('Tailwind CSS built successfully');
        } catch (err: any) {
          logger.error('Tailwind build failed', err);
        }
      },

      [PluginHooks.SERVER_START]: async (server: any, isDev: boolean) => {
        if (!isDev) return;

        logger.info('Starting Tailwind CSS watcher...');
        const watcher = spawn('npx', ['tailwindcss', '-i', input, '-o', output, '--watch'], {
          stdio: 'pipe',
          cwd: process.cwd()
        });

        watcher.stdout.on('data', (data) => {
          const msg = data.toString().trim();
          if (msg && !msg.includes('Rebuilding...') && !msg.includes('Done in')) {
            logger.info(`Tailwind: ${msg}`);
          }
        });

        watcher.stderr.on('data', (data) => {
          const msg = data.toString().trim();
          if (msg) {
            logger.warn(`Tailwind: ${msg}`);
          }
        });

        watcher.on('error', (err) => {
          logger.error('Tailwind watcher error', err);
        });

        watcher.on('exit', (code) => {
          if (code !== 0 && code !== null) {
            logger.error(`Tailwind watcher exited with code ${code}`);
          }
        });

        process.on('exit', () => watcher.kill());
        process.on('SIGINT', () => watcher.kill());
        process.on('SIGTERM', () => watcher.kill());
      }
    }
  });
}
