/**
 * `velix create <name>` — Create a new Velix project
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pc from 'picocolors';
import prompts from 'prompts';
import { VERSION } from '../version.js';
import { showBanner, log, writeFile } from './shared.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createCommand(name?: string) {
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
  const flags = process.argv.slice(3);
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

  if (useTailwind === undefined) {
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
    generateProjectFiles(projectDir, name, template, useTailwind, useShadcn);
    spinner.succeed(`Project ${pc.bold(name)} created!`);
    log.blank();
    console.log(`  ${pc.bold('Next steps:')}`);
    console.log(`    ${pc.dim('$')} cd ${name}`);
    console.log(`    ${pc.dim('$')} npm install`);
    console.log(`    ${pc.dim('$')} npm run dev`);
    log.blank();
  } catch (err: unknown) {
    spinner.fail('Failed to create project');
    log.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

interface PackageJson {
  name: string;
  version: string;
  private: boolean;
  type: string;
  scripts: Record<string, string>;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
}

function generateProjectFiles(dir: string, name: string, template: string, useTailwind: boolean = true, useShadcn: boolean = false) {
  const pkg: PackageJson = {
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
    writeFile(path.join(dir, 'tailwind.config.ts'), `import type { Config } from "tailwindcss";\n\nexport default {\n  content: [\n    "./index.html",\n    "./app/**/*.{js,ts,jsx,tsx}",\n    "./components/**/*.{js,ts,jsx,tsx}",\n    "./lib/**/*.{js,ts,jsx,tsx}",\n    "./src/**/*.{js,ts,jsx,tsx}",\n  ],\n} satisfies Config;\n`);
  }

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

  if (template === 'minimal') {
    writeFile(path.join(dir, 'app', 'page.tsx'), `export const metadata = {\n  title: "${name}",\n};\n\nexport default function MinimalPage() {\n  return (\n    <main className="min-h-screen flex flex-col items-center justify-center bg-[#0F172A] text-slate-100 font-sans">\n      <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Velix</h1>\n      <p className="text-slate-400">Minimal starter.</p>\n    </main>\n  );\n}\n`);
  } else {
    // Full template with components...
    fs.mkdirSync(path.join(dir, 'components', 'ui'), { recursive: true });

    let buttonCode = `import React from 'react';\n\nexport interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {\n  variant?: 'primary' | 'secondary';\n}\n\nexport const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(\n  ({ className = '', variant = 'primary', ...props }, ref) => {\n    const base = "inline-flex flex-row gap-2 items-center justify-center font-medium transition-all duration-300 h-12 rounded-xl px-8 focus:outline-none focus:ring-2 focus:ring-velix-cyan/50";\n    const variants = {\n      primary: "bg-gradient-to-r from-velix-accent to-velix-cyan text-white shadow-[0_0_20px_rgba(34,211,238,0.25)] hover:shadow-[0_0_30px_rgba(34,211,238,0.45)]",\n      secondary: "bg-white/5 text-slate-200 border border-white/10 hover:bg-white/10 hover:border-velix-cyan/30"\n    };\n    return <button ref={ref} className={\`\${base} \${variants[variant]} \${className}\`} {...props} />;\n  }\n);\nButton.displayName = "Button";\n`;

    if (useShadcn) {
      fs.mkdirSync(path.join(dir, 'lib'), { recursive: true });
      writeFile(path.join(dir, 'lib', 'utils.ts'), `import { clsx, type ClassValue } from "clsx";\nimport { twMerge } from "tailwind-merge";\n\nexport function cn(...inputs: ClassValue[]) {\n  return twMerge(clsx(inputs));\n}\n`);
      buttonCode = `import * as React from "react";\nimport { cn } from "../../lib/utils";\n\nexport interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {\n  variant?: 'primary' | 'secondary';\n}\n\nexport const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(\n  ({ className, variant = 'primary', ...props }, ref) => {\n    const classes = cn(\n      "inline-flex flex-row gap-2 items-center justify-center font-medium transition-all duration-300 h-12 rounded-xl px-8 focus:outline-none focus:ring-2 focus:ring-velix-cyan/50",\n      variant === 'primary' ? "bg-gradient-to-r from-velix-accent to-velix-cyan text-white shadow-[0_0_20px_rgba(34,211,238,0.25)] hover:shadow-[0_0_30px_rgba(34,211,238,0.45)]" : "bg-white/5 text-slate-200 border border-white/10 hover:bg-white/10 hover:border-velix-cyan/30",\n      className\n    );\n    return <button className={classes} ref={ref} {...props} />;\n  }\n);\nButton.displayName = "Button";\n`;
    }
    writeFile(path.join(dir, 'components', 'ui', 'button.tsx'), buttonCode);

    const cardClasses = "group relative p-8 bg-velix-dark/60 border border-white/5 rounded-2xl hover:border-velix-cyan/20 transition-colors duration-300 overflow-hidden";
    const cardGradient = "absolute inset-0 bg-gradient-to-br from-velix-accent/0 to-velix-cyan/0 group-hover:from-velix-accent/5 group-hover:to-velix-cyan/5 transition-all duration-500";
    const cardCode = useShadcn
      ? `import React from "react";\nimport { cn } from "../../lib/utils";\n\nexport function Card({ title, description, className = '' }: { title: string; description: string; className?: string }) {\n  return (\n    <div className={cn("${cardClasses}", className)}>\n      <div className="${cardGradient}"></div>\n      <h3 className="text-xl font-semibold text-slate-100 mb-3 relative z-10">{title}</h3>\n      <p className="text-sm text-slate-400 leading-relaxed relative z-10">{description}</p>\n    </div>\n  );\n}\n`
      : `import React from "react";\n\nexport function Card({ title, description, className = '' }: { title: string; description: string; className?: string }) {\n  return (\n    <div className={"${cardClasses} " + className}>\n      <div className="${cardGradient}"></div>\n      <h3 className="text-xl font-semibold text-slate-100 mb-3 relative z-10">{title}</h3>\n      <p className="text-sm text-slate-400 leading-relaxed relative z-10">{description}</p>\n    </div>\n  );\n}\n`;
    writeFile(path.join(dir, 'components', 'ui', 'card.tsx'), cardCode);

    writeFile(path.join(dir, 'app', 'page.tsx'), `import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";

export const metadata = {
  title: "Welcome to Velix",
  description: "Build fast. Ship faster.",
};

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-b from-[#0B1628] via-velix-dark to-velix-deep text-slate-100 font-sans relative overflow-hidden">
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
            <Button variant="primary" className="w-full">Get Started</Button>
          </a>
          <a href="https://teamvelix.vercel.app" target="_blank" rel="noreferrer" className="w-full sm:w-auto">
            <Button variant="secondary" className="w-full">Documentation</Button>
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
    fs.mkdirSync(path.join(dir, 'server', 'api'), { recursive: true });
    writeFile(path.join(dir, 'server', 'api', 'hello.ts'), `export function GET() {
  return Response.json({ message: "Hello from Velix API!" });
}

export function POST(_request: Request) {
  return Response.json({ received: true });
}
`);

    fs.mkdirSync(path.join(dir, 'public'), { recursive: true });
  }

  // Copy favicon
  const logoSrc = path.join(__dirname, '..', 'assets', 'logo.webp');
  if (fs.existsSync(logoSrc)) {
    fs.mkdirSync(path.join(dir, 'public'), { recursive: true });
    fs.copyFileSync(logoSrc, path.join(dir, 'public', 'favicon.webp'));
  }
}
