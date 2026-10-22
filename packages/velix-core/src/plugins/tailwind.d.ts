export interface TailwindPluginOptions {
    input?: string;
    output?: string;
    config?: string;
    minify?: boolean;
}
export declare function compileTailwindHashed(projectRoot: string, options?: TailwindPluginOptions & {
    outDir?: string;
}): {
    hashedFileName: string;
    hashedUrl: string;
    hash: string;
    outputPath: string;
};
export default function tailwindPlugin(options?: TailwindPluginOptions): import("./index.js").VelixPluginDefinition;
//# sourceMappingURL=tailwind.d.ts.map