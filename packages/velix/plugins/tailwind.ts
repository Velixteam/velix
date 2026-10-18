import { spawnSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { PluginHooks, definePlugin } from './index.js';
import logger from '../logger.js';

export interface TailwindPluginOptions {
  input?: string;
  output?: string;
  config?: string;
  minify?: boolean;
}

/**
 * Locate the Tailwind CLI binary from projectRoot's node_modules.
 *
 * Resolution order:
 *   1. node_modules/.bin/@tailwindcss/cli  (v4 – local, fastest)
 *   2. node_modules/.bin/tailwindcss        (v3 – local)
 *   3. npx @tailwindcss/cli                 (v4 – network fallback, slow)
 *   4. npx tailwindcss                      (v3 – network fallback, slow)
 *
 * Using the local binary avoids the ~30 s npx startup penalty on
 * Windows/pnpm and the silent 15 s timeout that used to fall back to v3.
 */
function detectTailwindCli(projectRoot: string): { cmd: string; isNpx: boolean } {
  const binDir = path.join(projectRoot, 'node_modules', '.bin');

  // v4 local binary
  const v4Local = path.join(binDir, '@tailwindcss', 'cli');
  // pnpm stores binaries flat, so also try the flat name
  const v4LocalFlat = path.join(binDir, 'tailwindcss-v4');
  for (const p of [v4Local, v4LocalFlat]) {
    if (fs.existsSync(p)) return { cmd: p, isNpx: false };
  }

  // v3 local binary
  const v3Local = path.join(binDir, 'tailwindcss');
  if (fs.existsSync(v3Local)) return { cmd: v3Local, isNpx: false };

  // npx fallbacks (slow, log a warning)
  const v4npx = spawnSync('npx --no-warnings @tailwindcss/cli --help', {
    stdio: 'pipe',
    timeout: 15000,
    shell: true,
    cwd: projectRoot,
  });
  if (v4npx.status === 0) {
    logger.warn(
      'Tailwind: using npx @tailwindcss/cli (slow). ' +
      'Install @tailwindcss/cli as a local dependency to speed up builds.'
    );
    return { cmd: 'npx --no-warnings @tailwindcss/cli', isNpx: true };
  }

  logger.warn(
    'Tailwind: falling back to npx tailwindcss (v3). ' +
    'Install tailwindcss as a local dependency for faster builds.'
  );
  return { cmd: 'npx --no-warnings tailwindcss', isNpx: true };
}

/**
 * Verify that the compiled output file exists and is not empty.
 * Fails loudly (throws) if it is missing or zero bytes.
 */
function assertOutputExists(outputPath: string, context: 'build' | 'dev') {
  if (!fs.existsSync(outputPath)) {
    const msg = `[velix:tailwind] ${context}: output file not created: ${outputPath}`;
    logger.error(msg);
    throw new Error(msg);
  }
  const stat = fs.statSync(outputPath);
  if (stat.size === 0) {
    const msg = `[velix:tailwind] ${context}: output file is empty (0 bytes): ${outputPath}`;
    logger.error(msg);
    throw new Error(msg);
  }
}

/**
 * Native Velix Tailwind CSS Plugin
 *
 * Handles CSS compilation and injection. Supports Tailwind v3 and v4.
 *
 * Improvements over the previous version:
 * - Resolves local node_modules/.bin binary first (no 30 s npx penalty).
 * - `input` and `output` are resolved from `projectRoot`, not `process.cwd()`.
 * - Emits full stderr on failure, not just the first line.
 * - `velix build` fails (throws) if the output file is missing or empty.
 * - No duplicate with velix-core — this file is the single source of truth.
 */
function checkMisplacedImports(outputPath: string) {
  try {
    const content = fs.readFileSync(outputPath, 'utf8');
    const lines = content.split('\n');
    let seenRule = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('/*') || line.startsWith('*') || line.startsWith('@layer') || line.startsWith('@charset')) {
        continue;
      }
      if (line.startsWith('@import')) {
        if (seenRule) {
          logger.warn(
            `[velix:tailwind] Misplaced @import at line ${i + 1} of ${path.basename(outputPath)}:\n` +
            `  ${line}\n` +
            `  CSS @import rules must precede all other rules in a stylesheet.\n` +
            `  Browsers ignore @import that appear after style rules. Move fonts/external CSS to <link> in layout.tsx.`
          );
          break;
        }
      } else {
        seenRule = true;
      }
    }
  } catch {}
}

