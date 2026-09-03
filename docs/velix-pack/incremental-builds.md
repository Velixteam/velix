# Incremental Rebuilds in Velix Pack

When a file changes in development:

```text
File Change
    ↓
File Watcher (chokidar)
    ↓
Resolve affected modules via Module Graph
    ↓
Invalidate cache entries
    ↓
Rebuild ONLY minimum affected sub-graph
    ↓
Notify HMR client
```

Only changed files and their dependent modules are re-compiled.
