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

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pc from 'picocolors';
import prompts from 'prompts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VERSION = '5.0.5';

// ============================================================================
// Logger (shared, single instance)
// ============================================================================

const log = {
  info: (msg: string) => console.log(`  ${pc.cyan('ℹ')} ${msg}`),
  success: (msg: string) => console.log(`  ${pc.green('✔')} ${msg}`),
  warn: (msg: string) => console.log(`  ${pc.yellow('⚠')} ${pc.yellow(msg)}`),
  error: (msg: string) => console.log(`  ${pc.red('✖')} ${pc.red(msg)}`),
  blank: () => console.log(''),
};

// ============================================================================
// ASCII Banner
// ============================================================================

function showBanner() {
  console.log('');
  console.log(`  ${pc.cyan('▲')} ${pc.bold('Velix')} ${pc.dim(`v${VERSION}`)}`);
  console.log(`  ${pc.dim('──────────────────────────────────────────────')}`);
  console.log('');
}

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
    case 'create':
      await createProject(args[1]);
      break;

    case 'dev':
      await startDev();
      break;

    case 'build':
      await buildProject();
      break;

    case 'start':
      await startProd();
      break;

    case 'g':
    case 'generate':
      await generate(args[1], args[2]);
      break;

    case 'doctor':
      await doctor();
      break;

    case 'info':
      await info();
      break;

    case 'analyze':
      log.info('Bundle analysis coming soon...');
      break;

    case 'ui':
      await handleUiCommand(args.slice(1));
      break;

    default:
      log.error(`Unknown command: ${command}`);
      showHelp();
      process.exit(1);
  }
}

// ============================================================================
// Commands
// ============================================================================

async function createProject(name?: string) {
  showBanner();

  if (!name) {
    const response = await prompts({
      type: 'text',
      name: 'name',
      message: 'Project name:',
      initial: 'my-velix-app',
    });
    name = response.name;
    if (!name) { log.error('Project name is required'); process.exit(1); }
  }

  const projectDir = path.resolve(process.cwd(), name);

  if (fs.existsSync(projectDir)) {
    log.error(`Directory ${name} already exists`);
    process.exit(1);
  }

  // Choose template
    const flags = process.argv.slice(3); // Flags start from the 4th argument (index 3)
    const templateFlag = flags.find(a => a.startsWith('--template='))?.split('=')[1];
    const tailwindFlag = flags.includes('--tailwind');
    const noTailwindFlag = flags.includes('--no-tailwind');

    let template = templateFlag;
    let useTailwind: boolean | undefined = tailwindFlag ? true : (noTailwindFlag ? false : undefined);

    if (!template) {
      const response = await prompts({
        type: 'select',
        name: 'template',
        message: 'Select a template:',
        choices: [
          { title: '✨ Default - Full Velix app with examples', value: 'default' },
          { title: '⚡ Minimal', value: 'minimal' },
        ],
      });
      template = response.template;
    }

    if (!template) {
      log.error('No template selected');
      process.exit(1);
    }

    if (useTailwind === undefined) { // Only prompt if not specified by flags
      const twResponse = await prompts({
        type: 'confirm',
        name: 'useTailwind',
        message: 'Use Tailwind CSS?',
        initial: true
      });
      useTailwind = twResponse.useTailwind;
    }

    let useShadcn: boolean | undefined = flags.includes('--shadcn') ? true : (flags.includes('--no-shadcn') ? false : undefined);
    
    if (useTailwind && useShadcn === undefined) {
      const shResponse = await prompts({
        type: 'confirm',
        name: 'useShadcn',
        message: 'Use Shadcn UI components?',
        initial: true
      });
      useShadcn = shResponse.useShadcn;
    }

  const { default: ora } = await import('ora');
  const spinner = ora('Creating project...').start();

  try {
    fs.mkdirSync(projectDir, { recursive: true });

    // Generate project files based on template
    generateProjectFiles(projectDir, name, template, useTailwind, useShadcn);

    spinner.succeed(`Project ${pc.bold(name)} created!`);
    log.blank();
    console.log(`  ${pc.bold('Next steps:')}`);
    console.log(`    ${pc.dim('$')} cd ${name}`);
    console.log(`    ${pc.dim('$')} npm install`);
    console.log(`    ${pc.dim('$')} npm run dev`);
    log.blank();

  } catch (err: any) {
    spinner.fail('Failed to create project');
    log.error(err.message);
    process.exit(1);
  }
}

