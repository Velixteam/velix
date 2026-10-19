import fs from 'node:fs';
import path from 'node:path';

// Fallback used when the installed package can't be read (e.g. bundled output).
const FALLBACK = '5.3.7';

/** Version of the installed @teamvelix/velix, so the site never drifts from the published package. */
export function getVelixVersion(): string {
  try {
    const pkgPath = path.join(process.cwd(), 'node_modules', '@teamvelix', 'velix', 'package.json');
    const v = JSON.parse(fs.readFileSync(pkgPath, 'utf8')).version;
    return typeof v === 'string' && v ? v : FALLBACK;
  } catch {
    return FALLBACK;
  }
}
