import { defaultTemplate } from './default.js';
import { minimalTemplate } from './minimal.js';
import { appRouterTemplate } from './app-router.js';
import { fullstackTemplate } from './fullstack.js';

export interface Template {
  name: string;
  description: string;
  icon: string;
}

export const TEMPLATES: Record<string, Template> = {
  default: {
    name: 'Default',
    description: 'Full-featured template with routing and components',
    icon: '⚡',
  },
  fullstack: {
    name: 'Fullstack App',
    description: 'Includes FlexiGuard Auth, Drizzle ORM, and API',
    icon: '🚀',
  },
  minimal: {
    name: 'Minimal',
    description: 'Bare minimum FlexiReact setup',
    icon: '📦',
  },
  'app-router': {
    name: 'App Router',
    description: 'Next.js style app/ directory routing',
    icon: '📂',
  },
};

export type TemplateFiles = Record<string, string>;

export interface TemplateOptions {
  styling?: 'tailwind' | 'css';
}

export function getTemplateFiles(templateKey: string, projectName: string, options: TemplateOptions = {}): TemplateFiles {
  switch (templateKey) {
    case 'fullstack':
      return fullstackTemplate(projectName, options);
    case 'minimal':
      return minimalTemplate(projectName, options);
    case 'app-router':
      return appRouterTemplate(projectName);
    default:
      return defaultTemplate(projectName, options);
  }
}
