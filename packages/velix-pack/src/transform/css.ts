import { ModuleType } from '../types.js';

export interface TransformResultCSS {
  code: string;
  imports: string[];
  type: ModuleType;
}

export async function transformCSS(filePath: string, content: string): Promise<TransformResultCSS> {
  // CSS transform simply packages CSS or passes it along
  return {
    code: content,
    imports: [],
    type: 'shared',
  };
}
