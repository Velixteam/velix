export interface HMRMessage {
  type: 'file-changed' | 'file-added' | 'file-removed' | 'full-reload' | 'compile-done' | 'boundary-error';
  file?: string;
  affectedModules?: string[];
  error?: string;
  timestamp: number;
}

export type HMRBroadcaster = (msg: HMRMessage) => void;

export class HMRBridge {
  private broadcaster: HMRBroadcaster | null = null;

  public setBroadcaster(broadcaster: HMRBroadcaster): void {
    this.broadcaster = broadcaster;
  }

  public notifyFileChanged(filePath: string, affectedModules: string[]): void {
    if (this.broadcaster) {
      this.broadcaster({
        type: 'file-changed',
        file: filePath,
        affectedModules,
        timestamp: Date.now(),
      });
    }
  }

  public notifyBoundaryError(error: string): void {
    if (this.broadcaster) {
      this.broadcaster({
        type: 'boundary-error',
        error,
        timestamp: Date.now(),
      });
    }
  }
}
