import chokidar, { FSWatcher } from 'chokidar';
import path from 'path';

export interface WatcherEvents {
  onChange: (filePath: string) => void;
  onAdd: (filePath: string) => void;
  onUnlink: (filePath: string) => void;
}

export class FileWatcher {
  private watcher: FSWatcher | null = null;
  private watchPaths: string[];

  constructor(watchPaths: string[]) {
    this.watchPaths = watchPaths;
  }

  public start(events: WatcherEvents): void {
    this.watcher = chokidar.watch(this.watchPaths, {
      ignored: /(^|[\/\\])\..|node_modules|\.velix|dist/,
      persistent: true,
      ignoreInitial: true,
    });

    this.watcher.on('change', (filePath) => events.onChange(path.resolve(filePath)));
    this.watcher.on('add', (filePath) => events.onAdd(path.resolve(filePath)));
    this.watcher.on('unlink', (filePath) => events.onUnlink(path.resolve(filePath)));
  }

  public close(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }
}
