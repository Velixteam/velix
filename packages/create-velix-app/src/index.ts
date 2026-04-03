#!/usr/bin/env node

/**
 * create-velix-app
 * Create a new Velix v5 project with one command
 *
 * Usage: npx create-velix-app my-app
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import pc from 'picocolors';
import prompts from 'prompts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VERSION = '5.0.5';

async function main() {
  console.log('');
  console.log(`  ${pc.cyan('▲')} ${pc.bold('Create Velix App')} ${pc.dim(`v${VERSION}`)}`);
  console.log(`  ${pc.dim('──────────────────────────────────────────────')}`);
  console.log('');

  let projectName = process.argv[2];

  if (!projectName) {
    const response = await prompts({
      type: 'text',
      name: 'name',
      message: 'Project name:',
      initial: 'my-velix-app',
    });
    projectName = response.name;
    if (!projectName) process.exit(0);
  }

  const projectDir = path.resolve(process.cwd(), projectName);

  if (fs.existsSync(projectDir)) {
    console.log(`  ${pc.red('✖')} Directory ${pc.bold(projectName)} already exists`);
    process.exit(1);
  }

  let template = 'default';
  const templateArgIndex = process.argv.indexOf('--template');
  if (templateArgIndex > -1 && process.argv.length > templateArgIndex + 1) {
    template = process.argv[templateArgIndex + 1];
  } else {
    const response = await prompts({
      type: 'select',
      name: 'template',
      message: 'Select a template:',
      choices: [
        { title: '✨ Default', description: 'Full Velix app with examples', value: 'default' },
        { title: '⚡ Minimal', description: 'Bare minimum setup', value: 'minimal' },
        { title: '📝 Blog', description: 'Blog starter', value: 'blog' },
      ],
    });
    template = response.template;
  }

  if (!template) process.exit(0);

  // Ask for Tailwind
  const { useTailwind } = await prompts({
    type: 'toggle',
    name: 'useTailwind',
    message: 'Use Tailwind CSS?',
    initial: true,
    active: 'yes',
    inactive: 'no',
  });

  const packageManager = 'npm';

  console.log('');
  console.log(`  Creating ${pc.bold(projectName)}...`);

  // Create project from template
  fs.mkdirSync(projectDir, { recursive: true });

  // Copy template files
  const templateDir = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'templates', template);

  if (fs.existsSync(templateDir)) {
    copyDir(templateDir, projectDir);
  } else {
    // Inline template generation
    generateTemplate(projectDir, projectName, template, useTailwind);
  }

  // Install dependencies
  console.log(`  Installing dependencies with ${pc.cyan('npm')}...`);
  console.log('');

  try {
    execSync('npm install', { cwd: projectDir, stdio: 'inherit' });
  } catch {
    console.log(`  ${pc.yellow('⚠')} Could not install dependencies. Run manually.`);
  }

  console.log('');
  console.log(`  ${pc.green('✔')} ${pc.bold(projectName)} created successfully!`);
  console.log('');
  console.log(`  ${pc.bold('Get started:')}`);
  console.log(`    ${pc.dim('$')} cd ${projectName}`);
  console.log(`    ${pc.dim('$')} npm run dev`);
  console.log('');
}

function generateTemplate(dir: string, name: string, template: string, useTailwind: boolean = true) {
  // package.json
  const pkg: any = {
    name, version: '0.1.0', private: true, type: 'module',
    scripts: { 
      dev: 'velix dev', 
      build: 'velix build', 
      start: 'velix start' 
    },
    dependencies: { '@teamvelix/velix': 'latest', react: '^19.0.0', 'react-dom': '^19.0.0' },
    devDependencies: { '@teamvelix/cli': 'latest', typescript: '^5.7.0', '@types/react': '^19.0.0', '@types/react-dom': '^19.0.0' },
  };

  if (useTailwind) {
    pkg.devDependencies = {
      ...pkg.devDependencies,
      'tailwindcss': '^4.0.0',
      '@tailwindcss/cli': '^4.0.0',
    };
  }

  write(path.join(dir, 'package.json'), JSON.stringify(pkg, null, 2));

  // velix.config.ts
  write(path.join(dir, 'velix.config.ts'), `import { defineConfig${useTailwind ? ', tailwindPlugin' : ''} } from "@teamvelix/velix";\n\nexport default defineConfig({\n  app: { name: "${name}" },\n  server: { port: 3000, host: "localhost" },\n  seo: { sitemap: true, robots: true, openGraph: true },\n  favicon: "/favicon.webp",\n  ${useTailwind ? `plugins: [\n    tailwindPlugin()\n  ],` : 'plugins: [],'}\n});\n`);

  // tsconfig.json
  write(path.join(dir, 'tsconfig.json'), JSON.stringify({
    compilerOptions: { target: 'ES2022', module: 'ESNext', moduleResolution: 'bundler', jsx: 'react-jsx', strict: true, esModuleInterop: true, skipLibCheck: true },
    include: ['app/**/*.ts', 'app/**/*.tsx', 'server/**/*.ts'],
    exclude: ['node_modules', '.velix']
  }, null, 2));

  // app/
  fs.mkdirSync(path.join(dir, 'app'), { recursive: true });
  write(path.join(dir, 'app', 'globals.css'), useTailwind ? `@import "tailwindcss";\n\n@theme {\n  --color-velix-primary: #1E3A8A;\n  --color-velix-accent: #2563EB;\n  --color-velix-cyan: #22D3EE;\n  --color-velix-dark: #0F172A;\n}\n` : `body { margin: 0; font-family: sans-serif; }\n`);

  write(path.join(dir, 'app', 'layout.tsx'), `import "./globals.css";\n\nexport const metadata = { title: "${name}", description: "Built with Velix v5" };\n\nexport default function RootLayout({ children }: { children: React.ReactNode }) {\n  return <html lang="en"><body className="${useTailwind ? 'bg-velix-dark text-slate-100' : 'bg-slate-900 text-white'} min-h-screen font-sans antialiased">{children}</body></html>;\n}\n`);
  write(path.join(dir, 'app', 'page.tsx'), `export const metadata = { title: "Welcome to ${name}" };\n\nexport default function HomePage() {\n  return (\n    <main className="min-h-screen flex flex-col items-center justify-center p-8 ${useTailwind ? 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-velix-primary/40 via-velix-dark to-velix-dark' : 'bg-slate-950'} text-white relative overflow-hidden">\n      ${useTailwind ? `{/* Background glow effects */}\n      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-velix-accent/20 rounded-full blur-[120px] pointer-events-none"></div>\n      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-velix-cyan/10 rounded-full blur-[120px] pointer-events-none"></div>\n      ` : ''}\n      <div className="z-10 ${useTailwind ? 'bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl' : 'bg-slate-900/50 border border-slate-800'} p-12 rounded-3xl text-center max-w-2xl w-full">\n        <div className="flex justify-center mb-8">\n          <div className="w-20 h-20 ${useTailwind ? 'bg-gradient-to-br from-velix-accent to-velix-cyan shadow-velix-accent/50 rotate-3' : 'bg-blue-600 shadow-blue-500/50'} rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:rotate-0 duration-300">\n            <span className="text-4xl font-black text-white">V</span>\n          </div>\n        </div>\n        \n        <h1 className="text-5xl md:text-6xl font-extrabold mb-6 tracking-tight ${useTailwind ? 'bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400' : 'text-white'}">\n          Welcome to <br/><span className="${useTailwind ? 'text-transparent bg-clip-text bg-gradient-to-r from-velix-cyan to-velix-accent' : 'text-blue-400'}">${name}</span>\n        </h1>\n        \n        <p className="text-xl text-slate-300 mb-8 max-w-lg mx-auto leading-relaxed">\n          You are running the incredibly fast <strong>Velix v5</strong> framework. Experience the future of React development.\n        </p>\n        \n        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">\n          <button className="w-full sm:w-auto px-8 py-3.5 ${useTailwind ? 'bg-velix-accent hover:bg-velix-accent/80 shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'bg-blue-600 hover:bg-blue-500'} text-white font-semibold rounded-xl transition-all transform hover:-translate-y-1">\n            Get Started\n          </button>\n          <button className="w-full sm:w-auto px-8 py-3.5 ${useTailwind ? 'bg-white/5 hover:bg-white/10 border border-white/10' : 'bg-slate-800 hover:bg-slate-700 border border-slate-700'} text-white font-semibold rounded-xl transition-all">\n            Read Docs\n          </button>\n        </div>\n      </div>\n      \n      <div className="absolute bottom-8 text-sm text-slate-500 font-mono tracking-wider">\n        VELIX &copy; 2026\n      </div>\n    </main>\n  );\n}\n`);

  // public/
  fs.mkdirSync(path.join(dir, 'public'), { recursive: true });

  if (template !== 'minimal') {
    // server/api/
    fs.mkdirSync(path.join(dir, 'server', 'api'), { recursive: true });
    write(path.join(dir, 'server', 'api', 'hello.ts'), `export function GET() { return Response.json({ message: "Hello from Velix!" }); }\n`);
  }

  if (template === 'blog') {
    // app/blog/page.tsx
    fs.mkdirSync(path.join(dir, 'app', 'blog'), { recursive: true });
    write(path.join(dir, 'app', 'blog', 'page.tsx'), `export const metadata = {
  title: "Blog",
  description: "Latest articles from our team",
};

export default function BlogPage() {
  return (
    <main className="min-h-screen \${useTailwind ? 'bg-velix-dark text-white' : ''}">
      <div className="max-w-4xl mx-auto px-6 py-24">
        <header className="mb-16 border-b border-white/10 pb-12">
          <h1 className="text-6xl font-black tracking-tighter mb-4 \${useTailwind ? 'text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400' : ''}">Journal</h1>
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
    write(path.join(dir, 'app', 'blog', 'post', '[slug]', 'page.tsx'), `export default function BlogPost({ params }: { params: { slug: string } }) {
  return (
    <article className="min-h-screen \${useTailwind ? 'bg-velix-dark text-slate-100' : ''}">
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
    write(path.join(dir, 'app', 'blog', 'id', '[id]', 'page.tsx'), `export default function BlogIdPost({ params }: { params: { id: string } }) {
  return (
    <main className="min-h-screen \${useTailwind ? 'bg-velix-dark text-white' : ''} flex items-center justify-center">
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

function write(filePath: string, content: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function copyDir(src: string, dest: string) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

main().catch(err => {
  console.error(`  ${pc.red('✖')} ${err.message}`);
  process.exit(1);
});