function generateProjectFiles(dir: string, name: string, template: string, useTailwind: boolean = true, useShadcn: boolean = false) {
  // package.json
  const pkg: any = {
    name,
    version: '0.1.0',
    private: true,
    type: 'module',
    scripts: {
      dev: 'velix dev',
      build: 'velix build',
      start: 'velix start',
    },
    dependencies: {
      '@teamvelix/velix': `^${VERSION}`,
      react: '^19.0.0',
      'react-dom': '^19.0.0',
    },
    devDependencies: {
      '@teamvelix/cli': `^${VERSION}`,
      typescript: '^5.7.0',
      '@types/react': '^19.0.0',
      '@types/react-dom': '^19.0.0',
    },
  };

  if (useTailwind) {
    pkg.devDependencies = {
      ...pkg.devDependencies,
      'tailwindcss': '^4.0.0',
      '@tailwindcss/cli': '^4.0.0',
    };
  }

  if (useShadcn) {
    pkg.dependencies = {
      ...pkg.dependencies,
      'clsx': '^2.1.0',
      'tailwind-merge': '^2.2.1',
      'lucide-react': '^0.359.0'
    };
  }

  writeFile(path.join(dir, 'package.json'), JSON.stringify(pkg, null, 2));

  // velix.config.ts
  writeFile(path.join(dir, 'velix.config.ts'), `import { defineConfig${useTailwind ? ', tailwindPlugin' : ''} } from "@teamvelix/velix";

export default defineConfig({
  app: {
    name: "${name}",
  },
  server: {
    port: 3000,
    host: "localhost",
  },
  seo: {
    sitemap: true,
    robots: true,
    openGraph: true,
  },
  favicon: "/favicon.webp",
  ${useTailwind ? `plugins: [\n    tailwindPlugin()\n  ],` : 'plugins: [],'}
});
`);

  // tsconfig.json
  writeFile(path.join(dir, 'tsconfig.json'), JSON.stringify({
    compilerOptions: {
      target: 'ES2022',
      module: 'ESNext',
      moduleResolution: 'bundler',
      jsx: 'react-jsx',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
    },
    include: ['app/**/*.ts', 'app/**/*.tsx', 'server/**/*.ts'],
    exclude: ['node_modules', '.velix']
  }, null, 2));

  if (useTailwind) {
    // Tailwind v4 configuration (content auto-detection, theme in CSS)
    writeFile(path.join(dir, 'tailwind.config.ts'), `import type { Config } from "tailwindcss";\n\nexport default {\n  content: [\n    "./index.html",\n    "./app/**/*.{js,ts,jsx,tsx}",\n    "./components/**/*.{js,ts,jsx,tsx}",\n    "./lib/**/*.{js,ts,jsx,tsx}",\n    "./src/**/*.{js,ts,jsx,tsx}",\n  ],\n} satisfies Config;\n`);
  }
  
  // app/layout.tsx
  fs.mkdirSync(path.join(dir, 'app'), { recursive: true });
  writeFile(path.join(dir, 'app', 'globals.css'), useTailwind ? `@import "tailwindcss";\n\n@theme {\n  --color-velix-deep: #0B1120;\n  --color-velix-dark: #0F172A;\n  --color-velix-accent: #2563EB;\n  --color-velix-cyan: #22D3EE;\n  --color-velix-glow: #38BDF8;\n}\n` : `body { margin: 0; font-family: sans-serif; }\n`);
  
  writeFile(path.join(dir, 'app', 'layout.tsx'), `import "./globals.css";

export const metadata = {
  title: "${name}",
  description: "Built with Velix v5",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="${useTailwind ? 'bg-velix-deep text-slate-100' : 'bg-slate-900 text-white'} min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
`);

  // app/page.tsx
  if (template === 'minimal') {
    writeFile(path.join(dir, 'app', 'page.tsx'), `export const metadata = {\n  title: "${name}",\n};\n\nexport default function MinimalPage() {\n  return (\n    <main className="min-h-screen flex flex-col items-center justify-center bg-[#0F172A] text-slate-100 font-sans">\n      <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Velix</h1>\n      <p className="text-slate-400">Minimal starter.</p>\n    </main>\n  );\n}\n`);
  } else {
    // Generate components
    fs.mkdirSync(path.join(dir, 'components', 'ui'), { recursive: true });
    
    // Default Button Component
    let buttonCode = `import React from 'react';\n\nexport interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {\n  variant?: 'primary' | 'secondary';\n}\n\nexport const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(\n  ({ className = '', variant = 'primary', ...props }, ref) => {\n    const base = "inline-flex flex-row gap-2 items-center justify-center font-medium transition-all duration-300 h-12 rounded-xl px-8 focus:outline-none focus:ring-2 focus:ring-velix-cyan/50";\n    const variants = {\n      primary: "bg-gradient-to-r from-velix-accent to-velix-cyan text-white shadow-[0_0_20px_rgba(34,211,238,0.25)] hover:shadow-[0_0_30px_rgba(34,211,238,0.45)]",\n      secondary: "bg-white/5 text-slate-200 border border-white/10 hover:bg-white/10 hover:border-velix-cyan/30"\n    };\n    return <button ref={ref} className={\`\${base} \${variants[variant]} \${className}\`} {...props} />;\n  }\n);\nButton.displayName = "Button";\n`;
    
    // Overwrite with Shadcn baseline if chosen
    if (useShadcn) {
      fs.mkdirSync(path.join(dir, 'lib'), { recursive: true });
      writeFile(path.join(dir, 'lib', 'utils.ts'), `import { clsx, type ClassValue } from "clsx";\nimport { twMerge } from "tailwind-merge";\n\nexport function cn(...inputs: ClassValue[]) {\n  return twMerge(clsx(inputs));\n}\n`);
      buttonCode = `import * as React from "react";\nimport { cn } from "../../lib/utils";\n\nexport interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {\n  variant?: 'primary' | 'secondary';\n}\n\nexport const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(\n  ({ className, variant = 'primary', ...props }, ref) => {\n    const classes = cn(\n      "inline-flex flex-row gap-2 items-center justify-center font-medium transition-all duration-300 h-12 rounded-xl px-8 focus:outline-none focus:ring-2 focus:ring-velix-cyan/50",\n      variant === 'primary' ? "bg-gradient-to-r from-velix-accent to-velix-cyan text-white shadow-[0_0_20px_rgba(34,211,238,0.25)] hover:shadow-[0_0_30px_rgba(34,211,238,0.45)]" : "bg-white/5 text-slate-200 border border-white/10 hover:bg-white/10 hover:border-velix-cyan/30",\n      className\n    );\n    return <button className={classes} ref={ref} {...props} />;\n  }\n);\nButton.displayName = "Button";\n`;
    }
    writeFile(path.join(dir, 'components', 'ui', 'button.tsx'), buttonCode);

    // Default Card Component
    const cardCode = `import React from 'react';\n${useShadcn ? 'import { cn } from "../../lib/utils";\n' : ''}\nexport function Card({ title, description, className = '' }: { title: string; description: string; className?: string }) {\n  return (\n    <div className={${useShadcn ? 'cn(' : ''}"group relative p-8 bg-velix-dark/60 border border-white/5 rounded-2xl hover:border-velix-cyan/20 transition-colors duration-300 overflow-hidden"${useShadcn ? ', className)}' : ' + " " + className}'>\n      <div className="absolute inset-0 bg-gradient-to-br from-velix-accent/0 to-velix-cyan/0 group-hover:from-velix-accent/5 group-hover:to-velix-cyan/5 transition-all duration-500"></div>\n      <h3 className="text-xl font-semibold text-slate-100 mb-3 relative z-10">{title}</h3>\n      <p className="text-sm text-slate-400 leading-relaxed relative z-10">{description}</p>\n    </div>\n  );\n}\n`;
    writeFile(path.join(dir, 'components', 'ui', 'card.tsx'), cardCode);

    // Default Layout logic
    writeFile(path.join(dir, 'app', 'page.tsx'), `import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";

export const metadata = {
  title: "Welcome to Velix",
  description: "Build fast. Ship faster.",
};

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-b from-[#0B1628] via-velix-dark to-velix-deep text-slate-100 font-sans relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-velix-accent/15 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-velix-cyan/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="z-10 flex flex-col items-center max-w-5xl w-full text-center mt-12 mb-auto">
        <div className="mb-10 w-24 h-24 bg-gradient-to-br from-velix-accent to-velix-cyan rounded-2xl shadow-[0_0_50px_rgba(34,211,238,0.3)] flex items-center justify-center relative group">
          <div className="absolute inset-0 bg-velix-cyan/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
          <span className="text-5xl font-black text-white relative z-10 tracking-tighter">V</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Welcome to</span>{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-velix-cyan via-velix-glow to-velix-accent">Velix</span>
        </h1>

        <p className="text-xl md:text-2xl text-slate-400 mb-12 tracking-wide font-light">
          Build fast. Ship faster.
        </p>

        <div className="flex flex-col sm:flex-row gap-5 mb-24 w-full sm:w-auto">
          <a href="https://github.com/Velixteam/velix" target="_blank" rel="noreferrer" className="w-full sm:w-auto">
            <Button variant="primary" className="w-full">
              Get Started
            </Button>
          </a>
          <a href="https://velix.vercel.app" target="_blank" rel="noreferrer" className="w-full sm:w-auto">
            <Button variant="secondary" className="w-full">
              Documentation
            </Button>
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full text-left">
          <Card title="Routing" description="File-system based routing that feels instantly familiar and snappy." />
          <Card title="Actions" description="Type-safe server actions mapped seamlessly directly to your client." />
          <Card title="Plugins" description="Extend the framework capabilities with a simple yet powerful API." />
          <Card title="Deployment" description="Deploy to any cloud provider or serverless edge with zero config." />
        </div>
      </div>

      <div className="mt-16 pb-8 text-slate-600 text-sm tracking-widest uppercase font-mono">
        Velix &copy; ${new Date().getFullYear()}
      </div>
    </main>
  );
}
`);
  }

  if (template !== 'minimal') {
    // server/api/hello.ts
    fs.mkdirSync(path.join(dir, 'server', 'api'), { recursive: true });
    writeFile(path.join(dir, 'server', 'api', 'hello.ts'), `export function GET() {
  return Response.json({ message: "Hello from Velix API!" });
}

export function POST(request: any) {
  return Response.json({ received: true });
}
`);

    // public directory
    fs.mkdirSync(path.join(dir, 'public'), { recursive: true });
  }

  // Copy favicon
  const logoSrc = path.join(__dirname, '..', 'assets', 'logo.webp');
  if (fs.existsSync(logoSrc)) {
    fs.mkdirSync(path.join(dir, 'public'), { recursive: true });
    fs.copyFileSync(logoSrc, path.join(dir, 'public', 'favicon.webp'));
  }
}

