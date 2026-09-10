import React from 'react';
import { Section, P, CodeBlock, Callout, IC, FeatureCard, StepItem, PageNavigation } from "../../components/DocsComponents";

export const metadata = {
  title: "Getting Started - Velix Documentation v5.3.4",
  description: "Learn how to build full-stack React applications with Velix framework."
};

export default function GettingStartedPage() {
  return (
    <>
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-[#6b7068] mb-8 font-mono">
        <a href="/docs" className="hover:text-[#00e87a] transition-colors">Docs</a>
        <span>/</span>
        <span className="text-[#00e87a] font-medium">Getting Started</span>
      </div>

      {/* Hero Overview */}
      <div className="mb-12">
        <h1 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">
          Getting Started with Velix
        </h1>
        <P>
          Velix is a high-performance, full-stack React 19 framework built around <strong className="text-white">strict server-client boundaries</strong>, <strong className="text-white">file-based routing</strong>, and <strong className="text-white">type-safe server mutations</strong>.
        </P>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
        <FeatureCard
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
          title="Instant HMR & Speed"
          description="Powered by native Velix Pack incremental bundler for instant Hot Module Replacement."
        />
        <FeatureCard
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          }
          title="Zero-Leak Server Isolation"
          description="Code inside server/ is never bundled for the client, protecting database credentials & API keys."
        />
        <FeatureCard
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          title="Strict Zod Mutations"
          description="Server Actions enforce Zod validation schemas to prevent unvalidated payloads."
        />
      </div>

      {/* Step-by-Step Installation */}
      <Section id="quick-start" title="Quick Start & Installation">
        <P>
          Get up and running in under a minute using the official <IC>create-velix-app</IC> initializer.
        </P>

        <div className="space-y-4 my-8">
          <StepItem number="1" title="Scaffold a New Project">
            <P>Choose your preferred package manager to run the scaffold wizard:</P>
            
            <CodeBlock filename="Terminal (pnpm - Recommended)">{`pnpm create velix-app my-app`}</CodeBlock>
            <CodeBlock filename="Terminal (npm)">{`npm create velix-app@latest my-app`}</CodeBlock>
          </StepItem>

          <StepItem number="2" title="Navigate to Project Directory">
            <CodeBlock filename="Terminal">{`cd my-app`}</CodeBlock>
          </StepItem>

          <StepItem number="3" title="Start Development Server">
            <CodeBlock filename="Terminal">{`pnpm dev`}</CodeBlock>
            <P>Open <IC>http://localhost:3000</IC> in your browser to view your live app.</P>
          </StepItem>
        </div>
      </Section>

      {/* Architectural Conventions */}
      <Section id="architecture" title="Directory Architecture">
        <P>
          Velix enforces a strict, clean separation between user interface components and server execution logic:
        </P>

        <CodeBlock filename="Directory Structure">{`my-app/
├── app/                      # Client-side React 19 UI & Pages
│   ├── layout.tsx            # Root Layout (Navbar, Footer, Providers)
│   ├── page.tsx              # Index "/" Route Component
│   ├── error.tsx             # Route Boundary Fallback UI
│   └── not-found.tsx         # Custom 404 UI
├── server/                   # Strict Server-Only Execution Layer
│   ├── api/                  # REST API Endpoints (/api/*)
│   ├── loaders/              # SSR Data Fetching Logic
│   └── actions/              # Mutating Server Actions (Zod schemas)
├── components/               # Reusable React UI Components
├── public/                   # Static Assets (Images, Favicon, Fonts)
├── AGENT.md                  # AI Agent Context Rules for Cursor/Claude
└── velix.config.ts           # Velix Project Configuration`}</CodeBlock>

        <Callout type="warning" title="Strict Server Boundaries">
          Code in <IC>server/</IC> is executed exclusively on Node.js or Edge runtimes and is <strong>never sent to the client browser</strong>. You can safely connect to PostgreSQL, Redis, or use secret API keys without fear of bundle leaks.
        </Callout>
      </Section>

      {/* Command Line Cheat Sheet */}
      <Section id="cli-commands" title="CLI Commands Cheat Sheet">
        <P>
          The <IC>velix</IC> CLI package provides essential development and production commands:
        </P>

        <div className="overflow-x-auto my-6 border border-[#1e201e] rounded-xl bg-[#111211]">
          <table className="w-full text-left text-sm font-mono">
            <thead className="bg-[#161816] text-[#8e948c] border-b border-[#1e201e]">
              <tr>
                <th className="p-3.5">Command</th>
                <th className="p-3.5">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e201e] text-[#d0d5cc]">
              <tr>
                <td className="p-3.5 text-[#00e87a] font-bold">velix dev</td>
                <td className="p-3.5 font-sans">Starts development server with live HMR & Tailwind watcher</td>
              </tr>
              <tr>
                <td className="p-3.5 text-[#00e87a] font-bold">velix build</td>
                <td className="p-3.5 font-sans">Compiles production bundle to out/ directory</td>
              </tr>
              <tr>
                <td className="p-3.5 text-[#00e87a] font-bold">velix start</td>
                <td className="p-3.5 font-sans">Runs production build on local Node.js server</td>
              </tr>
              <tr>
                <td className="p-3.5 text-[#00e87a] font-bold">velix pack --profile</td>
                <td className="p-3.5 font-sans">Analyzes bundle chunks, module graphs, and cache hits</td>
              </tr>
              <tr>
                <td className="p-3.5 text-[#00e87a] font-bold">velix doctor</td>
                <td className="p-3.5 font-sans">Audits environment setup, node version, and config errors</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <PageNavigation
        next={{ title: "File-based Routing", href: "/docs/routing" }}
      />
    </>
  );
}
