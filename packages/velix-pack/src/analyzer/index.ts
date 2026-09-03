import pc from 'picocolors';
import { BuildStats } from '../types.js';

export function formatBuildStats(stats: BuildStats): string {
  const lines: string[] = [];

  lines.push(pc.bold(pc.green('VELIX PACK ANALYSIS')));
  lines.push('');
  lines.push(pc.bold('Build Stats'));
  lines.push(pc.dim('─────'));
  lines.push(`Time:       ${pc.cyan((stats.duration / 1000).toFixed(2) + 's')}`);
  lines.push(`Modules:    ${pc.yellow(stats.modulesCount.toString())}`);
  lines.push(`Chunks:     ${pc.cyan(stats.chunksCount.toString())}`);
  lines.push(`Cache hit:  ${pc.green(stats.cacheHits + ' / ' + (stats.cacheHits + stats.cacheMisses))}`);
  lines.push('');
  lines.push(pc.bold('Client'));
  lines.push(pc.dim('──────'));
  lines.push(`Modules:    ${stats.clientModulesCount}`);
  lines.push(`Initial JS: ${pc.cyan((stats.initialJsSize / 1024).toFixed(1) + ' KB')}`);
  lines.push(`Async JS:   ${pc.cyan((stats.asyncJsSize / 1024).toFixed(1) + ' KB')}`);
  lines.push('');
  lines.push(pc.bold('Server'));
  lines.push(pc.dim('──────'));
  lines.push(`Modules:    ${stats.serverModulesCount}`);

  return lines.join('\n');
}
