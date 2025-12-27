#!/usr/bin/env node

/**
 * FlexiReact CLI v2.1
 * Professional CLI with TypeScript, colors, prompts, and progress indicators
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { execSync, spawn } from 'child_process';
import pc from 'picocolors';
import prompts from 'prompts';
import ora from 'ora';
import { runGenerate, listGenerators } from './generators.js';
// Import templates from the create-flexireact package
import { getTemplateFiles, TEMPLATES } from '../packages/create-flexireact/src/templates/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VERSION = '4.1.0';

// ============================================================================
// ASCII Logo & Branding
// ============================================================================

// ============================================================================
// Branding
// ============================================================================

const LOGO = `
  ${pc.white('▲')} ${pc.bold('FlexiReact')} ${pc.dim(VERSION)}
`;

const MINI_LOGO = `${pc.white('▲')} ${pc.bold('FlexiReact')}`;

// ============================================================================
// Logger Utilities
// ============================================================================

const log = {
  info: (msg: string) => console.log(`  ${pc.cyan('ℹ')} ${msg}`),
  success: (msg: string) => console.log(`  ${pc.green('✔')} ${msg}`),
  warn: (msg: string) => console.log(`  ${pc.yellow('⚠')} ${pc.yellow(msg)}`),
  error: (msg: string) => console.log(`  ${pc.red('✖')} ${pc.red(msg)}`),
  step: (msg: string) => console.log(`  ${pc.dim('○')} ${msg}`),
  blank: () => console.log(''),
  divider: () => console.log(pc.dim('  ──────────────────────────────────────────────')),
};

// ============================================================================
// Helper Functions
// ============================================================================

// Helper to strip colors if needed
function stripColors(str: string) {
  return str.replace(/\x1B[[(?];?[\d;]*m/g, '');
}

async function runCommand(cmd: string, cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, {
      shell: true,
      cwd,
      stdio: 'pipe'
    });

    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed with code ${code}`));
    });

    child.on('error', reject);
  });
}

// ============================================================================
// Create Command
// ============================================================================

interface CreateOptions {
  template: 'default' | 'minimal' | 'flexi-ui';
  typescript: boolean;
  tailwind: boolean;
  shadcn: boolean;
}

export async function createProject(projectName?: string): Promise<void> {
  console.log(LOGO);
  log.blank();

  // Get project name
  let name = projectName;
  if (!name) {
    const response = await prompts({
      type: 'text',
      name: 'projectName',
      message: 'Project name:',
      initial: 'my-flexi-app',
      validate: (value: string) => value.length > 0 || 'Project name is required'
    });
    name = response.projectName;
    if (!name) process.exit(1);
  }

  const projectPath = path.resolve(process.cwd(), name);

  // Check if directory exists
  if (fs.existsSync(projectPath)) {
    log.error(`Directory "${name}" already exists.`);
    process.exit(1);
  }

  // Get options
  // Get options
  // Get options
  const options = await prompts([
    {
      type: 'select',
      name: 'template',
      message: 'Select a template:',
      choices: [
        { title: `⚡ Default ${pc.dim('(Components + Routing)')}`, value: 'default' },
        { title: `📦 Minimal ${pc.dim('(Clean slate)')}`, value: 'minimal' },
        { title: `📂 App Router ${pc.dim('(Next.js style)')}`, value: 'app-router' }
      ],
      initial: 0
    },
    {
      type: 'select',
      name: 'mode',
      message: 'Initialize as Fullstack App?',
      choices: [
        { title: 'No (Standard)', value: 'standard' },
        { title: 'Yes (Add FlexiGuard Auth + Drizzle ORM)', value: 'fullstack' }
      ],
      initial: 0
    },
    {
      type: 'toggle',
      name: 'tailwind',
      message: 'Use Tailwind CSS?',
      initial: true,
      active: 'Yes',
      inactive: 'No'
    },
    {
      type: 'toggle',
      name: 'typescript',
      message: 'Use TypeScript?',
      initial: true,
      active: 'Yes',
      inactive: 'No'
    }
  ]);

  if (options.template === undefined) process.exit(1);

  log.blank();

  const totalSteps = 5;
  let currentStep = 0;

  // Step 1: Create directory
  currentStep++;
  log.step('Creating project directory...');
  fs.mkdirSync(projectPath, { recursive: true });

  // Step 2: Generate Files
  currentStep++;
  log.step('Generating files...');

  try {
    // Derive options
    const styling = options.tailwind ? 'tailwind' : 'css';
    const templateKey = options.mode === 'fullstack' ? 'fullstack' : options.template;

    const files = getTemplateFiles(templateKey, name, { styling });

    for (const [filePath, content] of Object.entries(files)) {
      const fullPath = path.join(projectPath, filePath);
      const dir = path.dirname(fullPath);

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(fullPath, content);
    }
  } catch (err) {
    log.error(`Failed to generate template: ${(err as Error).message}`);
    process.exit(1);
  }

  // Step 3: Initialize Git
  currentStep++;
  log.step('Initializing git...');
  try {
    execSync('git init', { cwd: projectPath, stdio: 'ignore' });
    execSync('git add .', { cwd: projectPath, stdio: 'ignore' });
    execSync('git commit -m "Initial commit from FlexiReact CLI"', { cwd: projectPath, stdio: 'ignore' });
  } catch {
    // ignore git errors
  }

  // Step 4: Install dependencies
  currentStep++;
  log.step('Installing dependencies...');
  const spinner = ora({ text: 'Installing packages...', color: 'cyan', indent: 2 }).start();

  try {
    await runCommand('npm install', projectPath);
    spinner.stop();
    log.success('Dependencies installed');
  } catch {
    spinner.stop();
    log.warn('Run "npm install" manually');
  }

  // Step 5: Link FlexiReact (for development)
  currentStep++;
  log.step('Linking FlexiReact...');
  try {
    const frameworkRoot = path.resolve(__dirname, '..');
    await runCommand(`npm link "${frameworkRoot}"`, projectPath);
  } catch {
    log.warn('Run "npm link flexireact" manually');
  }

  // Success message
  log.blank();
  console.log(`  ${pc.green('✔')} ${pc.bold('Success!')} Created ${name} at ${projectPath}`);
  log.blank();
  console.log(`  Next steps:`);
  console.log(`  ${pc.dim('1.')} ${pc.cyan(`cd ${name}`)}`);
  console.log(`  ${pc.dim('2.')} ${pc.cyan('npm run dev')}`);
  log.blank();
}



// ============================================================================
// Dev Command
// ============================================================================

async function runDev(): Promise<void> {
  // Show styled logo
  // Show styled logo
  console.log(''); // Just a blank line, core/server/index.ts shows the logo on start


  // Determine if we are running from dist or source
  const isBuilt = __dirname.includes('dist');
  const ext = isBuilt ? 'js' : 'ts';
  const startDevDir = isBuilt ? path.join(__dirname, '..', 'core') : path.join(__dirname, '..', 'core');
  const startDevPath = path.join(startDevDir, `start-dev.${ext}`);

  // Find tsx binary
  const tsxBin = 'tsx'; // rely on dependency in node_modules

  const child = spawn(
    'npx',
    [tsxBin, startDevPath],
    {
      stdio: 'inherit',
      cwd: process.cwd(),
      shell: true,
      env: {
        ...process.env,
        NODE_ENV: 'development',
        FORCE_COLOR: '1',
        NODE_PATH: path.join(process.cwd(), 'node_modules')
      }
    }
  );

  child.on('error', (error) => {
    log.error(`Failed to start dev server: ${error.message}`);
    process.exit(1);
  });

  process.on('SIGINT', () => child.kill('SIGINT'));
  process.on('SIGTERM', () => child.kill('SIGTERM'));
}

// ============================================================================
// Build Command
// ============================================================================

async function runBuild(options: { analyze?: boolean } = {}): Promise<void> {
  console.log(MINI_LOGO);
  log.blank();
  log.info('Building for production...');
  if (options.analyze) {
    log.info('Bundle analysis enabled');
  }
  log.blank();

  const spinner = ora({ text: 'Compiling...', color: 'cyan' }).start();

  try {
    // Determine if we are running from dist or source
    const isBuilt = __dirname.includes('dist');
    const ext = isBuilt ? 'js' : 'ts';
    const coreDir = isBuilt ? path.join(__dirname, '..', 'core') : path.join(__dirname, '..', 'core');

    const buildPath = path.join(coreDir, 'build', `index.${ext}`);
    const configPath = path.join(coreDir, `config.${ext}`);

    const buildModule = await import(pathToFileURL(buildPath).href);
    const configModule = await import(pathToFileURL(configPath).href);

    const projectRoot = process.cwd();
    const rawConfig = await configModule.loadConfig(projectRoot);
    const config = configModule.resolvePaths(rawConfig, projectRoot);

    const result = await buildModule.build({
      projectRoot,
      config,
      mode: 'production',
      analyze: options.analyze
    });

    spinner.stop();
    log.success('Build complete');
    log.blank();
    console.log(`  ${pc.dim('Output in')} ${pc.cyan('.flexi/')}`);

    // Show bundle analysis if enabled
    if (options.analyze && result?.analysis) {
      log.blank();
      console.log(`  ${pc.bold('Bundle Analysis')}`);
      log.blank();

      const analysis = result.analysis;

      // Sort by size
      const sorted = Object.entries(analysis.files || {})
        .sort((a: any, b: any) => b[1].size - a[1].size);

      console.log(`  ${pc.dim('File')}                                    ${pc.dim('Size')}         ${pc.dim('Gzip')}`);
      console.log(pc.dim('  ──────────────────────────────────────────────────────────────'));

      for (const [file, info] of sorted.slice(0, 15) as any) {
        const name = file.length > 40 ? '...' + file.slice(-37) : file;
        const size = formatBytes(info.size);
        const gzip = info.gzipSize ? formatBytes(info.gzipSize) : '-';
        console.log(`  ${name.padEnd(43)} ${size.padEnd(12)} ${pc.dim(gzip)}`);
      }

      log.blank();
      const total = formatBytes(analysis.totalSize || 0);
      const totalGzip = analysis.totalGzipSize ? formatBytes(analysis.totalGzipSize) : '-';
      console.log(`  ${pc.dim('Total:')} ${pc.bold(total)}  ${pc.dim(`(Gzip: ${totalGzip})`)}`);
      log.blank();
    }

  } catch (error: any) {
    spinner.fail('Build failed');
    log.error(error.message);
    process.exit(1);
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ============================================================================
// Start Command
// ============================================================================

async function runStart(): Promise<void> {
  console.log(MINI_LOGO);
  log.blank();
  log.info('Starting production server...');
  log.blank();

  // Determine if we are running from dist or source
  const isBuilt = __dirname.includes('dist');
  const ext = isBuilt ? 'js' : 'ts';
  const startProdPath = path.join(__dirname, '..', 'core', `start-prod.${ext}`);

  const child = spawn(
    'npx',
    ['tsx', startProdPath],
    {
      stdio: 'inherit',
      cwd: process.cwd(),
      shell: true,
      env: { ...process.env, NODE_ENV: 'production' }
    }
  );

  child.on('error', (error) => {
    log.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  });

  process.on('SIGINT', () => child.kill('SIGINT'));
  process.on('SIGTERM', () => child.kill('SIGTERM'));
}

// ============================================================================
// Doctor Command
// ============================================================================

async function runDoctor(): Promise<void> {
  log.blank();

  // Minimalist doctor output
  console.log(`  ${pc.bold('Health Check')}`);
  log.blank();

  interface Check {
    name: string;
    status: 'pass' | 'fail' | 'warn' | 'info';
    message: string;
  }

  const checks: Check[] = [];
  const projectRoot = process.cwd();

  // Node.js version
  const nodeVersion = process.version;
  const nodeMajor = parseInt(nodeVersion.slice(1).split('.')[0]);
  checks.push({
    name: 'Node.js version',
    status: nodeMajor >= 18 ? 'pass' : 'fail',
    message: nodeMajor >= 18 ? `${nodeVersion} ✓` : `${nodeVersion} (requires 18+)`
  });

  // package.json
  const packageJsonPath = path.join(projectRoot, 'package.json');
  const hasPackageJson = fs.existsSync(packageJsonPath);
  checks.push({
    name: 'package.json',
    status: hasPackageJson ? 'pass' : 'fail',
    message: hasPackageJson ? 'Found' : 'Not found'
  });

  // pages directory
  const pagesDir = path.join(projectRoot, 'pages');
  const hasPages = fs.existsSync(pagesDir);
  checks.push({
    name: 'pages/ directory',
    status: hasPages ? 'pass' : 'warn',
    message: hasPages ? 'Found' : 'Not found'
  });

  // TypeScript
  const tsconfigPath = path.join(projectRoot, 'tsconfig.json');
  const hasTypeScript = fs.existsSync(tsconfigPath);
  checks.push({
    name: 'TypeScript',
    status: 'info',
    message: hasTypeScript ? 'Enabled' : 'Not configured'
  });

  // Tailwind
  const tailwindPath = path.join(projectRoot, 'tailwind.config.js');
  const hasTailwind = fs.existsSync(tailwindPath);
  checks.push({
    name: 'Tailwind CSS',
    status: 'info',
    message: hasTailwind ? 'Configured' : 'Not configured'
  });

  // Print results
  let hasErrors = false;
  let hasWarnings = false;

  for (const check of checks) {
    let icon: string;
    let color: (s: string) => string;

    switch (check.status) {
      case 'pass':
        icon = '✓';
        color = pc.green;
        break;
      case 'fail':
        icon = '✗';
        color = pc.red;
        hasErrors = true;
        break;
      case 'warn':
        icon = '⚠';
        color = pc.yellow;
        hasWarnings = true;
        break;
      default:
        icon = '○';
        color = pc.cyan;
    }

    console.log(`  ${color(icon)} ${check.name.padEnd(20)} ${pc.dim(check.message)}`);
  }

  log.blank();

  if (hasErrors) {
    log.error('Some checks failed. Please fix the issues above.');
  } else if (hasWarnings) {
    log.warn('All critical checks passed with some warnings.');
  } else {
    log.success('All checks passed! Your project is ready.');
  }

  log.blank();
}

// ============================================================================
// Help Command
// ============================================================================

function showHelp(): void {
  console.log(LOGO);

  console.log(`  ${pc.bold('Usage')}`);
  console.log(`    $ flexi <command> [options]`);
  log.blank();

  console.log(`  ${pc.bold('Commands')}`);
  console.log(`    ${pc.cyan('create')}    ${pc.dim('Create a new project')}`);
  console.log(`    ${pc.cyan('dev')}       ${pc.dim('Start development server')}`);
  console.log(`    ${pc.cyan('build')}     ${pc.dim('Build for production')}`);
  console.log(`    ${pc.cyan('start')}     ${pc.dim('Start production server')}`);
  console.log(`    ${pc.cyan('doctor')}    ${pc.dim('Check project health')}`);
  log.blank();

  console.log(`  ${pc.bold('Generators')}`);
  console.log(`    $ flexi g <type> [name]`);
  console.log(`    ${pc.dim('Types:')} page, component, hook, api, action, middleware`);
  log.blank();
}

// ============================================================================
// Main Entry Point
// ============================================================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'create':
      await createProject(args[1]);
      break;

    case 'dev':
      await runDev();
      break;

    case 'build':
      const analyzeFlag = args.includes('--analyze') || args.includes('-a');
      await runBuild({ analyze: analyzeFlag });
      break;

    case 'start':
      await runStart();
      break;

    case 'doctor':
      await runDoctor();
      break;

    case 'generate':
    case 'g':
      await runGenerate(args[1], args[2]);
      break;

    case 'generate:list':
    case 'g:list':
      listGenerators();
      break;

    case 'version':
    case '-v':
    case '--version':
      console.log(`${MINI_LOGO} ${pc.dim(`v${VERSION}`)}`);
      break;

    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;

    default:
      if (command) {
        log.error(`Unknown command: ${command}`);
        log.blank();
      }
      showHelp();
      process.exit(command ? 1 : 0);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    log.error(error.message);
    process.exit(1);
  });
}
