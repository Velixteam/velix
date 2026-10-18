import React from 'react';
import { Section, P, CodeBlock, Callout, IC, PageNavigation } from "../../../components/DocsComponents";

export const metadata = {
  title: "Deployment & Production - Velix Documentation",
  description: "Deploy Velix applications to Velix Cloud, Vercel, Docker, or Node.js servers."
};

export default function DeploymentPage() {
  return (
    <>
      <div className="flex items-center gap-2 text-xs text-[#6b7068] mb-8 font-mono">
        <a href="/docs" className="hover:text-[#00e87a] transition-colors">Docs</a>
        <span>/</span>
        <span>Production</span>
        <span>/</span>
        <span className="text-[#00e87a] font-medium">Deployment</span>
      </div>

      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">
          Deploying to Production
        </h1>
        <P>
          Velix applications can be deployed to any Node.js environment, containerized via Docker, or deployed with zero-configuration to <strong>Velix Cloud</strong> & <strong>Vercel</strong>.
        </P>
      </div>

      {/* Deploying to Velix Cloud */}
      <Section id="velix-cloud" title="Deploying to Velix Cloud">
        <P>
          Deploy your application globally with a single CLI command:
        </P>

        <CodeBlock filename="Terminal">{`velix deploy`}</CodeBlock>

        <P>
          The CLI will optimize assets, bundle server loaders, and distribute your application across the Edge network.
        </P>
      </Section>

      {/* Deploying to Vercel / Static Host */}
      <Section id="vercel" title="Deploying to Vercel">
        <P>
          To deploy to Vercel, simply connect your GitHub repository. Velix automatically configures build settings:
        </P>

        <CodeBlock filename="vercel.json">{`{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "out",
  "cleanUrls": true
}`}</CodeBlock>
      </Section>

      {/* Environment Variables */}
      <Section id="env-vars" title="Environment Variables (VELIX_PUBLIC_)">
        <P>
          Velix automatically loads environment variables from <IC>.env</IC>, <IC>.env.local</IC>, and <IC>.env.production</IC>.
        </P>

        <CodeBlock filename=".env">{`# Server-only variable (accessible in loaders & API routes)
DATABASE_URL="postgres://admin:secret@db.internal:5432/app"

# Client-accessible variable (MUST be prefixed with VELIX_PUBLIC_)
VELIX_PUBLIC_APP_NAME="My Velix App"`}</CodeBlock>

        <Callout type="warning" title="Security Prefix">
          Any environment variable that needs to be accessed inside client-side components <strong>MUST start with <IC>VELIX_PUBLIC_</IC></strong>. Non-prefixed variables will be stripped out of browser JavaScript bundles.
        </Callout>
      </Section>

      {/* Standalone Node.js & Docker */}
      <Section id="docker" title="Node.js & Docker Deployment">
        <P>
          You can also run Velix in standalone server mode:
        </P>

        <CodeBlock filename="Dockerfile">{`FROM node:20-alpine WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]`}</CodeBlock>
      </Section>

      <PageNavigation
        prev={{ title: "Error Handling", href: "/docs/error-handling" }}
      />
    </>
  );
}
