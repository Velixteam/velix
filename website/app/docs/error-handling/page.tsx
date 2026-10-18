import React from 'react';
import { Section, P, CodeBlock, Callout, IC, PageNavigation } from "../../../components/DocsComponents";

export const metadata = {
  title: "Error Handling - Velix Documentation",
  description: "Learn how error boundaries, 404 pages, and developer overlays work in Velix."
};

export default function ErrorHandlingPage() {
  return (
    <>
      <div className="flex items-center gap-2 text-xs text-[#6b7068] mb-8 font-mono">
        <a href="/docs" className="hover:text-[#00e87a] transition-colors">Docs</a>
        <span>/</span>
        <span>Core</span>
        <span>/</span>
        <span className="text-[#00e87a] font-medium">Error Handling</span>
      </div>

      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">
          Error Handling & Boundaries
        </h1>
        <P>
          Velix provides a robust error system built on React Error Boundaries. It catches client and server exceptions cleanly, ensuring your app gracefully recovers without crashing.
        </P>
      </div>

      {/* error.tsx */}
      <Section id="error-boundary" title="Custom Error Boundary (error.tsx)">
        <P>
          Create an <IC>error.tsx</IC> file inside any route folder to catch runtime exceptions in that segment:
        </P>

        <CodeBlock filename="app/error.tsx">{`"use client";
import React from 'react';
import { defineError } from 'velix/client';

export default defineError(({ error, reset }) => {
  return (
    <div className="p-8 rounded-xl border border-[#ff6b6b]/30 bg-[#ff6b6b]/5 text-center my-8">
      <h2 className="text-xl font-bold text-white mb-2">Something went wrong!</h2>
      <p className="text-xs font-mono text-[#ff6b6b] mb-4">{error.message}</p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 rounded-lg bg-[#ff6b6b] text-black font-bold text-xs hover:bg-red-400 transition-colors"
      >
        Try Again
      </button>
    </div>
  );
});`}</CodeBlock>
      </Section>

      {/* not-found.tsx */}
      <Section id="not-found" title="Custom 404 Pages (not-found.tsx)">
        <P>
          Customize 404 views by placing <IC>not-found.tsx</IC> in your <IC>app/</IC> directory:
        </P>

        <CodeBlock filename="app/not-found.tsx">{`import React from 'react';
import { defineNotFound } from 'velix/server';

export default defineNotFound(() => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
      <h1 className="text-8xl font-black text-white font-mono">404</h1>
      <p className="text-base text-[#8e948c] mt-4 mb-6">The requested resource could not be found.</p>
      <a href="/" className="px-5 py-2.5 rounded-xl bg-[#00e87a] text-black font-bold text-sm hover:bg-[#00ff87]">
        Back to Home
      </a>
    </div>
  );
});`}</CodeBlock>
      </Section>

      {/* Dev Overlay */}
      <Section id="dev-overlay" title="Developer Error Overlay">
        <P>
          In development mode (<IC>velix dev</IC>), Velix intercepts unhandled exceptions and displays a Next-gen error overlay featuring:
        </P>

        <ul className="list-disc pl-5 text-sm text-[#a0a69c] space-y-2 mb-6 font-sans">
          <li><strong>Source Code Snippet:</strong> Highlights the exact line and file where the error occurred.</li>
          <li><strong>Interactive Call Stack:</strong> Allows toggling between application code and <IC>node_modules</IC> frames.</li>
          <li><strong>Velix Green Branding:</strong> Custom dark theme with status indicators.</li>
        </ul>

        <Callout type="info" title="Production Behavior">
          In production (<IC>velix start</IC>), dev overlays are automatically suppressed to protect sensitive stack traces, and the custom <IC>error.tsx</IC> UI is rendered.
        </Callout>
      </Section>

      <PageNavigation
        prev={{ title: "Server Actions", href: "/docs/actions" }}
        next={{ title: "Deployment", href: "/docs/deployment" }}
      />
    </>
  );
}
