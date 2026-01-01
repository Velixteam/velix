import { defaultTemplate } from './default.js';
import { minimalTemplate } from './minimal.js';
import { appRouterTemplate } from './app-router.js';

export interface Template {
  name: string;
  description: string;
  icon: string;
}

export const TEMPLATES: Record<string, Template> = {
  default: {
    name: 'Default',
    description: 'Pages directory routing',
    icon: '⚡',
  },
  'app-router': {
    name: 'App Router',
    description: 'Next.js style app/ directory',
    icon: '📂',
  },
  minimal: {
    name: 'Minimal',
    description: 'Bare starter',
    icon: '📦',
  },
};

export type TemplateFiles = Record<string, string>;

export interface TemplateOptions {
  styling?: 'tailwind' | 'css';
}

export function getTemplateFiles(templateKey: string, projectName: string, options: TemplateOptions = {}): TemplateFiles {
  switch (templateKey) {
    case 'minimal':
      return minimalTemplate(projectName, options);
    case 'app-router':
      return appRouterTemplate(projectName);
    default:
      return defaultTemplate(projectName, options);
  }
}
