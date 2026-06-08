/**
 * `velix doctor` & `velix info`
 */
import fs from 'fs';
import pc from 'picocolors';
import { VERSION } from '../version.js';
import { showBanner, log } from './shared.js';

export async function doctorCommand() {
  showBanner();
  console.log(`  ${pc.bold('Velix Doctor')}`);
  log.blank();

  const checks = [
    { name: 'Node.js version', check: () => { const v = parseInt(process.version.slice(1)); return v >= 18 ? '✔' : '✖'; }, info: process.version },
    { name: 'velix.config.ts', check: () => fs.existsSync('velix.config.ts') || fs.existsSync('velix.config.js') ? '✔' : '✖', info: '' },
    { name: 'app/ directory', check: () => fs.existsSync('app') ? '✔' : '✖', info: '' },
    { name: 'package.json', check: () => fs.existsSync('package.json') ? '✔' : '✖', info: '' },
    { name: 'tsconfig.json', check: () => fs.existsSync('tsconfig.json') ? '✔' : '✖', info: '' },
    { name: 'node_modules', check: () => fs.existsSync('node_modules') ? '✔' : '⚠ Run npm install', info: '' },
  ];

  for (const { name, check, info } of checks) {
    const result = check();
    const icon = result === '✔' ? pc.green('✔') : result.startsWith('✖') ? pc.red('✖') : pc.yellow('⚠');
    const infoStr = info ? ` ${pc.dim(info)}` : (result.length > 1 ? ` ${pc.yellow(result.slice(2))}` : '');
    console.log(`  ${icon} ${name}${infoStr}`);
  }

  log.blank();
}

export async function infoCommand() {
  showBanner();
  console.log(`  ${pc.bold('Environment:')}`);
  console.log(`    Velix:     ${pc.cyan(`v${VERSION}`)}`);
  console.log(`    Node:      ${pc.dim(process.version)}`);
  console.log(`    Platform:  ${pc.dim(process.platform)}`);
  console.log(`    Arch:      ${pc.dim(process.arch)}`);
  console.log(`    CWD:       ${pc.dim(process.cwd())}`);
  log.blank();
}
