import React from 'react';
import { Section, P, CodeBlock, Callout, IC, PageNavigation } from "../../../components/DocsComponents";

export const metadata = {
  title: "Server Actions - Velix Documentation",
  description: "Type-safe form mutations with Zod schema validation in Velix."
};

export default function ServerActionsPage() {
  return (
    <>
      <div className="flex items-center gap-2 text-xs text-[#6b7068] mb-8 font-mono">
        <a href="/docs" className="hover:text-[#00e87a] transition-colors">Docs</a>
        <span>/</span>
        <span>Server</span>
        <span>/</span>
        <span className="text-[#00e87a] font-medium">Server Actions</span>
      </div>

      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">
          Mutations with Server Actions
        </h1>
        <P>
          Server Actions provide a type-safe, built-in way to handle form submissions and database mutations in Velix. Every action is validated against a <strong>mandatory Zod schema</strong> before execution.
        </P>
      </div>

      {/* Defining an Action */}
      <Section id="defining-action" title="Defining a Server Action">
        <P>
          Create action files inside <IC>server/actions/</IC>. Use <IC>serverAction</IC> and pass a Zod schema:
        </P>

        <CodeBlock filename="server/actions/user.ts">{`import { serverAction } from 'velix/server';
import { z } from 'zod';
import { db } from '../lib/db';

// 1. Define mandatory validation schema
export const UpdateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please provide a valid email address"),
  bio: z.string().max(200, "Bio cannot exceed 200 characters").optional()
});

// 2. Wrap implementation with serverAction
export const updateProfile = serverAction(UpdateProfileSchema, async (data, ctx) => {
  // 'data' is guaranteed to be validated: { name: string, email: string, bio?: string }
  const updatedUser = await db.users.update({
    where: { id: ctx.userId },
    data
  });

  return { success: true, user: updatedUser };
});`}</CodeBlock>
      </Section>

      {/* Consuming Action in Client */}
      <Section id="using-action" title="Consuming Actions in React Client">
        <P>
          Import your action into a client component (<IC>"use client"</IC>) and pass it to the <IC>useAction</IC> hook:
        </P>

        <CodeBlock filename="app/profile/ProfileForm.tsx">{`"use client";
import React from 'react';
import { useAction } from 'velix/client';
import { updateProfile } from '../../server/actions/user';

export default function ProfileForm() {
  const { execute, isPending, fieldErrors, error } = useAction(updateProfile, {
    onSuccess: (result) => {
      alert('Profile updated successfully!');
    },
    onError: (err) => {
      console.error('Update failed:', err.message);
    }
  });

  return (
    <form action={execute} className="space-y-4 max-w-md">
      <div>
        <label className="block text-xs font-mono text-slate-400 mb-1">Name</label>
        <input name="name" type="text" className="w-full p-2.5 rounded bg-[#111211] border border-[#1e201e] text-white" />
        {fieldErrors?.name && <span className="text-xs text-[#ff6b6b] mt-1 block">{fieldErrors.name}</span>}
      </div>

      <div>
        <label className="block text-xs font-mono text-slate-400 mb-1">Email</label>
        <input name="email" type="email" className="w-full p-2.5 rounded bg-[#111211] border border-[#1e201e] text-white" />
        {fieldErrors?.email && <span className="text-xs text-[#ff6b6b] mt-1 block">{fieldErrors.email}</span>}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="px-5 py-2.5 rounded-lg bg-[#00e87a] text-black font-bold hover:bg-[#00ff87] disabled:opacity-50 transition-all"
      >
        {isPending ? 'Saving...' : 'Save Profile'}
      </button>
    </form>
  );
}`}</CodeBlock>
      </Section>

      {/* Mandatory Validation Rule */}
      <Section id="security" title="Mandatory Zod Security Rule">
        <Callout type="danger" title="Validation Enforcement">
          Velix raises a runtime compile error if you attempt to register a Server Action without a valid Zod schema. This guarantees that malicious users cannot bypass validation by crafting artificial HTTP requests.
        </Callout>
      </Section>

      <PageNavigation
        prev={{ title: "Data Loaders", href: "/docs/loaders" }}
        next={{ title: "Error Handling", href: "/docs/error-handling" }}
      />
    </>
  );
}
