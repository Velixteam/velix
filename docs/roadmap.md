# Velix v5 Roadmap 🚀

Velix v5 is designed to be a complete ecosystem. Below is our vision for the next set of official plugins and features.

## Core Refinements (Q2 2026)
- **Edge-First Rendering**: Enhance the server to support more edge-compatible runtimes beyond Node.js.
- **Enhanced DevTools**: Move the DevTools overlay to a dedicated package with advanced component inspection and state time-travel.
- **Auto-Image Optimization**: Built-in plugin for WebP conversion and lazy-loading.

## Official Plugins 📦

### 🔐 velix-auth
*Status: Planning*
- Zero-config authentication for Velix apps.
- Support for OAuth2, JWT, and Session-based auth.
- Built-in `<AuthGuard>` and `useSession()` hooks.

### 🤖 velix-ai
*Status: Planning*
- Direct integration with LLM providers (Google Gemini, OpenAI, Anthropic).
- `useAI()` hook for streaming responses directly to React components.
- Tool-calling support for server-side actions.

### 📊 velix-analytics
*Status: Planning*
- Lightweight, privacy-first analytics.
- Heatmaps and session recordings without external scripts.
- Integrated dashboard in Velix DevTools.

### 🗄️ velix-db (Mini-ORM)
*Status: Planning / Inspired by Prisma*
- Type-safe communication between Frontend and Backend.
- Schema-first design (define once, use everywhere).
- Integrated migrations and seeding.
- High-security default (auto-injection protection).

## Versioning Policy
Velix follows Semantic Versioning (SemVer). Major versions will be released annually to coincide with React major releases.
