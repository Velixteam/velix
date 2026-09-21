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

    const allModules = Array.from(moduleGraph.getAllModules().values());
    const serverFiles = allModules
      .filter(m => m.type !== 'client' && fs.existsSync(m.path))
      .map(m => m.path);

    const clientFiles = allModules
      .filter(m => m.type === 'client' && fs.existsSync(m.path))
      .map(m => m.path);

    const serverOutDir = path.join(this.outDir, 'server');
    const clientOutDir = path.join(this.outDir, 'client');

    if (!fs.existsSync(serverOutDir)) fs.mkdirSync(serverOutDir, { recursive: true });
    if (!fs.existsSync(clientOutDir)) fs.mkdirSync(clientOutDir, { recursive: true });

    // 1. Bundle server modules
    if (serverFiles.length > 0) {
      await esbuild.build({
        entryPoints: serverFiles,
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
    }

    // 2. Bundle client modules
    if (clientFiles.length > 0) {
      await esbuild.build({
        entryPoints: clientFiles,
        outdir: clientOutDir,
        bundle: false,
        format: 'esm',
        platform: 'browser',
        target: 'es2022',
        minify: this.minify,
        sourcemap: this.sourcemap,
        jsx: 'automatic',
        logLevel: 'silent',
      });
    }

    return chunks;
  }
}
