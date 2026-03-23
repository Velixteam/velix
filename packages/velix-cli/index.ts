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

const VERSION = '5.0.0';

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
          { title: '📝 Blog', value: 'blog' },
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

  const { default: ora } = await import('ora');
  const spinner = ora('Creating project...').start();

  try {
    fs.mkdirSync(projectDir, { recursive: true });

    // Generate project files based on template
    generateProjectFiles(projectDir, name, template, useTailwind);

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

function generateProjectFiles(dir: string, name: string, template: string, useTailwind: boolean = true) {
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
      velix: `^${VERSION}`,
      react: '^19.0.0',
      'react-dom': '^19.0.0',
    },
    devDependencies: {
      'velix-cli': `^${VERSION}`,
      typescript: '^5.7.0',
      '@types/react': '^19.0.0',
      '@types/react-dom': '^19.0.0',
    },
  };

  if (useTailwind) {
    pkg.devDependencies = {
      ...pkg.devDependencies,
      'tailwindcss': '^3.4.1',
      'postcss': '^8.4.35',
      'autoprefixer': '^10.4.17',
    };
  }

  writeFile(path.join(dir, 'package.json'), JSON.stringify(pkg, null, 2));

  // velix.config.ts
  writeFile(path.join(dir, 'velix.config.ts'), `import { defineConfig${useTailwind ? ', tailwindPlugin' : ''} } from "velix";

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
    // Tailwind configuration
    writeFile(path.join(dir, 'tailwind.config.ts'), `import type { Config } from "tailwindcss";\n\nexport default {\n  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],\n  theme: {\n    extend: {\n      colors: {\n        velix: {\n          primary: "#1E3A8A",\n          accent: "#2563EB",\n          cyan: "#22D3EE",\n          dark: "#0F172A",\n        }\n      }\n    },\n  },\n  plugins: [],\n} satisfies Config;\n`);
    writeFile(path.join(dir, 'postcss.config.js'), `export default {\n  plugins: {\n    tailwindcss: {},\n    autoprefixer: {},\n  },\n};\n`);
  }
  
  // app/layout.tsx
  fs.mkdirSync(path.join(dir, 'app'), { recursive: true });
  writeFile(path.join(dir, 'app', 'globals.css'), useTailwind ? `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n` : `body { margin: 0; font-family: sans-serif; }\n`);
  
  writeFile(path.join(dir, 'app', 'layout.tsx'), `import "./globals.css";

export const metadata = {
  title: "${name}",
  description: "Built with Velix v5",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="${useTailwind ? 'bg-velix-dark text-slate-100' : 'bg-slate-900 text-white'} min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
`);

  // app/page.tsx
  writeFile(path.join(dir, 'app', 'page.tsx'), `export const metadata = {
  title: "Welcome to ${name}",
};

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 ${useTailwind ? 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-velix-primary/40 via-velix-dark to-velix-dark' : 'bg-slate-950'} text-white relative overflow-hidden">
      ${useTailwind ? `{/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-velix-accent/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-velix-cyan/10 rounded-full blur-[120px] pointer-events-none"></div>` : ''}
      
      <div className="z-10 ${useTailwind ? 'bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl' : 'bg-slate-900/50 border border-slate-800'} p-12 rounded-3xl text-center max-w-2xl w-full">
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 ${useTailwind ? 'bg-gradient-to-br from-velix-accent to-velix-cyan' : 'bg-blue-600'} rounded-2xl flex items-center justify-center shadow-lg rotate-3 transition-transform hover:rotate-0 duration-300">
            <span className="text-4xl font-black text-white">V</span>
          </div>
        </div>
        
        <h1 className="text-5xl md:text-6xl font-extrabold mb-6 tracking-tight ${useTailwind ? 'bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400' : 'text-white'}">
          Welcome to <br/><span className="${useTailwind ? 'text-transparent bg-clip-text bg-gradient-to-r from-velix-cyan to-velix-accent' : 'text-blue-400'}">${name}</span>
        </h1>
        
        <p className="text-xl text-slate-300 mb-8 max-w-lg mx-auto leading-relaxed">
          You are running the incredibly fast <strong>Velix v5</strong> framework. Experience the future of React development.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button className="w-full sm:w-auto px-8 py-3.5 ${useTailwind ? 'bg-velix-accent hover:bg-velix-accent/80 shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all transform hover:-translate-y-1' : 'bg-blue-600 hover:bg-blue-500'} text-white font-semibold rounded-xl">
            Get Started
          </button>
          <button className="w-full sm:w-auto px-8 py-3.5 ${useTailwind ? 'bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl border border-white/10' : 'bg-slate-800 hover:bg-slate-700'} transition-all">
            Read Docs
          </button>
        </div>
      </div>
      
      <div className="absolute bottom-8 text-sm text-slate-500 font-mono tracking-wider">
        VELIX &copy; 2026
      </div>
    </main>
  );
}
`);

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

  if (template === 'blog') {
    // app/blog/page.tsx
    fs.mkdirSync(path.join(dir, 'app', 'blog'), { recursive: true });
    writeFile(path.join(dir, 'app', 'blog', 'page.tsx'), `export const metadata = {
  title: "Blog",
  description: "Latest articles from our team",
};

