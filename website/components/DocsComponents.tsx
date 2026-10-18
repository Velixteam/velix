"use client";
import React, { useState } from 'react';

/**
 * Enhanced CodeBlock component with syntax highlighting simulations,
 * copy-to-clipboard functionality, and clean header bar.
 */
export function CodeBlock({ filename, children }: { filename?: string; children: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simple syntax colorizer helper for JavaScript/TypeScript/CLI code
  const colorize = (code: string) => {
    // Escape HTML first
    let html = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Highlight comments
    html = html.replace(/(\/\/.+?)$/gm, '<span class="text-[#6b7068] italic">$1</span>');
    html = html.replace(/(#.+?)$/gm, '<span class="text-[#6b7068] italic">$1</span>');

    // Highlight strings
    html = html.replace(/('[^']*'|"[^"]*"|`[^`]*`)/g, '<span class="text-[#86efac]">$1</span>');

    // Highlight keywords
    const keywords = /\b(import|export|from|default|function|const|let|var|async|await|return|if|else|throw|new|try|catch|type|interface|extends|typeof)\b/g;
    html = html.replace(keywords, '<span class="text-[#c084fc] font-semibold">$1</span>');

    // Highlight CLI commands or packages
    html = html.replace(/\b(pnpm|npm|npx|bun|velix|create-velix-app|zod|react|express)\b/g, '<span class="text-[#00e87a] font-semibold">$1</span>');

    // Highlight numbers
    html = html.replace(/\b(\d+)\b/g, '<span class="text-[#f59e0b]">$1</span>');

    return html;
  };

  return (
    <div className="my-6 rounded-xl overflow-hidden border border-[#1e201e] bg-[#0d0e0d] shadow-lg group">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1e201e] bg-[#111211]/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00e87a]/60 inline-block"></span>
          <span className="text-xs text-[#8e948c] font-mono tracking-wide">{filename || 'Code'}</span>
        </div>
        <button
          onClick={copy}
          className="text-xs font-mono px-2.5 py-1 rounded-md bg-[#1a1c1a] text-[#8e948c] hover:text-[#e8ebe5] hover:bg-[#252825] border border-[#232623] transition-all flex items-center gap-1.5 active:scale-95"
          title="Copy code"
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5 text-[#00e87a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-[#00e87a] font-medium">Copied!</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="overflow-x-auto p-5 text-sm font-mono leading-relaxed text-[#e8ebe5]">
        <pre className="selection:bg-[#00e87a]/30">
          <code dangerouslySetInnerHTML={{ __html: colorize(children) }} />
        </pre>
      </div>
    </div>
  );
}

export function Section({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-16 scroll-mt-24">
      <div className="group flex items-center gap-3 mb-6 pb-4 border-b border-[#1e201e]">
        <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">{title}</h2>
        {id && (
          <a href={`#${id}`} className="opacity-0 group-hover:opacity-100 text-[#00e87a] text-lg font-mono transition-opacity" title="Direct link">
            #
          </a>
        )}
      </div>
      {children}
    </section>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return <p className="text-[#a0a69c] leading-relaxed mb-4 text-[15px]">{children}</p>;
}

export function IC({ children }: { children: React.ReactNode }) {
  return (
    <code className="text-[13px] px-1.5 py-0.5 rounded-md bg-[#141614] text-[#00e87a] font-mono border border-[#232623] inline-block font-medium">
      {children}
    </code>
  );
}

export function Callout({ type, title, children }: { type: "info" | "warning" | "danger" | "tip"; title?: string; children: React.ReactNode }) {
  const styles = {
    info: "border-[#3b82f6] bg-[rgba(59,130,246,0.06)] text-[#93c5fd]",
    warning: "border-[#f59e0b] bg-[rgba(245,158,11,0.06)] text-[#fcd34d]",
    danger: "border-[#ff6b6b] bg-[rgba(255,107,107,0.06)] text-[#fca5a5]",
    tip: "border-[#00e87a] bg-[rgba(0,232,122,0.06)] text-[#86efac]"
  };
  
  const iconSVGs = {
    info: (
      <svg className="w-5 h-5 text-[#3b82f6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5 text-[#f59e0b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    danger: (
      <svg className="w-5 h-5 text-[#ff6b6b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    tip: (
      <svg className="w-5 h-5 text-[#00e87a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    )
  };

  const titleColors = {
    info: "text-[#60a5fa]",
    warning: "text-[#fbbf24]",
    danger: "text-[#ff6b6b]",
    tip: "text-[#00e87a]"
  };

  return (
    <div className={`border-l-4 ${styles[type]} rounded-r-xl p-4.5 my-6 backdrop-blur-xs`}>
      <div className="flex items-start gap-3">
        <div className="shrink-0 p-1 rounded-md bg-[#111211]/50 border border-white/5">
          {iconSVGs[type]}
        </div>
        <div className="flex-1 min-w-0">
          {title && <h5 className={`text-sm font-bold mb-1 tracking-wide ${titleColors[type]}`}>{title}</h5>}
          <div className="text-[14px] text-[#d0d5cc] leading-relaxed">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-5 rounded-xl border border-[#1e201e] bg-[#111211] hover:border-[#00e87a]/40 transition-all hover:shadow-[0_0_20px_rgba(0,232,122,0.06)] group">
      <div className="w-10 h-10 rounded-lg bg-[#00e87a]/10 border border-[#00e87a]/20 flex items-center justify-center text-[#00e87a] mb-4 group-hover:scale-105 transition-transform">
        {icon}
      </div>
      <h4 className="text-base font-bold text-white mb-1.5">{title}</h4>
      <p className="text-xs text-[#8e948c] leading-relaxed">{description}</p>
    </div>
  );
}

export function StepItem({ number, title, children }: { number: string | number; title: string; children: React.ReactNode }) {
  return (
    <div className="relative pl-10 pb-8 last:pb-0 group">
      {/* Connector line */}
      <div className="absolute left-[15px] top-8 bottom-0 w-[2px] bg-[#1e201e] group-last:hidden" />
      {/* Number Badge */}
      <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-[#111211] border border-[#00e87a]/50 flex items-center justify-center text-xs font-bold text-[#00e87a] font-mono shadow-[0_0_10px_rgba(0,232,122,0.15)]">
        {number}
      </div>
      <div>
        <h4 className="text-lg font-bold text-white mb-2">{title}</h4>
        <div className="text-sm text-[#a0a69c] leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

export function PageNavigation({ prev, next }: { prev?: { title: string; href: string }; next?: { title: string; href: string } }) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between mt-16 pt-8 border-t border-[#1e201e] gap-4">
      <div className="flex-1 w-full">
        {prev && (
          <a
            href={prev.href}
            className="flex flex-col items-start p-4 rounded-xl border border-[#1e201e] bg-[#111211] hover:bg-[#161816] hover:border-[#00e87a]/30 transition-all group"
          >
            <span className="text-xs text-[#6b7068] mb-1 flex items-center gap-1.5 group-hover:text-[#00e87a] transition-colors font-mono">
              <svg className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </span>
            <span className="text-sm font-bold text-[#e8ebe5] group-hover:text-white transition-colors">{prev.title}</span>
          </a>
        )}
      </div>
      <div className="flex-1 w-full flex justify-end">
        {next && (
          <a
            href={next.href}
            className="flex flex-col items-end p-4 rounded-xl border border-[#1e201e] bg-[#111211] hover:bg-[#161816] hover:border-[#00e87a]/30 transition-all group"
          >
            <span className="text-xs text-[#6b7068] mb-1 flex items-center gap-1.5 group-hover:text-[#00e87a] transition-colors font-mono">
              Next
              <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </span>
            <span className="text-sm font-bold text-[#e8ebe5] group-hover:text-white transition-colors">{next.title}</span>
          </a>
        )}
      </div>
    </div>
  );
}
