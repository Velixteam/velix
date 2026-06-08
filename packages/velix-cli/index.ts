#!/usr/bin/env node

/**
 * Velix v5 CLI
 *
 * Commands:
 *   velix create <name>     Create a new Velix project
 *   velix dev               Start development server
 *   velix build             Build for production
 *   velix start             Start production server
 *   velix g <type> <name>   Generate (page, component, api, layout, middleware, etc.)
 *   velix doctor            Health check
 *   velix info              Framework info
 *   velix analyze           Bundle analysis
 */

import pc from 'picocolors';
import { VERSION } from './version.js';
import { showBanner, log } from './commands/shared.js';

// ============================================================================
// Help
// ============================================================================

function showHelp() {
  showBanner();
  console.log(`  ${pc.bold('Usage:')} velix <command> [options]`);
  console.log('');
  console.log(`  ${pc.bold('Commands:')}`);
  console.log(`    ${pc.cyan('create')} <name>          Create a new Velix project`);
  console.log(`    ${pc.cyan('dev')}                    Start development server`);
  console.log(`    ${pc.cyan('build')}                  Build for production`);
  console.log(`    ${pc.cyan('start')}                  Start production server`);
  console.log(`    ${pc.cyan('g')} <type> <name>        Generate component/page/api/...`);
  console.log(`    ${pc.cyan('ui')} add <component>   Install Shadcn-style UI components`);
  console.log(`    ${pc.cyan('doctor')}                 Health check & diagnostics`);
  console.log(`    ${pc.cyan('info')}                   Framework & environment info`);
  console.log(`    ${pc.cyan('analyze')}                Bundle analysis`);
  console.log('');
  console.log(`  ${pc.bold('Generate types:')}`);
  console.log(`    page, layout, component, hook, api, action, middleware, context, loading, error, not-found`);
  console.log('');
  console.log(`  ${pc.bold('Examples:')}`);
  console.log(`    ${pc.dim('$')} velix create my-app`);
  console.log(`    ${pc.dim('$')} velix dev`);
  console.log(`    ${pc.dim('$')} velix g page dashboard`);
  console.log(`    ${pc.dim('$')} velix g api users`);
  console.log('');
}

// ============================================================================
// Main CLI
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === '--help' || command === '-h') {
    showHelp();
    return;
  }

  if (command === '--version' || command === '-v') {
    console.log(`velix v${VERSION}`);
    return;
  }

  switch (command) {
    case 'create': {
      const { createCommand } = await import('./commands/create.js');
      await createCommand(args[1]);
      break;
    }
    case 'dev': {
      const { devCommand } = await import('./commands/dev.js');
      await devCommand();
      break;
    }
    case 'build': {
      const { buildCommand } = await import('./commands/build.js');
      await buildCommand();
      break;
    }
    case 'start': {
      const { startCommand } = await import('./commands/build.js');
      await startCommand();
      break;
    }
    case 'g':
    case 'generate': {
      const { generateCommand } = await import('./commands/generate.js');
      await generateCommand(args[1], args[2]);
      break;
    }
    case 'doctor': {
      const { doctorCommand } = await import('./commands/doctor.js');
      await doctorCommand();
      break;
    }
    case 'info': {
      const { infoCommand } = await import('./commands/doctor.js');
      await infoCommand();
      break;
    }
    case 'analyze':
      log.info('Bundle analysis coming soon...');
      break;

    case 'ui': {
      const { handleUiCommand } = await import('./commands/ui.js');
      await handleUiCommand(args.slice(1));
      break;
    }
    default:
      log.error(`Unknown command: ${command}`);
      showHelp();
      process.exit(1);
  }
}

// ============================================================================
// Run
// ============================================================================

main().catch(err => {
  log.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
