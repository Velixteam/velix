export interface HMRMessage {
    type: 'file-changed' | 'file-added' | 'file-removed' | 'full-reload' | 'compile-done' | 'boundary-error';
    file?: string;
    affectedModules?: string[];
    error?: string;
    timestamp: number;
}
export type HMRBroadcaster = (msg: HMRMessage) => void;
export declare class HMRBridge {
    private broadcaster;
    setBroadcaster(broadcaster: HMRBroadcaster): void;
    notifyFileChanged(filePath: string, affectedModules: string[]): void;
    notifyBoundaryError(error: string): void;
}
//# sourceMappingURL=index.d.ts.map