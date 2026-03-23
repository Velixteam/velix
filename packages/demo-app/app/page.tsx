import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";

export const metadata = {
  title: "Welcome to Velix",
  description: "Build fast. Ship faster.",
};

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#0F172A] text-slate-100 font-sans relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -top-40 w-[600px] h-[400px] bg-[#1E3A8A]/30 rounded-full blur-[120px] pointer-events-none delay-1000 animate-pulse"></div>
      
      <div className="z-10 flex flex-col items-center max-w-5xl w-full text-center mt-12 mb-auto">
        <div className="mb-10 w-24 h-24 bg-gradient-to-tr from-[#1E3A8A] to-[#2563EB] rounded-2xl shadow-[0_0_40px_rgba(37,99,235,0.4)] flex items-center justify-center relative group">
          <div className="absolute inset-0 bg-[#22D3EE]/20 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-500"></div>
          <span className="text-5xl font-black text-white relative z-10 tracking-tighter">V</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight text-white">
          Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#22D3EE] to-[#2563EB]">Velix</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-slate-400 mb-12 tracking-wide font-light">
          Build fast. Ship faster.
        </p>

        <div className="flex flex-col sm:flex-row gap-5 mb-24 w-full sm:w-auto">
          <a href="https://github.com/Velixteam/velix" target="_blank" rel="noreferrer" className="w-full sm:w-auto">
            <Button variant="primary" className="w-full">
              Get Started
            </Button>
          </a>
          <a href="https://velix.vercel.app" target="_blank" rel="noreferrer" className="w-full sm:w-auto">
            <Button variant="secondary" className="w-full">
              Documentation
            </Button>
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full text-left">
          <Card title="Routing" description="File-system based routing that feels instantly familiar and snappy." />
          <Card title="Actions" description="Type-safe server actions mapped seamlessly directly to your client." />
          <Card title="Plugins" description="Extend the framework capabilities with a simple yet powerful API." />
          <Card title="Deployment" description="Deploy to any cloud provider or serverless edge with zero config." />
        </div>
      </div>
      
      <div className="mt-16 pb-8 text-slate-500 text-sm tracking-widest uppercase opacity-60">
        Powered by Velix
      </div>
    </main>
  );
}
