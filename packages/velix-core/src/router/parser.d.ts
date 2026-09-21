/**
 * Creates regex pattern for route matching
 */
export declare function createRoutePattern(routePath: string): RegExp;
/**
 * Extracts parameters from route match
 */
export declare function extractParams(routePath: string, match: RegExpMatchArray): Record<string, string>;
//# sourceMappingURL=parser.d.ts.map