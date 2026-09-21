export type ApiRoute = {
    pattern: string;
    filePath: string;
    params: string[];
    isCatchAll: boolean;
};
export declare function buildApiManifest(serverDir: string): Promise<ApiRoute[]>;
/** Exported for testing */
export declare function filePathToRoute(filePath: string, serverDir: string): ApiRoute;
export declare function handleApiRequest(req: Request, manifest: ApiRoute[]): Promise<Response | null>;
//# sourceMappingURL=manifest.d.ts.map