async function startDev() {
  showBanner();
  log.info('Starting development server...');

  const { spawn } = await import('child_process');
  const child = spawn('npx', ['tsx', '--no-cache', 'node_modules/@teamvelix/velix/dist/runtime/start-dev.js'], {
    stdio: 'inherit', cwd: process.cwd(), shell: true,
  });

  child.on('error', () => {
    // Fallback: try running from packages
    const devScript = path.join(process.cwd(), 'packages', 'velix', 'runtime', 'start-dev.ts');
    if (fs.existsSync(devScript)) {
      spawn('npx', ['tsx', devScript], { stdio: 'inherit', cwd: process.cwd(), shell: true });
    } else {
      log.error('Could not find Velix runtime. Run `npm install` first.');
      process.exit(1);
    }
  });
}

async function buildProject() {
  showBanner();
  log.info('Building for production...');

  const { spawn } = await import('child_process');
  const child = spawn('npx', ['tsx', 'node_modules/@teamvelix/velix/dist/runtime/start-build.js'], {
    stdio: 'inherit', cwd: process.cwd(), shell: true,
  });

  child.on('error', () => {
    const buildScript = path.join(process.cwd(), 'packages', 'velix', 'runtime', 'start-build.ts');
    if (fs.existsSync(buildScript)) {
      spawn('npx', ['tsx', buildScript], { stdio: 'inherit', cwd: process.cwd(), shell: true });
    } else {
      log.error('Could not find Velix runtime. Run `npm install` first.');
      process.exit(1);
    }
  });
}

