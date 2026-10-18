import React from 'react';

export const metadata = {
  title: "Framework Architecture & Philosophy — Velix",
  description: "Learn everything about Velix: server-first architecture, Velix Pack incremental build engine, routing, islands, actions, and caching.",
};

export default function FrameworkPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e8ebe5] py-20 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#00e87a]/10 text-[#00e87a] font-mono text-xs font-semibold mb-4">
            VELIX ARCHITECTURE
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-[#e8ebe5] tracking-tight mb-6">
            Everything about <span className="gradient-green-text">Velix</span>
          </h1>
          <p className="text-lg text-[#6b7068] max-w-2xl mx-auto leading-relaxed">
            Velix is a server-first, TypeScript-first, fullstack React framework designed for high performance, deterministic builds, and clean code separation.
          </p>
        </div>

        {/* Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <div className="p-8 rounded-2xl bg-[#111211] border border-[#1e201e]">
            <div className="w-10 h-10 rounded-xl bg-[#00e87a]/10 text-[#00e87a] flex items-center justify-center font-bold mb-6">
              01
            </div>
            <h3 className="text-xl font-bold text-[#e8ebe5] mb-3">Server-First Convention</h3>
            <p className="text-sm text-[#6b7068] leading-relaxed">
              Strict separation between <code className="text-[#00e87a]">app/</code> (UI presentation) and <code className="text-[#00e87a]">server/</code> (loaders, API, actions). No backend leakage.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-[#111211] border border-[#1e201e]">
            <div className="w-10 h-10 rounded-xl bg-[#00e87a]/10 text-[#00e87a] flex items-center justify-center font-bold mb-6">
              02
            </div>
            <h3 className="text-xl font-bold text-[#e8ebe5] mb-3">Velix Pack Engine</h3>
            <p className="text-sm text-[#6b7068] leading-relaxed">
              Incremental dependency module graph with persistent filesystem caching and route-based code splitting.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-[#111211] border border-[#1e201e]">
            <div className="w-10 h-10 rounded-xl bg-[#00e87a]/10 text-[#00e87a] flex items-center justify-center font-bold mb-6">
              03
            </div>
            <h3 className="text-xl font-bold text-[#e8ebe5] mb-3">React 19 & Islands</h3>
            <p className="text-sm text-[#6b7068] leading-relaxed">
              Full SSR by default with elective partial hydration (<code className="text-[#00e87a]">'use client'</code> or <code className="text-[#00e87a]">'use island'</code>) for minimal JS footprint.
            </p>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="space-y-16">
          {/* Section: File-Based Routing */}
          <div className="p-8 rounded-2xl bg-[#111211] border border-[#1e201e]">
            <h2 className="text-2xl font-bold text-[#e8ebe5] mb-4">1. File-Based Routing System</h2>
            <p className="text-sm text-[#6b7068] leading-relaxed mb-6">
              The <code className="text-[#00e87a]">app/</code> directory defines your route tree automatically:
            </p>
            <div className="font-mono text-xs bg-[#0a0a0a] p-4 rounded-xl border border-[#1e201e] leading-loose text-[#e8ebe5]">
              <div>app/page.tsx           → /</div>
              <div>app/about/page.tsx     → /about</div>
              <div>app/blog/[slug]/page.tsx → /blog/:slug</div>
              <div>app/api/hello/route.ts → GET/POST /api/hello</div>
            </div>
          </div>

          {/* Section: Velix Pack */}
          <div className="p-8 rounded-2xl bg-[#111211] border border-[#1e201e]">
            <h2 className="text-2xl font-bold text-[#e8ebe5] mb-4">2. Velix Pack Beta Build Engine</h2>
            <p className="text-sm text-[#6b7068] leading-relaxed mb-4">
              Introduced in Velix 5.3, Velix Pack replaces monolithic bundlers with an incremental module graph:
            </p>
            <ul className="space-y-3 text-sm text-[#6b7068]">
              <li className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00e87a]"></span>
                <strong className="text-[#e8ebe5]">Incremental Rebuilds:</strong> Detects changed files and rebuilds only the minimum affected graph.
              </li>
              <li className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00e87a]"></span>
                <strong className="text-[#e8ebe5]">Persistent Cache:</strong> Stores compiled modules in <code className="text-[#00e87a]">.velix/cache/pack/</code> for near-zero startup delay.
              </li>
              <li className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00e87a]"></span>
                <strong className="text-[#e8ebe5]">Boundary Enforcement:</strong> Throws build error if server code is imported in client bundles.
              </li>
            </ul>
          </div>

          {/* Section: Data Fetching & Mutations */}
          <div className="p-8 rounded-2xl bg-[#111211] border border-[#1e201e]">
            <h2 className="text-2xl font-bold text-[#e8ebe5] mb-4">3. Data Fetching & Server Actions</h2>
            <p className="text-sm text-[#6b7068] leading-relaxed mb-6">
              Velix features type-safe loaders for server-side rendering and Zod-validated Server Actions for mutations.
            </p>
            <div className="font-mono text-xs bg-[#0a0a0a] p-4 rounded-xl border border-[#1e201e] leading-loose text-[#e8ebe5]">
              <span className="text-[#00e87a]">// server/loaders/user.loader.ts</span><br />
              {"export const userLoader = defineLoader(async ({ params }) => {"}<br />
              {"  return await db.user.findUnique({ where: { id: params.id } });"}<br />
              {"});"}
            </div>
          </div>
        </div>

        {/* Call to action */}
        <div className="mt-20 text-center">
          <a
            href="/docs"
            className="inline-block px-8 py-3.5 rounded-lg bg-[#00e87a] hover:bg-[#00ff87] text-[#0a0a0a] font-bold text-sm transition-all shadow-[0_0_20px_rgba(0,232,122,0.2)]"
          >
            Read Full Documentation &rarr;
          </a>
        </div>
      </div>
    </div>
  );
}
