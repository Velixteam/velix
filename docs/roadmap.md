# Velix v5 Roadmap 🚀

Velix v5 is designed to be a complete ecosystem. Below is our vision for the next set of official plugins and features.

## Core Refinements (Q2 2026)
- **✅ Enhanced DevTools**: Visual state indicators (orange=rendering, green=compiling, blue=navigating) inspired by Next.js latest. Real-time status updates via HMR.
- **✅ Improved Error Pages**: Beautiful 404/500 error pages with stack traces in development mode.
- **✅ Advanced Link Component**: Client-side navigation with prefetch strategies (immediate, hover, visible) and scroll management.
- **✅ Revalidation API**: `revalidatePath()` and `revalidateTag()` for cache invalidation, inspired by Next.js.
- **Edge-First Rendering**: Enhance the server to support more edge-compatible runtimes beyond Node.js.
- **Auto-Image Optimization**: Built-in plugin for WebP conversion and lazy-loading.

## Official Plugins 📦

### 🔐 velix-auth
*Status: Planning*
- Zero-config authentication for Velix apps.
- Support for OAuth2, JWT, and Session-based auth.
- Built-in `<AuthGuard>` and `useSession()` hooks.

### 🤖 velix-ai
*Status: ✅ Released v1*

**Vision**: Native AI integration for Velix apps with zero-config setup and streaming support.

**Core Features**:
- **Multi-Provider Support**: Google Gemini, OpenAI, Anthropic Claude, Mistral AI, and local models (Ollama)
- **Streaming Hooks**: `useAI()` for real-time streaming responses to React components
- **Server Actions Integration**: `aiAction()` wrapper for AI-powered server actions
- **Tool Calling**: Native support for function calling and server action execution
- **Context Management**: Automatic conversation history and context window management
- **Type Safety**: Full TypeScript support with schema validation (Zod integration)

**API Design**:
```typescript
import { useAI, aiAction, defineAIProvider } from 'velix/ai';

// Client-side streaming
const { messages, send, isLoading } = useAI({
  provider: 'gemini',
  model: 'gemini-2.0-flash-exp',
  systemPrompt: 'You are a helpful assistant',
});

// Server action with AI
export const generateContent = aiAction(async (prompt: string) => {
  const result = await ai.generate({
    model: 'gpt-4o',
    prompt,
    tools: [searchDatabase, sendEmail],
  });
  return result;
});

// Custom provider configuration
defineAIProvider({
  name: 'custom-llm',
  apiKey: process.env.CUSTOM_API_KEY,
  endpoint: 'https://api.custom.ai/v1',
});
```

**Advanced Features**:
- **RAG Support**: Built-in vector search and embedding generation
- **Prompt Caching**: Automatic caching of system prompts and context
- **Rate Limiting**: Built-in rate limiting and quota management
- **Cost Tracking**: Monitor API usage and costs in DevTools
- **Streaming UI**: Pre-built components for chat interfaces and loading states

**Roadmap**:
- Q2 2026: Beta release with Gemini and OpenAI support
- Q3 2026: Add Anthropic Claude, Mistral, and local model support
- Q4 2026: RAG features, vector search, and advanced tooling

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
