export interface ChunkOptions {
    name: string;
    isInitial?: boolean;
    type: 'server' | 'client' | 'shared';
}
export declare class Chunk {
    name: string;
    isInitial: boolean;
    type: 'server' | 'client' | 'shared';
    modules: Set<string>;
    size: number;
    constructor(options: ChunkOptions);
    addModule(moduleId: string, moduleSize?: number): void;
}
//# sourceMappingURL=chunk.d.ts.map