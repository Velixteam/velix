import { spawnSync, spawn, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { PluginHooks, definePlugin } from './index.js';
import logger from '../logger.js';

export interface TailwindPluginOptions {
  input?: string;
  output?: string;
  config?: string;
  minify?: boolean;
}

interface TailwindCli {
  bin: string;
  packageName: '@tailwindcss/cli' | 'tailwindcss';
}

/**
 * Resolve a project-local Tailwind CLI without invoking npx.
 * Walking node_modules supports npm, pnpm and nested dependency layouts.
 */
function resolveTailwindCli(projectRoot: string): TailwindCli {
  for (const packageName of ['@tailwindcss/cli', 'tailwindcss'] as const) {
    let directory = path.resolve(projectRoot);

    while (true) {
      const packageDirectory = path.join(directory, 'node_modules', packageName);
      const packageJsonPath = path.join(packageDirectory, 'package.json');

      if (fs.existsSync(packageJsonPath)) {
        try {
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
          const bin = typeof packageJson.bin === 'string'
            ? packageJson.bin
            : packageJson.bin?.tailwindcss ?? Object.values(packageJson.bin ?? {})[0];

          if (typeof bin === 'string') {
            const binPath = path.resolve(packageDirectory, bin);
            if (fs.existsSync(binPath)) {
              return { bin: binPath, packageName };
            }
          }
        } catch (error) {
          throw new Error(
            `[velix:tailwind] Cannot read ${packageJsonPath}: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }

      const parent = path.dirname(directory);
      if (parent === directory) break;
      directory = parent;
    }
  }

  throw new Error(
    '[velix:tailwind] No local Tailwind CLI found. Install Tailwind v4 with ' +
    '"pnpm add -D tailwindcss @tailwindcss/cli", or Tailwind v3 with "pnpm add -D tailwindcss". ' +
    'Velix does not download or execute packages through npx.'
  );
}

function cliArgs(
  cli: TailwindCli,
  input: string,
  output: string,
  options: TailwindPluginOptions,
  watch = false
): string[] {
  const args = [cli.bin, '-i', input, '-o', output];
  if (options.config) args.push('-c', path.resolve(options.config));
  if (options.minify !== false && !watch) args.push('--minify');
  if (watch) args.push('--watch');
  return args;
}

function runTailwind(
  projectRoot: string,
  cli: TailwindCli,
  input: string,
  output: string,
  options: TailwindPluginOptions,
  context: 'build' | 'dev'
): void {
  const result = spawnSync(
    process.execPath,
    cliArgs(cli, input, output, options),
    { cwd: projectRoot, encoding: 'utf8', timeout: 120_000, windowsHide: true }
  );

  if (result.error || result.status !== 0) {
    const details = [result.stderr, result.stdout, result.error?.message]
      .filter(Boolean).join('\n').trim();
    throw new Error(
      `[velix:tailwind] ${context} compilation failed using ${cli.packageName} ` +
      `(exit ${result.status ?? 'unknown'}):\n${details || 'No compiler output was provided.'}`
    );
  }

  if (!fs.existsSync(output) || fs.statSync(output).size === 0) {
    throw new Error(`[velix:tailwind] ${context} compiler produced no CSS output: ${output}`);
  }
}

/** Verify that compiled CSS does not contain @import after style rules. */
function checkMisplacedImports(outputPath: string): void {
  const lines = fs.readFileSync(outputPath, 'utf8').split('\n');
  let seenRule = false;

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index].trim();
    if (!line || line.startsWith('/*') || line.startsWith('*') ||
        line.startsWith('@layer') || line.startsWith('@charset')) continue;

    if (line.startsWith('@import')) {
      if (seenRule) {
        logger.warn(
          `[velix:tailwind] Misplaced @import at line ${index + 1} of ${path.basename(outputPath)}. ` +
          'CSS @import rules must precede all other rules.'
        );
        break;
      }
    } else {
      seenRule = true;
    }
  }
}

export function compileTailwindHashed(
  projectRoot: string,
  options: TailwindPluginOptions & { outDir?: string } = {}
): { hashedFileName: string; hashedUrl: string; hash: string; outputPath: string } {
  const input = path.resolve(projectRoot, options.input ?? './app/globals.css');
  const outDir = options.outDir
    ? path.resolve(projectRoot, options.outDir)
    : path.join(projectRoot, 'dist');
  const distPublic = path.join(outDir, 'public');

  if (!fs.existsSync(input)) {
    throw new Error(`[velix:tailwind] CSS input file not found: ${input}`);
  }

  const cli = resolveTailwindCli(projectRoot);
  fs.mkdirSync(distPublic, { recursive: true });

  // Unique temporary names avoid collisions between concurrent builds.
  const tempOutput = path.join(distPublic, `.tailwind-${crypto.randomUUID()}.tmp.css`);

  try {
    runTailwind(projectRoot, cli, input, tempOutput, options, 'build');
    checkMisplacedImports(tempOutput);

    const cssContent = fs.readFileSync(tempOutput);
    const hash = crypto.createHash('sha256').update(cssContent).digest('hex').slice(0, 8);
    const hashedFileName = `tailwind.${hash}.css`;
    const hashedOutput = path.join(distPublic, hashedFileName);

    // Identical CSS may already have been emitted by another build invocation.
    if (fs.existsSync(hashedOutput)) fs.unlinkSync(tempOutput);
    else fs.renameSync(tempOutput, hashedOutput);

    logger.success(`Tailwind CSS built → ${path.relative(projectRoot, hashedOutput)}`);
    return {
      hashedFileName,
      hashedUrl: `/${hashedFileName}`,
      hash,
      outputPath: hashedOutput,
    };
  } catch (error) {
    if (fs.existsSync(tempOutput)) fs.rmSync(tempOutput, { force: true });
    throw error;
  }
}

export default function tailwindPlugin(options: TailwindPluginOptions = {}) {
  const rawInput = options.input ?? './app/globals.css';
  const rawOutput = options.output ?? './public/tailwind.css';
  let watcher: ChildProcess | null = null;
  let cleanupRegistered = false;

  function cleanup(): void {
    if (watcher && !watcher.killed) watcher.kill();
    watcher = null;
  }

  return definePlugin({
    name: 'velix:tailwind',
    hooks: {
      [PluginHooks.CONFIG]: () => {
        // CSS output is registered by the framework build manifest.
      },

      // Production CSS is compiled centrally by packages/velix/build.
      // Keeping this hook empty prevents a second, conflicting compilation.
      [PluginHooks.BUILD_START]: async () => {},

      [PluginHooks.SERVER_START]: async (
        context: { config: import('../config.js').VelixConfig; isDev: boolean; projectRoot: string },
        isDev: boolean
      ) => {
        if (!isDev || watcher) return;

        const projectRoot = path.resolve(context.projectRoot || process.cwd());
        const input = path.resolve(projectRoot, rawInput);
        const output = path.resolve(projectRoot, rawOutput);

        if (!fs.existsSync(input)) {
          logger.warn(`[velix:tailwind] Dev CSS input not found: ${input}; watcher not started.`);
          return;
        }

        const cli = resolveTailwindCli(projectRoot);
        fs.mkdirSync(path.dirname(output), { recursive: true });

        logger.info('Building Tailwind CSS (initial dev build)…');
        runTailwind(projectRoot, cli, input, output, options, 'dev');
        checkMisplacedImports(output);
        logger.success(`Tailwind CSS built → ${path.relative(projectRoot, output)}`);

        watcher = spawn(
          process.execPath,
          cliArgs(cli, input, output, options, true),
          { cwd: projectRoot, stdio: ['ignore', 'ignore', 'pipe'], windowsHide: true }
        );

        watcher.stderr?.on('data', (chunk: Buffer) => {
          const message = chunk.toString().trim();
          if (message && !message.startsWith('Rebuilding') && !message.startsWith('Done')) {
            logger.warn(`[velix:tailwind] watcher: ${message}`);
          }
        });
        watcher.on('error', error => {
          logger.error('[velix:tailwind] watcher process error', error);
        });
        watcher.on('exit', (code, signal) => {
          if (watcher && code !== 0 && code !== null) {
            logger.error(`[velix:tailwind] watcher exited (code ${code}, signal ${signal})`);
          }
          watcher = null;
        });

        if (!cleanupRegistered) {
          cleanupRegistered = true;
          process.once('exit', cleanup);
          process.once('SIGINT', cleanup);
          process.once('SIGTERM', cleanup);
        }
      },
    },
  });
}
