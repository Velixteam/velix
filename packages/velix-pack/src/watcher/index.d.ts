export interface WatcherEvents {
    onChange: (filePath: string) => void;
    onAdd: (filePath: string) => void;
    onUnlink: (filePath: string) => void;
}
export declare class FileWatcher {
    private watcher;
    private watchPaths;
    constructor(watchPaths: string[]);
    start(events: WatcherEvents): void;
    close(): void;
}
//# sourceMappingURL=index.d.ts.map