import { ModuleType } from '../types.js';

export interface TransformResultJSON {
  code: string;
  imports: string[];
  type: ModuleType;
}

export async function transformJSON(filePath: string, content: string): Promise<TransformResultJSON> {
  let code = '';
  try {
    const json = JSON.parse(content);
    code = `export default ${JSON.stringify(json)};`;
  } catch {
    code = `export default {};`;
  }

  return {
    code,
    imports: [],
    type: 'shared',
  };
}
