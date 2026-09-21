export type ErrorBoundaryType = 'error' | 'not-found';
export interface ResolvedBoundary {
    filePath: string;
    type: ErrorBoundaryType;
    scope: string;
}
export declare function getErrorBoundaryType(error: unknown): ErrorBoundaryType;
export declare function resolveErrorBoundary(routeFilePath: string, appDir: string, type: ErrorBoundaryType): ResolvedBoundary | null;
//# sourceMappingURL=error-cascade.d.ts.map