import React from 'react';
import { Section, P, CodeBlock, Callout, IC, PageNavigation } from "../../components/DocsComponents";

export const metadata = {
  title: "Getting Started - Velix Documentation",
};

export default function GettingStartedPage() {
  return (
    <>
      <div className="text-sm text-slate-500 mb-8 font-mono">
        Docs <span className="mx-2">/</span> <span className="text-velix-cyan">Getting Started</span>
      </div>

      <Section title="Getting Started">
        <h3 className="text-xl font-bold text-white mb-4">Installation</h3>
        <P>Create a new Velix project with a single command. We recommend using `pnpm`:</P>
        <CodeBlock filename="Terminal">{`pnpm create velix-app my-app`}</CodeBlock>
        <P>Or with npm:</P>
        <CodeBlock filename="Terminal">{`npm create velix-app@latest my-app`}</CodeBlock>
        
        <h3 className="text-xl font-bold text-white mb-4 mt-10">Project Structure</h3>
        <P>Velix enforces a clear architecture, strictly separating the client and server. Here is the convention you must follow:</P>
        <CodeBlock>{`my-app/
├── app/
│   ├── layout.tsx           # Global Layout
│   ├── page.tsx             # "/" Route
│   └── [...slug]/page.tsx   # Catch-all
├── server/
│   ├── api/                 # API Routes (REST)
│   ├── loaders/             # Data fetching for SSR
│   └── actions/             # Server Actions (Mutations)
├── components/              # React Components
├── package.json
└── velix.config.ts`}</CodeBlock>
        <Callout type="warning" title="Strict Separation">
          The <IC>server/</IC> folder is never included in the client bundle. All server-side execution code must reside there.
        </Callout>

        <h3 className="text-xl font-bold text-white mb-4 mt-10">First Deployment</h3>
        <P>Start the development server:</P>
        <CodeBlock filename="Terminal">{`velix dev`}</CodeBlock>
        <P>Build for production:</P>
        <CodeBlock filename="Terminal">{`velix build`}</CodeBlock>
        <P>Deploy directly to Velix Cloud:</P>
        <CodeBlock filename="Terminal">{`velix deploy`}</CodeBlock>
      </Section>

      <PageNavigation 
        next={{ title: "Routing", href: "/docs/routing" }} 
      />
    </>
  );
}