async function startProd() {
  showBanner();
  log.info('Starting production server...');

  const { spawn } = await import('child_process');
  const child = spawn('npx', ['tsx', 'node_modules/@teamvelix/velix/dist/runtime/start-prod.js'], {
    stdio: 'inherit', cwd: process.cwd(), shell: true,
  });

  child.on('error', () => {
    log.error('Could not start production server.');
    process.exit(1);
  });
}

async function doctor() {
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

async function info() {
  showBanner();
  console.log(`  ${pc.bold('Environment:')}`);
  console.log(`    Velix:     ${pc.cyan(`v${VERSION}`)}`);
  console.log(`    Node:      ${pc.dim(process.version)}`);
  console.log(`    Platform:  ${pc.dim(process.platform)}`);
  console.log(`    Arch:      ${pc.dim(process.arch)}`);
  console.log(`    CWD:       ${pc.dim(process.cwd())}`);
  log.blank();
}

// ============================================================================
// Generator
// ============================================================================

async function generate(type?: string, name?: string) {
  const validTypes = ['page', 'layout', 'component', 'hook', 'api', 'action', 'middleware', 'context', 'loading', 'error', 'not-found'];

  if (!type) {
    const { type: selectedType } = await prompts({
      type: 'select',
      name: 'type',
      message: 'What do you want to generate?',
      choices: validTypes.map(t => ({ title: t, value: t })),
    });
    type = selectedType;
    if (!type) process.exit(0);
  }

  if (!validTypes.includes(type)) {
    log.error(`Invalid type: ${type}. Valid: ${validTypes.join(', ')}`);
    process.exit(1);
  }

  if (!name && !['loading', 'error', 'not-found'].includes(type)) {
    const { name: inputName } = await prompts({
      type: 'text',
      name: 'name',
      message: `${type} name:`,
    });
    name = inputName;
    if (!name) process.exit(0);
  }

  const templates: Record<string, (n: string) => { path: string; content: string }> = {
    page: (n) => ({
      path: `app/${n}/page.tsx`,
      content: `export const metadata = {\n  title: "${capitalize(n)}",\n};\n\nexport default function ${pascalCase(n)}Page() {\n  return (\n    <main>\n      <h1>${capitalize(n)}</h1>\n    </main>\n  );\n}\n`
    }),
    layout: (n) => ({
      path: `app/${n}/layout.tsx`,
      content: `export default function ${pascalCase(n)}Layout({ children }: { children: React.ReactNode }) {\n  return <div>{children}</div>;\n}\n`
    }),
    component: (n) => ({
      path: `components/${pascalCase(n)}.tsx`,
      content: `interface ${pascalCase(n)}Props {\n  // props\n}\n\nexport default function ${pascalCase(n)}({}: ${pascalCase(n)}Props) {\n  return <div>${pascalCase(n)}</div>;\n}\n`
    }),
    hook: (n) => ({
      path: `hooks/use${pascalCase(n)}.ts`,
      content: `import { useState } from 'react';\n\nexport function use${pascalCase(n)}() {\n  const [state, setState] = useState(null);\n  return { state, setState };\n}\n`
    }),
    api: (n) => ({
      path: `server/api/${n}.ts`,
      content: `export function GET(request: any) {\n  return Response.json({ message: "Hello from ${n}" });\n}\n\nexport function POST(request: any) {\n  return Response.json({ received: true });\n}\n`
    }),
    action: (n) => ({
      path: `server/actions/${n}.ts`,
      content: `'use server';\n\nexport async function ${camelCase(n)}Action(prevState: any, formData: FormData) {\n  // Server action logic\n  return { success: true };\n}\n`
    }),
    middleware: (n) => ({
      path: `middleware/${n}.ts`,
      content: `export default async function ${camelCase(n)}Middleware(req: any, res: any, next: () => Promise<void>) {\n  // Middleware logic\n  await next();\n}\n`
    }),
    context: (n) => ({
      path: `contexts/${pascalCase(n)}Context.tsx`,
      content: `'use client';\nimport { createContext, useContext, useState, type ReactNode } from 'react';\n\ninterface ${pascalCase(n)}ContextType {\n  // context values\n}\n\nconst ${pascalCase(n)}Context = createContext<${pascalCase(n)}ContextType | null>(null);\n\nexport function ${pascalCase(n)}Provider({ children }: { children: ReactNode }) {\n  return <${pascalCase(n)}Context.Provider value={{}}>{children}</${pascalCase(n)}Context.Provider>;\n}\n\nexport function use${pascalCase(n)}() {\n  const ctx = useContext(${pascalCase(n)}Context);\n  if (!ctx) throw new Error('use${pascalCase(n)} must be used within ${pascalCase(n)}Provider');\n  return ctx;\n}\n`
    }),
    loading: () => ({
      path: `app/loading.tsx`,
      content: `export default function Loading() {\n  return <div>Loading...</div>;\n}\n`
    }),
    error: () => ({
      path: `app/error.tsx`,
      content: `'use client';\n\nexport default function Error({ error, reset }: { error: Error; reset: () => void }) {\n  return (\n    <div>\n      <h2>Something went wrong!</h2>\n      <p>{error.message}</p>\n      <button onClick={reset}>Try again</button>\n    </div>\n  );\n}\n`
    }),
    'not-found': () => ({
      path: `app/not-found.tsx`,
      content: `export default function NotFound() {\n  return (\n    <div>\n      <h1>404 - Not Found</h1>\n      <p>The page you're looking for doesn't exist.</p>\n    </div>\n  );\n}\n`
    }),
  };

  const generator = templates[type!];
  if (!generator) { log.error(`No template for type: ${type}`); process.exit(1); }

  const { path: filePath, content } = generator(name || '');
  const fullPath = path.resolve(process.cwd(), filePath);

  if (fs.existsSync(fullPath)) {
    log.warn(`File already exists: ${filePath}`);
    const { overwrite } = await prompts({
      type: 'confirm', name: 'overwrite', message: 'Overwrite?', initial: false,
    });
    if (!overwrite) process.exit(0);
  }

  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content);
  log.success(`Created ${pc.cyan(filePath)}`);
}

