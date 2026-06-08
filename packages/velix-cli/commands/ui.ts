/**
 * `velix ui <add> <component>` — Install UI components
 */
import fs from 'fs';
import path from 'path';
import { log, writeFile } from './shared.js';

export async function handleUiCommand(args: string[]) {
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
