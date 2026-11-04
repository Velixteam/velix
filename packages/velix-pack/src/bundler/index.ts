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

const JS_ENTRY_RE = /\.(?:[cm]?[jt]sx?)$/i;

export class Bundler {
  private projectRoot: string;
  private outDir: string;
  private minify: boolean;
  private sourcemap: boolean;

  constructor(options: BundlerOptions) {
    this.projectRoot = path.resolve(options.projectRoot);
    this.outDir = path.resolve(options.outDir);
    this.minify = options.minify ?? false;
    this.sourcemap = options.sourcemap ?? true;
  }

  public async bundle(moduleGraph: ModuleGraph): Promise<Chunk[]> {
    const splitter = new CodeSplitter(moduleGraph);
    const chunks = splitter.splitIntoChunks();
    const allModules = Array.from(moduleGraph.getAllModules().values());

    // CSS is an asset, not a JavaScript entry point. It is emitted by the
    // browser build when imported by a client module.
    const serverFiles = allModules
      .filter(m => m.type !== 'client' && JS_ENTRY_RE.test(m.path) && fs.existsSync(m.path))
      .map(m => m.path);
    const clientFiles = allModules
      .filter(m => m.type === 'client' && JS_ENTRY_RE.test(m.path) && fs.existsSync(m.path))
      .map(m => m.path);

    const serverOutDir = path.join(this.outDir, 'server');
    const clientOutDir = path.join(this.outDir, 'client');
    fs.mkdirSync(serverOutDir, { recursive: true });
    fs.mkdirSync(clientOutDir, { recursive: true });

    const common = {
      outbase: this.projectRoot,
      minify: this.minify,
      sourcemap: this.sourcemap,
      target: ['es2022'],
      logLevel: 'silent' as const,
      treeShaking: true,
      legalComments: 'none' as const,
    };

    // Bundle local server code while leaving runtime dependencies to Node.
    if (serverFiles.length > 0) {
      await esbuild.build({
        ...common,
        entryPoints: serverFiles,
        outdir: serverOutDir,
        bundle: true,
        splitting: false,
        format: 'esm',
        platform: 'node',
        packages: 'external',
        target: 'node18',
        jsx: 'automatic',
        external: ['*.css'],
      });
    }

    // Browser entries share a single ESM chunk graph instead of emitting
    // one unbundled file per source module.
    if (clientFiles.length > 0) {
      await esbuild.build({
        ...common,
        entryPoints: clientFiles,
        outdir: clientOutDir,
        bundle: true,
        splitting: true,
        format: 'esm',
        platform: 'browser',
        jsx: 'automatic',
        external: ['react', 'react-dom', 'react-dom/client'],
        entryNames: '[dir]/[name]-[hash]',
        chunkNames: 'chunks/[name]-[hash]',
        assetNames: 'assets/[name]-[hash]',
      });
    }

    return chunks;
  }
}
