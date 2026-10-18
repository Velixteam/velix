import React from 'react';
import { Section, P, CodeBlock, Callout, IC, PageNavigation } from "../../../components/DocsComponents";

export const metadata = {
  title: "File-based Routing - Velix Documentation",
  description: "Learn how file-based routing works in Velix app/ directory."
};

export default function RoutingPage() {
  return (
    <>
      <div className="flex items-center gap-2 text-xs text-[#6b7068] mb-8 font-mono">
        <a href="/docs" className="hover:text-[#00e87a] transition-colors">Docs</a>
        <span>/</span>
        <span className="text-[#00e87a] font-medium">Routing</span>
      </div>

      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">
          File-based Routing
        </h1>
        <P>
          Velix utilizes an intuitive file-system based router located in the <IC>app/</IC> directory. Each folder defines a URL route segment, and <IC>page.tsx</IC> renders the public view.
        </P>
      </div>

      {/* Static Routes */}
      <Section id="static-routes" title="Static Route Segments">
        <P>
          Folders inside <IC>app/</IC> map directly to public URL paths.
        </P>

        <CodeBlock filename="Directory Structure">{`app/
├── page.tsx               # Maps to /
├── about/
│   └── page.tsx           # Maps to /about
├── blog/
│   └── page.tsx           # Maps to /blog
└── contact/
    └── page.tsx           # Maps to /contact`}</CodeBlock>

        <P>
          Here is a sample <IC>page.tsx</IC> component:
        </P>

        <CodeBlock filename="app/about/page.tsx">{`export const metadata = {
  title: "About Us - My App",
};

export default function AboutPage() {
  return (
    <main className="container mx-auto py-12">
      <h1 className="text-3xl font-bold">About Velix Framework</h1>
      <p className="mt-4 text-slate-400">Building blazingly fast full-stack web apps.</p>
    </main>
  );
}`}</CodeBlock>
      </Section>

      {/* Dynamic Routes */}
      <Section id="dynamic-routes" title="Dynamic Routes ([param])">
        <P>
          To create a dynamic route segment, wrap a folder name in square brackets <IC>[param]</IC>.
        </P>

        <CodeBlock filename="Directory Structure">{`app/
├── blog/
│   └── [slug]/
│       └── page.tsx       # Maps to /blog/hello-world, /blog/react-19`}</CodeBlock>

        <P>
          Access parameters directly via the component <IC>params</IC> prop:
        </P>

        <CodeBlock filename="app/blog/[slug]/page.tsx">{`interface BlogPostProps {
  params: {
    slug: string;
  };
}

export default function BlogPost({ params }: BlogPostProps) {
  return (
    <article className="max-w-2xl mx-auto py-10">
      <span className="text-xs font-mono text-[#00e87a]">ARTICLE</span>
      <h1 className="text-4xl font-bold mt-2">Post: {params.slug}</h1>
    </article>
  );
}`}</CodeBlock>
      </Section>

      {/* Catch-all Routes */}
      <Section id="catch-all-routes" title="Catch-all Routes ([...slug])">
        <P>
          Catch all nested segments by prefixing the dynamic parameter with three dots <IC>[...slug]</IC>.
        </P>

        <CodeBlock filename="app/docs/[...slug]/page.tsx">{`// Matches /docs/routing, /docs/routing/dynamic, /docs/a/b/c
export default function DocsCatchAll({ params }: { params: { slug: string[] } }) {
  // params.slug is an array of segments: ['routing', 'dynamic']
  const path = params.slug.join('/');
  
  return <div>Documentation path: /{path}</div>;
}`}</CodeBlock>
      </Section>

      {/* Shared Layouts */}
      <Section id="layouts" title="Shared Layouts (layout.tsx)">
        <P>
          Define a <IC>layout.tsx</IC> file to wrap pages in a consistent UI shell (like navigation bars, footers, and persistent state).
        </P>

        <CodeBlock filename="app/layout.tsx">{`import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0a0a0a] text-white">
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}`}</CodeBlock>

        <Callout type="tip" title="State Preservation">
          Layouts preserve client-side state across route changes and <strong>do not re-mount</strong> when users navigate between sub-pages.
        </Callout>
      </Section>

      <PageNavigation
        prev={{ title: "Getting Started", href: "/docs" }}
        next={{ title: "API Routes", href: "/docs/api-routes" }}
      />
    </>
  );
}
