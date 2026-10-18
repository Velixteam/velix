import React from 'react';
import { Section, P, CodeBlock, Callout, IC, PageNavigation } from "../../../components/DocsComponents";

export const metadata = {
  title: "Data Loaders - Velix Documentation",
  description: "Learn how to fetch SSR data securely with Velix Loaders."
};

export default function LoadersPage() {
  return (
    <>
      <div className="flex items-center gap-2 text-xs text-[#6b7068] mb-8 font-mono">
        <a href="/docs" className="hover:text-[#00e87a] transition-colors">Docs</a>
        <span>/</span>
        <span>Server</span>
        <span>/</span>
        <span className="text-[#00e87a] font-medium">Data Loaders</span>
      </div>

      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">
          Data Fetching with Loaders
        </h1>
        <P>
          Loaders are the fundamental mechanism for fetching data during Server-Side Rendering (SSR) in Velix. They run securely on the server before HTML is streamed to the user.
        </P>
      </div>

      {/* Defining a Loader */}
      <Section id="defining-loaders" title="Defining a Loader">
        <P>
          Create loaders in the <IC>server/loaders/</IC> directory using <IC>defineLoader</IC>.
        </P>

        <CodeBlock filename="server/loaders/blog.ts">{`import { defineLoader, NotFoundError } from 'velix/server';
import { db } from '../lib/db';

export const blogPostLoader = defineLoader(async (req, { params }) => {
  const post = await db.posts.findUnique({
    where: { slug: params.slug },
    include: { author: true, comments: true }
  });

  if (!post) {
    throw new NotFoundError('Blog post not found');
  }

  return {
    post,
    readTime: Math.ceil(post.content.length / 1000)
  };
});`}</CodeBlock>
      </Section>

      {/* Connecting Loader to Page */}
      <Section id="using-loaders" title="Binding Loader to a Page">
        <P>
          Export the loader as <IC>loader</IC> from your page file and infer its return type using <IC>InferLoaderData</IC>:
        </P>

        <CodeBlock filename="app/blog/[slug]/page.tsx">{`import { blogPostLoader } from '../../../server/loaders/blog';
import type { InferLoaderData } from 'velix/server';

// 1. Export the server loader binding
export const loader = blogPostLoader;

// 2. Consume typed data prop in your React component
export default function BlogPostPage({ data }: { data: InferLoaderData<typeof loader> }) {
  // data.post and data.readTime are 100% autocompleted & type-checked!
  return (
    <article className="max-w-3xl mx-auto py-12">
      <h1 className="text-4xl font-extrabold text-white">{data.post.title}</h1>
      <p className="text-sm text-[#00e87a] mt-2">Read time: {data.readTime} min</p>
      <div className="mt-6 text-[#a0a69c] leading-relaxed">
        {data.post.content}
      </div>
    </article>
  );
}`}</CodeBlock>
      </Section>

      {/* Benefits */}
      <Section id="security" title="Security & Bundle Optimization">
        <Callout type="tip" title="Why server/loaders?">
          Because loader code lives in <IC>server/loaders/</IC>, heavy ORMs (Prisma, Drizzle, Kysely), database connection pools, and secret tokens are <strong>never bundled into browser JavaScript</strong>. The client only receives the final JSON data.
        </Callout>
      </Section>

      <PageNavigation
        prev={{ title: "API Routes", href: "/docs/api-routes" }}
        next={{ title: "Server Actions", href: "/docs/actions" }}
      />
    </>
  );
}
