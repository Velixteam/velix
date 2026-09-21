export declare class RequestDeduplicator {
    private inFlight;
    dedupe<T>(key: string, fn: () => Promise<T>): Promise<T>;
}
//# sourceMappingURL=deduplicator.d.ts.map