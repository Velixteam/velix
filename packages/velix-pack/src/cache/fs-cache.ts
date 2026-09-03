import fs from 'fs';
import path from 'path';
import { CacheEntry } from '../types.js';

export class FSCache {
  private cacheDir: string;
  private memoryCache: Map<string, CacheEntry> = new Map();

  constructor(projectRoot: string) {
    this.cacheDir = path.join(projectRoot, '.velix', 'cache', 'pack');
    this.ensureCacheDir();
  }

  private ensureCacheDir(): void {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  public get(id: string, currentHash: string): CacheEntry | null {
    // 1. Check memory cache first
    const mem = this.memoryCache.get(id);
    if (mem && mem.hash === currentHash) {
      return mem;
    }

    // 2. Check filesystem cache
    const safeFilename = encodeURIComponent(id) + '.json';
    const filePath = path.join(this.cacheDir, safeFilename);

    if (fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const entry: CacheEntry = JSON.parse(raw);
        if (entry.hash === currentHash) {
          this.memoryCache.set(id, entry);
          return entry;
        }
      } catch {
        // Ignored, corrupt entry will be overwritten
      }
    }

    return null;
  }

  public set(id: string, entry: CacheEntry): void {
    this.memoryCache.set(id, entry);

    const safeFilename = encodeURIComponent(id) + '.json';
    const filePath = path.join(this.cacheDir, safeFilename);

    try {
      this.ensureCacheDir();
      fs.writeFileSync(filePath, JSON.stringify(entry), 'utf-8');
    } catch {
      // Non-fatal cache write failure
    }
  }

  public invalidate(id: string): void {
    this.memoryCache.delete(id);
    const safeFilename = encodeURIComponent(id) + '.json';
    const filePath = path.join(this.cacheDir, safeFilename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch {}
    }
  }

  public clear(): void {
    this.memoryCache.clear();
    if (fs.existsSync(this.cacheDir)) {
      try {
        fs.rmSync(this.cacheDir, { recursive: true, force: true });
        this.ensureCacheDir();
      } catch {}
    }
  }
}
