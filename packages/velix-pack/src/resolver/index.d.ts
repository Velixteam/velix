export interface ResolverOptions {
    projectRoot: string;
    extensions?: string[];
}
export declare class Resolver {
    private projectRoot;
    private aliases;
    private extensions;
    constructor(options: ResolverOptions);
    resolve(importPath: string, importerPath: string): string | null;
    private isAliasMatch;
}
//# sourceMappingURL=index.d.ts.map