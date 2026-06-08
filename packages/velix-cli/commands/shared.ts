/**
 * Shared CLI utilities — logger, banner, helpers
 */
import pc from 'picocolors';
import fs from 'fs';
import path from 'path';
import { VERSION } from '../version.js';

export const log = {
  info: (msg: string) => console.log(`  ${pc.cyan('ℹ')} ${msg}`),
  success: (msg: string) => console.log(`  ${pc.green('✔')} ${msg}`),
  warn: (msg: string) => console.log(`  ${pc.yellow('⚠')} ${pc.yellow(msg)}`),
  error: (msg: string) => console.log(`  ${pc.red('✖')} ${pc.red(msg)}`),
  blank: () => console.log(''),
};

export function showBanner() {
  console.log('');
  console.log(`  ${pc.cyan('▲')} ${pc.bold('Velix')} ${pc.dim(`v${VERSION}`)}`);
  console.log(`  ${pc.dim('──────────────────────────────────────────────')}`);
  console.log('');
}

export function writeFile(filePath: string, content: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function pascalCase(str: string): string {
  return str.split(/[-_\/]/).map(s => capitalize(s)).join('');
}

export function camelCase(str: string): string {
  const pascal = pascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}
