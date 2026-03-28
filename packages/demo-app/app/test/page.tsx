import { Metadata } from 'velix';

export const metadata: Metadata = {
  title: "Test Error Page - Velix",
  description: "Testing the new error page design",
};

export default async function TestPage() {
  // Déclencher une erreur pour tester la nouvelle page 500
  throw new Error('This is a test error to showcase the new Velix error page! 🚀');

  return (
    <main className="min-h-screen bg-[#0F172A] text-white p-20">
      <h1 className="text-4xl font-bold">Test Page</h1>
      <p>This page should never render because it throws an error.</p>
    </main>
  );
}
