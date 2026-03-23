import { Island, Metadata } from 'velix';
import TodoApp from '../../components/TodoApp';
import { getTodos } from '../../server/todo/todo.action';

export const metadata: Metadata = {
  title: "Velix Todo - Task Management",
  description: "A fast, SEO-friendly Todo app built with Velix Server Actions.",
  openGraph: {
    title: "Velix Todo App",
    description: "Experience the power of Velix Actions and Islands.",
    type: "website"
  }
};

export default async function TodoPage() {
  // Fetch initial todos on the server
  const todosResult = await getTodos() as any;
  const initialTodos = todosResult.success ? todosResult.data : [];

  return (
    <main className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col items-center py-20 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-[#22D3EE] to-[#2563EB]">
          Velix Todo
        </h1>
        <p className="text-slate-400 text-lg">
          Testing Server Actions & Partial Hydration
        </p>
      </div>

      <Island 
        name="TodoApp"
        component={TodoApp}
        props={{ initialTodos }}
        clientPath="/__velix/islands/TodoApp.js"
      />

      <div className="mt-20 text-slate-500 text-sm">
        <a href="/" className="hover:text-[#22D3EE] transition-colors">&larr; Back to Home</a>
      </div>
    </main>
  );
}
