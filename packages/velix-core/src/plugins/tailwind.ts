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
 */
function detectTailwindCli(projectRoot: string): { cmd: string; isNpx: boolean } {
  const binDir = path.join(projectRoot, 'node_modules', '.bin');

  // v4 local binary
  const v4Local = path.join(binDir, '@tailwindcss', 'cli');
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
 * Check if compiled CSS contains @import rules after standard style rules.
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

export function compileTailwindHashed(
  projectRoot: string,
  options: TailwindPluginOptions & { outDir?: string } = {}
): { hashedFileName: string; hashedUrl: string; hash: string; outputPath: string } {
  const rawInput = options.input ?? './app/globals.css';
  const input = path.resolve(projectRoot, rawInput);
  const outDir = options.outDir ? path.resolve(projectRoot, options.outDir) : path.join(projectRoot, 'dist');
  const distPublic = path.join(outDir, 'public');

  if (!fs.existsSync(input)) {
    const msg = `[velix:tailwind] build: input file not found: ${input}`;
    logger.error(msg);
    throw new Error(msg);
  }

  const { cmd } = detectTailwindCli(projectRoot);
  fs.mkdirSync(distPublic, { recursive: true });

  // Compile to a temporary file in distPublic
  const tempOutput = path.join(distPublic, `.temp-tailwind-${Date.now()}.css`);

  let command = `${cmd} -i "${input}" -o "${tempOutput}"`;
  if (options.minify !== false) command += ' --minify';

  const result = spawnSync(command, {
    stdio: 'pipe',
    cwd: projectRoot,
    shell: true,
  });

  const stderr = result.stderr?.toString().trim() || '';
  const stdout = result.stdout?.toString().trim() || '';

  if (result.status !== 0 || result.error) {
    if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
    logger.error(
      `[velix:tailwind] build failed (exit ${result.status ?? 'signal'}):\n` +
      (stderr || stdout || result.error?.message || '(no output)')
    );
    throw result.error ?? new Error(`Tailwind exited with code ${result.status}: ${stderr || stdout}`);
  }

  assertOutputExists(tempOutput, 'build');
  checkMisplacedImports(tempOutput);

  const cssContent = fs.readFileSync(tempOutput);
  const hash = crypto.createHash('sha256').update(cssContent).digest('hex').slice(0, 8);
  const hashedFileName = `tailwind.${hash}.css`;
  const hashedOutput = path.join(distPublic, hashedFileName);

  fs.renameSync(tempOutput, hashedOutput);

  logger.success(`Tailwind CSS built & hashed → ${path.relative(projectRoot, hashedOutput)}`);

  return {
    hashedFileName,
    hashedUrl: `/${hashedFileName}`,
    hash,
    outputPath: hashedOutput,
  };
}

export default function tailwindPlugin(options: TailwindPluginOptions = {}) {
  const rawInput  = options.input  ?? './app/globals.css';
  const rawOutput = options.output ?? './public/tailwind.css';

  let cliResolved: ReturnType<typeof detectTailwindCli> | null = null;

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
      [PluginHooks.CONFIG]: () => {
        // No-op: styles are managed deterministically via the manifest
      },

      [PluginHooks.BUILD_START]: async () => {
        const projectRoot = process.cwd();
        compileTailwindHashed(projectRoot, {
          input: rawInput,
          minify: options.minify,
          outDir: 'dist',
        });
      },

      [PluginHooks.SERVER_START]: async (context: { config: import('../config.js').VelixConfig; isDev: boolean; projectRoot: string }, isDev: boolean) => {
        if (!isDev) return;

        const projectRoot = context.projectRoot || process.cwd();
        const { input, output } = resolvePaths(projectRoot);
        const { cmd } = getCli(projectRoot);

        if (!fs.existsSync(input)) {
          logger.warn(`[velix:tailwind] dev: input file not found: ${input} — skipping watcher`);
          return;
        }

        fs.mkdirSync(path.dirname(output), { recursive: true });

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

        const watcher = spawn(`${cmd} -i "${input}" -o "${output}" --watch`, {
          stdio: ['ignore', 'pipe', 'pipe'],
          cwd: projectRoot,
          shell: true,
        });

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
