import fs from 'fs';
import path from 'path';

export interface PathAlias {
  prefix: string;
  target: string;
}

export function loadPathAliases(projectRoot: string): PathAlias[] {
  const tsconfigPath = path.join(projectRoot, 'tsconfig.json');
  if (!fs.existsSync(tsconfigPath)) return [];

  try {
    const raw = fs.readFileSync(tsconfigPath, 'utf-8');
    // Strip comments simple regex for json
    const jsonStr = raw.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
    const tsconfig = JSON.parse(jsonStr);
    const compilerOptions = tsconfig?.compilerOptions || {};
    const paths = compilerOptions.paths || {};
    const baseUrl = compilerOptions.baseUrl ? path.resolve(projectRoot, compilerOptions.baseUrl) : projectRoot;

    const aliases: PathAlias[] = [];
    for (const [key, value] of Object.entries(paths)) {
      if (Array.isArray(value) && value.length > 0) {
        const prefix = key.replace(/\/\*$/, '');
        const targetRelative = (value[0] as string).replace(/\/\*$/, '');
        aliases.push({
          prefix,
          target: path.resolve(baseUrl, targetRelative),
        });
      }
    }

    return aliases;
  } catch {
    return [];
  }
}
