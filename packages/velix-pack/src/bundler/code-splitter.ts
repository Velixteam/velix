import path from 'path';
import { ModuleGraph } from '../graph/module-graph.js';
import { Chunk } from './chunk.js';

export class CodeSplitter {
  private moduleGraph: ModuleGraph;

  constructor(moduleGraph: ModuleGraph) {
    this.moduleGraph = moduleGraph;
  }

  public splitIntoChunks(): Chunk[] {
    const chunks: Chunk[] = [];
    const allModules = Array.from(this.moduleGraph.getAllModules().values());

    const serverChunk = new Chunk({ name: 'server-bundle', isInitial: true, type: 'server' });
    const clientInitialChunk = new Chunk({ name: 'client-main', isInitial: true, type: 'client' });
    const routeChunksMap = new Map<string, Chunk>();

    for (const mod of allModules) {
      const estimatedSize = mod.path.length * 10; // rough estimation fallback

      if (mod.type === 'server') {
        serverChunk.addModule(mod.id, estimatedSize);
      } else {
        // Check if it's a route module in app/
        const isRoute = (mod.id.includes('app/') || mod.id.includes('app\\')) && (mod.id.endsWith('page.tsx') || mod.id.endsWith('page.jsx'));
        if (isRoute) {
          const normalizedId = mod.id.replace(/\\/g, '/');
          const routeName = normalizedId
            .replace(/^app\//, '')
            .replace(/(?:^|\/)page\.[tj]sx?$/, '')
            .replace(/[\/\\]/g, '_') || 'home';
          
          let chunk = routeChunksMap.get(routeName);
          if (!chunk) {
            chunk = new Chunk({ name: `route-${routeName}`, isInitial: false, type: 'client' });
            routeChunksMap.set(routeName, chunk);
          }
          chunk.addModule(mod.id, estimatedSize);
        } else {
          clientInitialChunk.addModule(mod.id, estimatedSize);
        }
      }
    }

    chunks.push(serverChunk);
    chunks.push(clientInitialChunk);
    for (const routeChunk of routeChunksMap.values()) {
      chunks.push(routeChunk);
    }

    return chunks;
  }
}
