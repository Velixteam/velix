export interface ChunkOptions {
  name: string;
  isInitial?: boolean;
  type: 'server' | 'client' | 'shared';
}

export class Chunk {
  public name: string;
  public isInitial: boolean;
  public type: 'server' | 'client' | 'shared';
  public modules: Set<string> = new Set();
  public size: number = 0;

  constructor(options: ChunkOptions) {
    this.name = options.name;
    this.isInitial = options.isInitial ?? false;
    this.type = options.type;
  }

  public addModule(moduleId: string, moduleSize: number = 0): void {
    this.modules.add(moduleId);
    this.size += moduleSize;
  }
}
