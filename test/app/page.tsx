import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";

export const metadata = {
  title: "Welcome to Velix",
  description: "Build fast. Ship faster.",
};

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-b from-[#0B1628] via-velix-dark to-velix-deep text-slate-100 font-sans relative overflow-hidden">
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-velix-accent/15 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-velix-cyan/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="z-10 flex flex-col items-center max-w-5xl w-full text-center mt-12 mb-auto">
        <div className="mb-10 w-24 h-24 bg-gradient-to-br from-velix-accent to-velix-cyan rounded-2xl shadow-[0_0_50px_rgba(34,211,238,0.3)] flex items-center justify-center relative group">
          <div className="absolute inset-0 bg-velix-cyan/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
          <span className="text-5xl font-black text-white relative z-10 tracking-tighter">V</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Welcome to</span>{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-velix-cyan via-velix-glow to-velix-accent">Velix</span>
        </h1>
        <p className="text-xl md:text-2xl text-slate-400 mb-12 tracking-wide font-light">
          Build fast. Ship faster.
        </p>
        <div className="flex flex-col sm:flex-row gap-5 mb-24 w-full sm:w-auto">
          <a href="https://github.com/Velixteam/velix" target="_blank" rel="noreferrer" className="w-full sm:w-auto">
            <Button variant="primary" className="w-full">Get Started</Button>
          </a>
          <a href="https://teamvelix.vercel.app" target="_blank" rel="noreferrer" className="w-full sm:w-auto">
            <Button variant="secondary" className="w-full">Documentation</Button>
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full text-left">
          <Card title="Routing" description="File-system based routing that feels instantly familiar and snappy." />
          <Card title="Actions" description="Type-safe server actions mapped seamlessly directly to your client." />
          <Card title="Plugins" description="Extend the framework capabilities with a simple yet powerful API." />
          <Card title="Deployment" description="Deploy to any cloud provider or serverless edge with zero config." />
        </div>
      </div>
      <div className="mt-16 pb-8 text-slate-600 text-sm tracking-widest uppercase font-mono">
        Velix &copy; 2026
      </div>
    </main>
  );
}