export default function BlogPage() {
  return (
    <main className="min-h-screen ${useTailwind ? 'bg-velix-dark text-white' : ''}">
      <div className="max-w-4xl mx-auto px-6 py-24">
        <header className="mb-16 border-b border-white/10 pb-12">
          <h1 className="text-6xl font-black tracking-tighter mb-4 ${useTailwind ? 'text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400' : ''}">Journal</h1>
          <p className="text-xl text-slate-400 max-w-lg">Thoughts on software, design, and building the future with Velix.</p>
        </header>

        <div className="grid gap-12">
          {[
            { id: "1", slug: "hello-world", title: "The future of React is Velix", date: "Mar 21, 2026", excerpt: "Exploring the seamless synergy between React 19 and the Velix engine." },
            { id: "2", slug: "modern-styling", title: "Styling with purpose", date: "Mar 18, 2026", excerpt: "How we use Tailwind and CSS variables to create stunning dark mode interfaces." }
          ].map((post) => (
            <article key={post.id} className="group relative">
              <span className="text-sm font-bold text-velix-accent mb-2 block uppercase tracking-widest">{post.date}</span>
              <h2 className="text-3xl font-bold mb-4 group-hover:text-velix-cyan transition-colors">
                <a href={"/blog/post/" + post.slug}>{post.title}</a>
              </h2>
              <p className="text-slate-400 leading-relaxed mb-6 text-lg">{post.excerpt}</p>
              <a href={"/blog/id/" + post.id} className="text-sm font-semibold text-slate-500 hover:text-white transition-colors border-b border-white/10 pb-1 inline-block">Read full ID route &rarr;</a>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
`);

    // app/blog/post/[slug]/page.tsx
    fs.mkdirSync(path.join(dir, 'app', 'blog', 'post', '[slug]'), { recursive: true });
    writeFile(path.join(dir, 'app', 'blog', 'post', '[slug]', 'page.tsx'), `export default function BlogPost({ params }: { params: { slug: string } }) {
  return (
    <article className="min-h-screen ${useTailwind ? 'bg-velix-dark text-slate-100' : ''}">
      <div className="max-w-3xl mx-auto px-6 py-24">
        <a href="/blog" className="text-velix-accent font-bold mb-8 block hover:translate-x-[-4px] transition-transform w-fit">&larr; Back to Journal</a>
        <header className="mb-12">
           <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-tight capitalize">{params.slug.replace(/-/g, ' ')}</h1>
        </header>
        <div className="prose prose-invert max-w-none">
          <p className="text-xl leading-relaxed text-slate-300 mb-8">
            This article explores <strong>{params.slug}</strong> in depth. In Velix v5, dynamic routing is handled at the edge, providing near-instantaneous page transitions and perfect SEO out of the box.
          </p>
          <div className="bg-white/5 p-8 rounded-2xl border border-white/10 italic text-slate-400">
            "Design is not just what it looks like and feels like. Design is how it works."
          </div>
        </div>
      </div>
    </article>
  );
}
`);

    // app/blog/id/[id]/page.tsx
    fs.mkdirSync(path.join(dir, 'app', 'blog', 'id', '[id]'), { recursive: true });
    writeFile(path.join(dir, 'app', 'blog', 'id', '[id]', 'page.tsx'), `export default function BlogIdPost({ params }: { params: { id: string } }) {
  return (
    <main className="min-h-screen ${useTailwind ? 'bg-velix-dark text-white' : ''} flex items-center justify-center">
      <div className="max-w-xl text-center p-12 bg-white/5 backdrop-blur-3xl rounded-3xl border border-white/10">
        <span className="bg-velix-accent/20 text-velix-accent px-4 py-1 rounded-full text-sm font-bold mb-6 inline-block">ID ROUTE</span>
        <h1 className="text-4xl font-black mb-4">Post Reference: #{params.id}</h1>
        <p className="text-slate-400 mb-8 text-lg">Looking for a specific record? Velix allows you to mix route patterns seamlessly.</p>
        <a href="/blog" className="text-velix-cyan hover:underline font-semibold">Back to Blog</a>
      </div>
    </main>
  );
}
`);
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
  const child = spawn('npx', ['tsx', 'node_modules/velix/runtime/start-dev.ts'], {
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
  const child = spawn('npx', ['tsx', 'node_modules/velix/runtime/start-build.ts'], {
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
  const child = spawn('npx', ['tsx', 'node_modules/velix/runtime/start-prod.ts'], {
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

// ============================================================================
// Run
// ============================================================================

main().catch(err => {
  log.error(err.message);
  process.exit(1);
});
