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

        // Check if input file exists
        if (!fs.existsSync(input)) {
          logger.warn(`Tailwind input file not found: ${input}`);
          return;
        }

        // Ensure output directory exists
        const outputDir = path.dirname(output);
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        // Build initial CSS synchronously
        logger.info('Building initial Tailwind CSS...');
        try {
          const buildResult = spawnSync('npx', ['tailwindcss', '-i', input, '-o', output], {
            cwd: process.cwd(),
            stdio: 'pipe'
          });

          if (buildResult.error) {
            logger.error('Tailwind CSS not installed. Run: npm install -D tailwindcss');
            return;
          }

          if (buildResult.status !== 0) {
            const errorMsg = buildResult.stderr?.toString() || 'Unknown error';
            logger.error(`Tailwind build failed: ${errorMsg}`);
            return;
          }

          logger.success('Tailwind CSS built successfully');
        } catch (err: any) {
          logger.error('Failed to build Tailwind CSS', err);
          return;
        }

        // Start watcher
        logger.info('Starting Tailwind CSS watcher...');
        const watcher = spawn('npx', ['tailwindcss', '-i', input, '-o', output, '--watch'], {
          stdio: 'pipe',
          cwd: process.cwd(),
          shell: false
        });

        watcher.stdout.on('data', (data) => {
          const msg = data.toString().trim();
          if (msg && !msg.includes('Rebuilding...') && !msg.includes('Done in')) {
            logger.info(`Tailwind: ${msg}`);
          }
        });

        watcher.stderr.on('data', (data) => {
          const msg = data.toString().trim();
          if (msg && !msg.includes('warn')) {
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

        const cleanup = () => {
          if (watcher && !watcher.killed) {
            watcher.kill();
          }
        };

        process.on('exit', cleanup);
        process.on('SIGINT', cleanup);
        process.on('SIGTERM', cleanup);
      }
    }
  });
}
