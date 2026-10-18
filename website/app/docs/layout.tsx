import React from 'react';
import { DocsSidebar } from "../../components/DocsSidebar";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#0a0a0a] text-[#e8ebe5]">
      {/* Top Banner & Hero Section */}
      <div className="border-b border-[#1e201e] bg-gradient-to-b from-[#111211] to-[#0a0a0a] relative overflow-hidden">
        {/* Glow effect overlay */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[250px] bg-[#00e87a]/10 blur-[100px] pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-6 py-12 md:py-16 relative z-10">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-[#00e87a]/10 text-[#00e87a] border border-[#00e87a]/25 font-mono shadow-[0_0_12px_rgba(0,232,122,0.15)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00e87a] animate-ping inline-block"></span>
              v5.3.4 stable
            </span>
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-[#111211] text-[#8e948c] border border-[#1e201e]">
              React 19 Ready
            </span>
            <a
              href="https://github.com/Velixteam/website-velix"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-mono px-3 py-1 rounded-full bg-[#161816] text-[#a0a69c] border border-[#232623] hover:text-white hover:border-[#00e87a]/40 transition-all ml-auto"
            >
              GitHub Release Notes ↗
            </a>
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-4 leading-tight">
            Velix <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00e87a] to-[#00ff87]">Documentation</span>
          </h1>
          <p className="text-base md:text-lg text-[#8e948c] max-w-2xl mb-8 leading-relaxed">
            Master Velix v5.3 — Next-gen SSR framework with zero-bundle server boundaries, Zod-validated mutations, and instant Edge deployment.
          </p>

          {/* Interactive Search Bar */}
          <div className="relative max-w-xl group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-[#6b7068] group-focus-within:text-[#00e87a] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              className="block w-full pl-11 pr-16 py-3 border border-[#1e201e] rounded-xl bg-[#111211]/90 text-[#e8ebe5] placeholder-[#6b7068] focus:outline-none focus:ring-1 focus:ring-[#00e87a] focus:border-[#00e87a] text-sm transition-all shadow-inner"
              placeholder="Search guides, loaders, actions, API routes..."
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-[#6b7068] bg-[#1a1c1a] border border-[#2e322e] rounded-md shadow-xs">
                ⌘K
              </kbd>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col lg:flex-row lg:items-start gap-8 lg:gap-12">
        <DocsSidebar />
        <main className="flex-1 min-w-0 max-w-full lg:max-w-3xl pb-24">
          {children}
        </main>
      </div>
    </div>
  );
}
