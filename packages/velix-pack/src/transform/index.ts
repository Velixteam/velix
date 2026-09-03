import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Resolver } from '../resolver/index.js';
import { transformTypeScript } from './typescript.js';
import { transformCSS } from './css.js';
import { transformJSON } from './json.js';
import { TransformResult } from '../types.js';

export class TransformPipeline {
  private resolver: Resolver;

  constructor(resolver: Resolver) {
    this.resolver = resolver;
  }

  public async transform(filePath: string): Promise<TransformResult> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const hash = crypto.createHash('md5').update(content).digest('hex');
    const ext = path.extname(filePath);

    if (ext === '.ts' || ext === '.tsx' || ext === '.js' || ext === '.jsx') {
      const result = await transformTypeScript(filePath, content, this.resolver);
      return { ...result, hash };
    } else if (ext === '.css') {
      const result = await transformCSS(filePath, content);
      return { ...result, hash };
    } else if (ext === '.json') {
      const result = await transformJSON(filePath, content);
      return { ...result, hash };
    }

    return {
      code: content,
      imports: [],
      type: 'shared',
      hash,
    };
  }
}
