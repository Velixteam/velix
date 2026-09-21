export interface TailwindPluginOptions {
    input?: string;
    output?: string;
    config?: string;
    minify?: boolean;
}
/**
 * Native Velix Tailwind CSS Plugin
 * Automatically handles CSS compilation and injection.
 * Supports both Tailwind CSS v3 and v4.
 */
export default function tailwindPlugin(options?: TailwindPluginOptions): import("./index.js").VelixPluginDefinition;
//# sourceMappingURL=tailwind.d.ts.map