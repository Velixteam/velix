import esbuild from 'esbuild';
import path from 'path';
import fs from 'fs';
import { ModuleGraph } from '../graph/module-graph.js';
import { CodeSplitter } from './code-splitter.js';
import { Chunk } from './chunk.js';

export interface BundlerOptions {
  projectRoot: string;
  outDir: string;
  minify?: boolean;
  sourcemap?: boolean;
}

export class Bundler {
  private projectRoot: string;
  private outDir: string;
  private minify: boolean;
  private sourcemap: boolean;

  constructor(options: BundlerOptions) {
    this.projectRoot = options.projectRoot;
    this.outDir = options.outDir;
    this.minify = options.minify ?? false;
    this.sourcemap = options.sourcemap ?? true;
  }

  public async bundle(moduleGraph: ModuleGraph): Promise<Chunk[]> {
    const splitter = new CodeSplitter(moduleGraph);
    const chunks = splitter.splitIntoChunks();

    const entryFiles = Array.from(moduleGraph.getAllModules().values())
      .map(m => m.path)
      .filter(p => fs.existsSync(p));

    if (entryFiles.length === 0) return chunks;

    const serverOutDir = path.join(this.outDir, 'server');
    const clientOutDir = path.join(this.outDir, 'client');

    if (!fs.existsSync(serverOutDir)) fs.mkdirSync(serverOutDir, { recursive: true });
    if (!fs.existsSync(clientOutDir)) fs.mkdirSync(clientOutDir, { recursive: true });

    // Bundle via esbuild
    await esbuild.build({
      entryPoints: entryFiles,
      outdir: serverOutDir,
      bundle: false,
      format: 'esm',
      platform: 'node',
      target: 'es2022',
      minify: this.minify,
      sourcemap: this.sourcemap,
      jsx: 'automatic',
      logLevel: 'silent',
    });

    return chunks;
  }
}
