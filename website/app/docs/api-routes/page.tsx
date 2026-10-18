import React from 'react';
import { Section, P, CodeBlock, Callout, IC, PageNavigation } from "../../../components/DocsComponents";

export const metadata = {
  title: "API Routes - Velix Documentation",
  description: "Create REST API endpoints in server/api with Velix."
};

export default function ApiRoutesPage() {
  return (
    <>
      <div className="flex items-center gap-2 text-xs text-[#6b7068] mb-8 font-mono">
        <a href="/docs" className="hover:text-[#00e87a] transition-colors">Docs</a>
        <span>/</span>
        <span>Server</span>
        <span>/</span>
        <span className="text-[#00e87a] font-medium">API Routes</span>
      </div>

      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">
          API Routes
        </h1>
        <P>
          API routes enable you to build a secure public or internal REST API with Velix. Files located in <IC>server/api/</IC> are mapped directly to <IC>/api/*</IC> endpoints.
        </P>
      </div>

      {/* Basic Endpoint Definition */}
      <Section id="basic-usage" title="Defining an Endpoint">
        <P>
          Use the <IC>defineRoute</IC> helper to expose HTTP methods (GET, POST, PUT, DELETE, PATCH).
        </P>

        <CodeBlock filename="server/api/users.ts">{`import { defineRoute, json } from 'velix/server';
import { db } from '../lib/db';

export default defineRoute({
  // GET /api/users
  async GET(req) {
    const users = await db.users.findMany({
      select: { id: true, name: true, email: true }
    });
    return json(users);
  },
  
  // POST /api/users
  async POST(req) {
    const body = await req.json();
    const newUser = await db.users.create({ data: body });
    
    return json({ success: true, user: newUser }, { status: 201 });
  }
});`}</CodeBlock>
      </Section>

      {/* Dynamic API Parameters */}
      <Section id="dynamic-api" title="Dynamic Route Parameters">
        <P>
          Dynamic folders in <IC>server/api/</IC> receive parameters via the second argument:
        </P>

        <CodeBlock filename="server/api/users/[id].ts">{`import { defineRoute, json, VelixHttpError } from 'velix/server';
import { db } from '../../lib/db';

export default defineRoute({
  async GET(req, { params }) {
    const user = await db.users.findUnique({ where: { id: params.id } });
    
    if (!user) {
      throw new VelixHttpError(404, 'User not found');
    }
    
    return json(user);
  },

  async DELETE(req, { params }) {
    await db.users.delete({ where: { id: params.id } });
    return json({ message: 'User deleted successfully' });
  }
});`}</CodeBlock>
      </Section>

      {/* Custom Headers & Status Codes */}
      <Section id="responses" title="Custom Headers & Helper Functions">
        <P>
          Velix includes helper utilities like <IC>json()</IC>, <IC>html()</IC>, and <IC>redirect()</IC> for constructing HTTP responses:
        </P>

        <CodeBlock filename="server/api/health.ts">{`import { defineRoute, json } from 'velix/server';

export default defineRoute({
  async GET() {
    return json(
      { status: 'ok', timestamp: Date.now() },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'X-Velix-Health': 'healthy'
        }
      }
    );
  }
});`}</CodeBlock>

        <Callout type="info" title="Automatic Error Handling">
          Throwing a <IC>VelixHttpError(statusCode, message)</IC> inside an API route automatically serializes a JSON error payload with the matching HTTP status code.
        </Callout>
      </Section>

      <PageNavigation
        prev={{ title: "Routing", href: "/docs/routing" }}
        next={{ title: "Data Loaders", href: "/docs/loaders" }}
      />
    </>
  );
}