// ============================================================================
// Helpers
// ============================================================================

function writeFile(filePath: string, content: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function pascalCase(str: string): string {
  return str.split(/[-_\/]/).map(s => capitalize(s)).join('');
}

function camelCase(str: string): string {
  const pascal = pascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

async function handleUiCommand(args: string[]) {
  const [subCommand, componentName] = args;
  if (subCommand !== 'add' || !componentName) {
    log.error('Usage: velix ui add <component>');
    return;
  }

  const cwd = process.cwd();
  const uiDir = path.join(cwd, 'components', 'ui');
  const utilsDir = path.join(cwd, 'lib');

  if (componentName === 'button') {
    // Ensure utils.ts exists
    if (!fs.existsSync(utilsDir)) fs.mkdirSync(utilsDir, { recursive: true });
    const utilsPath = path.join(utilsDir, 'utils.ts');
    if (!fs.existsSync(utilsPath)) {
      writeFile(utilsPath, `import { clsx, type ClassValue } from "clsx";\nimport { twMerge } from "tailwind-merge";\n\nexport function cn(...inputs: ClassValue[]) {\n  return twMerge(clsx(inputs));\n}\n`);
      log.info('Created lib/utils.ts (please run in project: npm i clsx tailwind-merge)');
    }

    // Ensure ui dir exists
    if (!fs.existsSync(uiDir)) fs.mkdirSync(uiDir, { recursive: true });
    const buttonPath = path.join(uiDir, 'button.tsx');
    if (fs.existsSync(buttonPath)) {
      log.warn('Button component already exists.');
      return;
    }

    writeFile(buttonPath, `import * as React from "react";\nimport { cn } from "../../lib/utils";\n\nexport interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {\n  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';\n  size?: 'default' | 'sm' | 'lg' | 'icon';\n}\n\nexport const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(\n  ({ className, variant = 'default', size = 'default', ...props }, ref) => {\n    const variants: Record<string, string> = {\n      default: 'bg-slate-900 text-slate-50 hover:bg-slate-900/90',\n      destructive: 'bg-red-500 text-slate-50 hover:bg-red-500/90',\n      outline: 'border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900',\n      secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-100/80',\n      ghost: 'hover:bg-slate-100 hover:text-slate-900',\n      link: 'text-slate-900 underline-offset-4 hover:underline',\n    };\n    const sizes: Record<string, string> = {\n      default: 'h-10 px-4 py-2',\n      sm: 'h-9 rounded-md px-3',\n      lg: 'h-11 rounded-md px-8',\n      icon: 'h-10 w-10',\n    };\n    const classes = cn(\n      'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',\n      variants[variant],\n      sizes[size],\n      className\n    );\n    return <button className={classes} ref={ref} {...props} />;\n  }\n);\nButton.displayName = "Button";\n`);
    log.success('Installed component: Button (components/ui/button.tsx)');
  } else {
    log.error(`Component "${componentName}" is not available yet in the mock registry.`);
  }
}

// ============================================================================
// Run
// ============================================================================

main().catch(err => {
  log.error(err.message);
  process.exit(1);
});
