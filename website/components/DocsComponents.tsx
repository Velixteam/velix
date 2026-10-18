/**
 * Velix Documentation UI Components
 *
 * Shared primitives used across all /docs pages.
 * Kept in a single file so page authors can import everything
 * from one well-known location.
 */

import React from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SectionProps {
  id?: string;
  title: string;
  children: React.ReactNode;
}

interface CalloutProps {
  type?: 'info' | 'warning' | 'error' | 'tip';
  title?: string;
  children: React.ReactNode;
}

interface CodeBlockProps {
  filename?: string;
  children: string;
}

interface FeatureCardProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
}

interface StepItemProps {
  number: string | number;
  title: string;
  children: React.ReactNode;
}

interface PageNavigationProps {
  prev?: { title: string; href: string };
  next?: { title: string; href: string };
}

// ---------------------------------------------------------------------------
// Palette helpers (matches globals.css theme tokens)
// ---------------------------------------------------------------------------

const T = {
  bg: '#111211',
  bgDeep: '#0a0a0a',
  border: '#1e201e',
  accent: '#00e87a',
  muted: '#6b7068',
  text: '#e8ebe5',
  textDim: '#8e948c',
};

// ---------------------------------------------------------------------------
// Section
// ---------------------------------------------------------------------------

export function Section({ id, title, children }: SectionProps) {
  return (
    <section id={id} className="mb-16">
      <h2 className="text-2xl font-bold text-white mb-6 tracking-tight border-b border-[#1e201e] pb-3">
        {title}
      </h2>
      {children}
    </section>
  );
}

// ---------------------------------------------------------------------------
// P — styled paragraph
// ---------------------------------------------------------------------------

export function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[#8e948c] leading-relaxed mb-4 text-[15px]">
      {children}
    </p>
  );
}

// ---------------------------------------------------------------------------
// IC — inline code
// ---------------------------------------------------------------------------

export function IC({ children }: { children: React.ReactNode }) {
  return (
    <code
      className="px-1.5 py-0.5 rounded bg-[#161816] border border-[#1e201e] font-mono text-[13px] text-[#00e87a]"
    >
      {children}
    </code>
  );
}

// ---------------------------------------------------------------------------
// Callout
// ---------------------------------------------------------------------------

const CALLOUT_STYLES: Record<NonNullable<CalloutProps['type']>, { border: string; icon: string; labelColor: string }> = {
  info:    { border: '#3b82f6', icon: 'ℹ',  labelColor: '#3b82f6' },
  warning: { border: '#f59e0b', icon: '⚠',  labelColor: '#f59e0b' },
  error:   { border: '#ef4444', icon: '✖',  labelColor: '#ef4444' },
  tip:     { border: '#00e87a', icon: '✦',  labelColor: '#00e87a' },
};

export function Callout({ type = 'info', title, children }: CalloutProps) {
  const style = CALLOUT_STYLES[type];
  return (
    <div
      className="my-6 rounded-xl p-4 border"
      style={{
        background: `${style.border}10`,
        borderColor: `${style.border}40`,
        borderLeftColor: style.border,
        borderLeftWidth: '3px',
      }}
    >
      {title && (
        <div className="flex items-center gap-2 mb-2 text-sm font-semibold" style={{ color: style.labelColor }}>
          <span>{style.icon}</span>
          <span>{title}</span>
        </div>
      )}
      <div className="text-[#8e948c] text-sm leading-relaxed">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CodeBlock
// ---------------------------------------------------------------------------

export function CodeBlock({ filename, children }: CodeBlockProps) {
  return (
    <div className="my-5 rounded-xl overflow-hidden border border-[#1e201e] bg-[#111211]">
      {filename && (
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1e201e] bg-[#0d0f0d]">
          <span className="font-mono text-xs text-[#6b7068]">{filename}</span>
        </div>
      )}
      <pre className="overflow-x-auto p-5 text-sm leading-relaxed text-[#d0d5cc] font-mono">
        <code>{children}</code>
      </pre>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FeatureCard
// ---------------------------------------------------------------------------

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="hover-card-glow rounded-xl border border-[#1e201e] bg-[#111211] p-5 flex flex-col gap-3">
      {icon && (
        <div className="w-9 h-9 rounded-lg bg-[#00e87a]/10 border border-[#00e87a]/20 text-[#00e87a] flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
      )}
      <div>
        <h3 className="text-sm font-bold text-white mb-1">{title}</h3>
        <p className="text-xs text-[#6b7068] leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// StepItem
// ---------------------------------------------------------------------------

export function StepItem({ number, title, children }: StepItemProps) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#00e87a]/10 border border-[#00e87a]/30 text-[#00e87a] font-bold text-sm flex items-center justify-center font-mono">
        {number}
      </div>
      <div className="flex-1 pb-6">
        <h3 className="text-sm font-bold text-white mb-2">{title}</h3>
        {children}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PageNavigation
// ---------------------------------------------------------------------------

export function PageNavigation({ prev, next }: PageNavigationProps) {
  return (
    <nav className="mt-16 pt-8 border-t border-[#1e201e] flex items-center justify-between">
      {prev ? (
        <a
          href={prev.href}
          className="flex items-center gap-2 text-sm text-[#6b7068] hover:text-[#00e87a] transition-colors group"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>
            <span className="block text-[10px] uppercase tracking-widest text-[#6b7068]/60 mb-0.5">Previous</span>
            {prev.title}
          </span>
        </a>
      ) : <div />}

      {next ? (
        <a
          href={next.href}
          className="flex items-center gap-2 text-sm text-[#6b7068] hover:text-[#00e87a] transition-colors group text-right"
        >
          <span>
            <span className="block text-[10px] uppercase tracking-widest text-[#6b7068]/60 mb-0.5">Next</span>
            {next.title}
          </span>
          <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      ) : <div />}
    </nav>
  );
}