export default function tailwindPlugin(options: TailwindPluginOptions = {}) {
  const rawInput  = options.input  ?? './app/globals.css';
  const rawOutput = options.output ?? './public/tailwind.css';

  let cliResolved: ReturnType<typeof detectTailwindCli> | null = null;
  let activeConfig: import('../config.js').VelixConfig | null = null;

  function getCli(projectRoot: string) {
    if (!cliResolved) cliResolved = detectTailwindCli(projectRoot);
    return cliResolved;
  }

  /** Resolve input/output relative to projectRoot (never process.cwd()) */
  function resolvePaths(projectRoot: string) {
    const input  = path.resolve(projectRoot, rawInput);
    const output = path.resolve(projectRoot, rawOutput);
    return { input, output };
  }

  return definePlugin({
    name: 'velix:tailwind',
    hooks: {
      [PluginHooks.CONFIG]: (configArg: unknown) => {
        const config = configArg as import('../config.js').VelixConfig;
        activeConfig = config;
        // Ensure the compiled CSS is in the styles array so Velix injects
        // a <link> for it. Derive the URL path from rawOutput.
        const relOut = rawOutput.replace(/^\.\//, '').replace(/^public\//, '');
        const stylePath = relOut.startsWith('/') ? relOut : `/${relOut}`;
        if (!config.styles) config.styles = [];
        if (!config.styles.includes(stylePath)) {
          config.styles.push(stylePath);
        }
      },

      [PluginHooks.BUILD_START]: async (configArg: unknown, projectRoot_: unknown) => {
        const projectRoot = (projectRoot_ as string) || process.cwd();
        const config = (configArg as import('../config.js').VelixConfig) || activeConfig;
        const { input, output } = resolvePaths(projectRoot);
        const { cmd } = getCli(projectRoot);

        logger.info('Building Tailwind CSS (production)…');

        if (!fs.existsSync(input)) {
          const msg = `[velix:tailwind] build: input file not found: ${input}`;
          logger.error(msg);
          throw new Error(msg);
        }

        // Ensure output directory exists
        fs.mkdirSync(path.dirname(output), { recursive: true });

        let command = `${cmd} -i "${input}" -o "${output}"`;
        if (options.minify !== false) command += ' --minify';

        const result = spawnSync(command, {
          stdio: 'pipe',
          cwd: projectRoot,
          shell: true,
        });

        const stderr = result.stderr?.toString().trim() || '';
        const stdout = result.stdout?.toString().trim() || '';

        if (result.status !== 0 || result.error) {
          // Full stderr — no more silent swallowing
          logger.error(
            `[velix:tailwind] build failed (exit ${result.status ?? 'signal'}):\n` +
            (stderr || stdout || result.error?.message || '(no output)')
          );
          throw result.error ?? new Error(`Tailwind exited with code ${result.status}`);
        }

        // Verify output exists and is non-empty
        assertOutputExists(output, 'build');
        checkMisplacedImports(output);

        // Generate hashed copy for production cache-busting
        try {
          const cssContent = fs.readFileSync(output);
          const hash = crypto.createHash('md5').update(cssContent).digest('hex').slice(0, 8);
          const ext = path.extname(output);
          const baseName = path.basename(output, ext);
          const hashedFileName = `${baseName}.${hash}${ext}`;
          const hashedOutput = path.join(path.dirname(output), hashedFileName);
          fs.writeFileSync(hashedOutput, cssContent);

          const relOut = rawOutput.replace(/^\.\//, '').replace(/^public\//, '');
          const unhashedStyle = relOut.startsWith('/') ? relOut : `/${relOut}`;
          const hashedStyle = path.posix.join(path.posix.dirname(unhashedStyle), hashedFileName);

          if (config && config.styles) {
            const idx = config.styles.indexOf(unhashedStyle);
            if (idx !== -1) {
              config.styles[idx] = hashedStyle;
            } else if (!config.styles.includes(hashedStyle)) {
              config.styles.push(hashedStyle);
            }
          }
          logger.success(`Tailwind CSS built & hashed → ${path.relative(projectRoot, hashedOutput)}`);
        } catch (err: any) {
          logger.warn(`[velix:tailwind] could not generate hashed CSS: ${err?.message}`);
        }
      },

      [PluginHooks.SERVER_START]: async (server: unknown, isDevArg: unknown, projectRoot_: unknown) => {
        const isDev = isDevArg as boolean;
        if (!isDev) return;

        const projectRoot = (projectRoot_ as string) || process.cwd();
        const { input, output } = resolvePaths(projectRoot);
        const { cmd } = getCli(projectRoot);

        if (!fs.existsSync(input)) {
          logger.warn(`[velix:tailwind] dev: input file not found: ${input} — skipping watcher`);
          return;
        }

        // Ensure output directory exists
        fs.mkdirSync(path.dirname(output), { recursive: true });

        // Initial synchronous build
        logger.info('Building Tailwind CSS (initial dev build)…');
        const buildResult = spawnSync(`${cmd} -i "${input}" -o "${output}"`, {
          cwd: projectRoot,
          stdio: 'pipe',
          shell: true,
        });

        if (buildResult.status !== 0) {
          const stderr = buildResult.stderr?.toString().trim() || '';
          logger.error(
            `[velix:tailwind] initial build failed:\n${stderr || buildResult.error?.message || '(no output)'}`
          );
        } else {
          assertOutputExists(output, 'dev');
          checkMisplacedImports(output);
          logger.success(`Tailwind CSS built → ${path.relative(projectRoot, output)}`);
        }

        // Start watcher (pipe stderr to surface build errors in dev)
        const watcher = spawn(`${cmd} -i "${input}" -o "${output}" --watch`, {
          stdio: ['ignore', 'pipe', 'pipe'],
          cwd: projectRoot,
          shell: true,
        });

        // Suppress verbose "Rebuilding…" / "Done" lines but surface real errors
        watcher.stdout?.on('data', () => {});
        watcher.stderr?.on('data', (chunk: Buffer) => {
          const msg = chunk.toString().trim();
          if (msg && !msg.startsWith('Rebuilding') && !msg.startsWith('Done')) {
            logger.warn(`[velix:tailwind] watcher: ${msg}`);
          }
        });

        watcher.on('error', (err) => {
          logger.error('[velix:tailwind] watcher process error', err);
        });

        watcher.on('exit', (code, signal) => {
          if (code !== 0 && code !== null) {
            logger.error(`[velix:tailwind] watcher exited unexpectedly (code ${code}, signal ${signal})`);
          }
        });

        const cleanup = () => {
          if (!watcher.killed) watcher.kill();
        };
        process.on('exit', cleanup);
        process.on('SIGINT', cleanup);
        process.on('SIGTERM', cleanup);
      },
    },
  });
}
