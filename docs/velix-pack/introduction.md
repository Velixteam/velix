# Velix Pack Beta — Introduction

Velix Pack is the incremental build and bundling engine designed specifically for the Velix ecosystem.

## Why Velix Pack?

Existing bundlers treat web applications as generic JavaScript module trees. Velix Pack natively understands Velix conventions:
- **Server/Client boundary enforcement**: Prevents server modules (`server/`) from accidentally leaking into client bundles with explicit errors.
- **Route-based code splitting**: Automatically splits routes (`app/**/page.tsx`) into optimal client chunks.
- **Persistent graph-aware caching**: Rebuilds only modified modules and their direct dependents.
- **Deep HMR integration**: Lightning-fast hot module replacement.

## Quick Start

Enable Velix Pack in development:

```bash
velix dev --pack
```

Build for production with Velix Pack:

```bash
velix build --pack
```

Run Velix Pack diagnostics and analysis:

```bash
velix pack --analyze
```
