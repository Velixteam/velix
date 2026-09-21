/**
 * Velix v5 Logger
 * Minimalist, professional output inspired by modern CLIs
 */
export declare const logger: {
    logo(): void;
    serverStart(config: {
        port: number | string;
        host: string;
        mode: string;
        pagesDir?: string;
    }, startTime?: number): void;
    request(method: string, path: string, status: number, time: number, extra?: {
        type?: string;
    }): void;
    info(msg: string): void;
    success(msg: string): void;
    warn(msg: string): void;
    error(msg: string, err?: Error | null): void;
    compile(file: string, time: number): void;
    hmr(file: string): void;
    plugin(name: string): void;
    route(path: string, type: string): void;
    divider(): void;
    blank(): void;
    portInUse(port: number | string): void;
    build(stats: {
        time: number;
    }): void;
};
export default logger;
//# sourceMappingURL=logger.d.ts.map