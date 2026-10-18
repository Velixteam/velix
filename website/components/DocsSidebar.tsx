"use client";
import React from 'react';
import { Link, usePathname } from '@teamvelix/velix/client';

function useCurrentPathName() {
  try {
    return usePathname();
  } catch {
    return typeof window !== 'undefined' ? window.location.pathname : '';
  }
}

function SidebarLink({ href, children, badge }: { href: string; children: React.ReactNode; badge?: string }) {
  const pathname = useCurrentPathName();
  const active = pathname === href || (pathname === '/docs' && href === '/docs');

  return (
    <Link
      href={href}
      className={`group flex items-center justify-between text-sm py-2 px-3 rounded-lg transition-all ${
        active
          ? "text-[#00e87a] bg-[#00e87a]/10 font-semibold border-l-2 border-[#00e87a] shadow-[0_0_15px_rgba(0,232,122,0.1)]"
          : "text-[#8e948c] hover:text-[#e8ebe5] hover:bg-[#161816]"
      }`}
    >
      <span>{children}</span>
      {badge && (
        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#1e201e] text-[#a0a69c] border border-[#2e322e]">
          {badge}
        </span>
      )}
    </Link>
  );
}

export function DocsSidebar() {
  return (
    <>
      {/* Mobile Disclosure Nav */}
      <details className="lg:hidden mb-6 group border border-[#1e201e] rounded-xl bg-[#111211] overflow-hidden">
        <summary className="w-full flex items-center justify-between p-4 text-white font-bold cursor-pointer list-none select-none">
          <div className="flex items-center gap-2 text-sm">
            <svg className="w-4 h-4 text-[#00e87a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            <span>Documentation Navigation</span>
          </div>
          <svg className="w-4 h-4 text-[#8e948c] transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </summary>
        <nav className="flex flex-col gap-5 p-4 border-t border-[#1e201e] bg-[#0a0a0a]">
          <SidebarSection title="Getting Started" icon="⚡">
            <SidebarLink href="/docs">Overview & Setup</SidebarLink>
            <SidebarLink href="/docs/routing">File Routing</SidebarLink>
          </SidebarSection>

          <SidebarSection title="Server Operations" icon="🖥️">
            <SidebarLink href="/docs/api-routes">API Routes</SidebarLink>
            <SidebarLink href="/docs/loaders">Data Loaders</SidebarLink>
            <SidebarLink href="/docs/actions" badge="Zod">Server Actions</SidebarLink>
          </SidebarSection>

          <SidebarSection title="Core Runtime" icon="📦">
            <SidebarLink href="/docs/error-handling">Error Boundaries</SidebarLink>
          </SidebarSection>

          <SidebarSection title="Production" icon="🚀">
            <SidebarLink href="/docs/deployment">Deploy & Cloud</SidebarLink>
          </SidebarSection>
        </nav>
      </details>

      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 border-r border-[#1e201e] pr-6">
        <nav className="sticky top-24 h-[calc(100vh-7rem)] overflow-y-auto flex flex-col gap-6 py-2 pr-2 scrollbar-thin">
          <SidebarSection title="Getting Started" icon="⚡">
            <SidebarLink href="/docs">Overview & Setup</SidebarLink>
            <SidebarLink href="/docs/routing">File Routing</SidebarLink>
          </SidebarSection>

          <SidebarSection title="Server Operations" icon="🖥️">
            <SidebarLink href="/docs/api-routes">API Routes</SidebarLink>
            <SidebarLink href="/docs/loaders">Data Loaders</SidebarLink>
            <SidebarLink href="/docs/actions" badge="Zod">Server Actions</SidebarLink>
          </SidebarSection>

          <SidebarSection title="Core Runtime" icon="📦">
            <SidebarLink href="/docs/error-handling">Error Boundaries</SidebarLink>
          </SidebarSection>

          <SidebarSection title="Production" icon="🚀">
            <SidebarLink href="/docs/deployment">Deploy & Cloud</SidebarLink>
          </SidebarSection>

          {/* Useful Community Footer in Sidebar */}
          <div className="mt- auto pt-6 border-t border-[#1e201e]">
            <div className="p-3.5 rounded-xl border border-[#1e201e] bg-[#111211] flex flex-col gap-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#00e87a] animate-pulse"></span>
                Velix v5.3.4
              </span>
              <p className="text-[11px] text-[#8e948c]">Full-stack React framework built for extreme speed & type safety.</p>
              <a
                href="https://github.com/Velixteam/website-velix"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-mono text-[#00e87a] hover:underline flex items-center gap-1 mt-1"
              >
                GitHub Repository →
              </a>
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
}

function SidebarSection({ title, icon, children }: { title: string; icon?: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-[11px] font-bold text-[#6b7068] uppercase tracking-wider mb-2.5 px-3 flex items-center gap-1.5 font-mono">
        {icon && <span>{icon}</span>}
        <span>{title}</span>
      </h4>
      <div className="space-y-1">{children}</div>
    </div>
  );
}
