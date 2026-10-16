import { ModuleType } from '../types.js';
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

export interface TransformResultCSS {
  code: string;
  imports: string[];
  type: ModuleType;
}

/**
 * Detect if the CSS content contains Tailwind v4 directives (@import "tailwindcss")
 * or Tailwind v3 directives (@tailwind base/components/utilities)
 */
function hasTailwindDirectives(content: string): boolean {
  return (
    content.includes('@import "tailwindcss"') ||
    content.includes("@import 'tailwindcss'") ||
    /^@tailwind\s+(base|components|utilities)/m.test(content)
  );
}

/**
 * Detect which Tailwind CLI is available (v4: @tailwindcss/cli, v3: tailwindcss)
 * Returns null if no CLI is found.
 */
function detectTailwindCli(): string | null {
  const v4 = spawnSync('npx --no-warnings @tailwindcss/cli --help', {
    stdio: 'pipe',
    timeout: 10000,
    shell: true,
  });
  if (v4.status === 0) return '@tailwindcss/cli';

  const v3 = spawnSync('npx --no-warnings tailwindcss --help', {
    stdio: 'pipe',
    timeout: 10000,
    shell: true,
  });
  if (v3.status === 0) return 'tailwindcss';

  return null;
}

let _tailwindCli: string | null | undefined = undefined;

export async function transformCSS(filePath: string, content: string): Promise<TransformResultCSS> {
  // If this CSS has Tailwind directives, compile it via CLI
  if (hasTailwindDirectives(content)) {
    if (_tailwindCli === undefined) {
      _tailwindCli = detectTailwindCli();
    }

    if (_tailwindCli) {
      const outputPath = path.join(process.cwd(), 'public', 'tailwind.css');
      const outputDir = path.dirname(outputPath);

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const result = spawnSync(
        `npx --no-warnings ${_tailwindCli} -i "${filePath}" -o "${outputPath}"`,
        { cwd: process.cwd(), stdio: 'pipe', shell: true }
      );

      if (result.status === 0 && fs.existsSync(outputPath)) {
        // Return the compiled CSS
        const compiled = fs.readFileSync(outputPath, 'utf-8');
        return {
          code: compiled,
          imports: [],
          type: 'shared',
        };
      }
    }

    // Fallback: return the raw content (will be served as-is)
    return {
      code: content,
      imports: [],
      type: 'shared',
    };
  }

  // Standard CSS pass-through
  return {
    code: content,
    imports: [],
    type: 'shared',
  };
}
