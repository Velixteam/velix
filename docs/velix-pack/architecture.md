# Velix Pack Architecture

Velix Pack is built around a modular pipeline:

```text
                Velix Pack
                    │
                    ▼
              Entry Discovery
                    │
                    ▼
               Module Graph
                    │
          ┌─────────┼─────────┐
          ▼         ▼         ▼
       Server     Client     Shared
          │         │         │
          └─────────┼─────────┘
                    ▼
              Transform Layer
                    │
                    ▼
             Dependency Graph
                    │
                    ▼
             Cache / Storage
                    │
                    ▼
             Optimization
                    │
                    ▼
                 Bundling
                    │
                    ▼
                  Output
```

## Key Components

1. **Resolver**: Path alias (`@/`) & extension resolution.
2. **Module Graph**: Tracks dependencies, dependents, content hashes, and module types (`server`, `client`, `shared`).
3. **Boundary Checker**: Enforces strict server/client separation rules.
4. **Transform Pipeline**: TypeScript, TSX, CSS, and JSON transformation powered by esbuild.
5. **FSCache**: Persistent filesystem caching in `.velix/cache/pack/`.
6. **Code Splitter**: Route-based chunk generation.
7. **Bundler**: Production bundle generator.
8. **File Watcher**: Incremental rebuild trigger using chokidar.
