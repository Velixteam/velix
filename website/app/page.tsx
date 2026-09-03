export const metadata = {
  title: "Velix 5.3 — The Fullstack React Framework Built for Speed",
};

export default function HomePage() {
  return (
    <>
      {/* ─── 1. HERO SECTION ─── */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-6 overflow-hidden pt-12 pb-24">
        {/* Subtle radial glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-[#00e87a]/5 rounded-full blur-[160px]"></div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center flex flex-col items-center">
          {/* Badge */}
          <div className="animate-fade-in-up inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#111211] border border-[#1e201e] mb-8">
            <span className="w-2 h-2 rounded-full bg-[#00e87a] animate-pulse"></span>
            <span className="text-xs font-mono text-[#e8ebe5]">VELIX 5.3</span>
            <span className="text-xs text-[#6b7068]">|</span>
            <span className="text-xs font-medium text-[#00e87a]">Velix Pack Now in Beta</span>
          </div>

          {/* Heading */}
          <h1 className="animate-fade-in-up animate-delay-100 text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.08] mb-8 max-w-4xl">
            The fullstack React framework <br />
            <span className="gradient-green-text">built for speed.</span>
          </h1>

          {/* Description */}
          <p className="animate-fade-in-up animate-delay-200 text-base sm:text-lg text-[#6b7068] max-w-2xl mb-10 leading-relaxed">
            Build modern applications with a server-first architecture, zero-config tooling
            and an ecosystem designed around performance.
          </p>

          {/* CTA Buttons */}
          <div className="animate-fade-in-up animate-delay-300 flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">
            <a
              href="/docs#getting-started"
              className="px-7 py-3.5 rounded-lg bg-[#00e87a] hover:bg-[#00ff87] text-[#0a0a0a] font-bold text-sm transition-all shadow-[0_0_25px_rgba(0,232,122,0.25)] hover:shadow-[0_0_40px_rgba(0,232,122,0.4)] text-center"
            >
              Get Started
            </a>
            <a
              href="https://github.com/Velixteam/velix"
              target="_blank"
              rel="noopener noreferrer"
              className="px-7 py-3.5 rounded-lg bg-[#111211] border border-[#1e201e] hover:border-[#6b7068] text-[#e8ebe5] font-medium text-sm transition-all text-center"
            >
              Explore GitHub
            </a>
          </div>
        </div>
      </section>

      {/* ─── 2. VELIX PACK FEATURE SECTION ─── */}
      <section id="pack" className="relative py-28 px-6 border-t border-[#1e201e] bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#00e87a]/10 text-[#00e87a] font-mono text-xs font-semibold mb-4">
              VELIX PACK BETA
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#e8ebe5] mb-4">
              Meet Velix Pack.
            </h2>
            <p className="text-lg text-[#6b7068] max-w-xl mx-auto">
              The build engine designed specifically for Velix.
            </p>
          </div>

          {/* Key Copy Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {[
              { title: "Incremental builds.", desc: "Rebuild only what changed in your application module graph." },
              { title: "Persistent caching.", desc: "Reuse compilation artifacts across cold and warm builds." },
              { title: "Native server/client aware.", desc: "Strict boundary checking prevents backend leaks to browser." },
              { title: "Lightning-fast development.", desc: "Near-instant startup and HMR tailored for React 19." },
            ].map((f, i) => (
              <div key={i} className="p-6 rounded-xl bg-[#111211] border border-[#1e201e] hover:border-[#00e87a]/30 transition-all">
                <div className="w-2 h-2 rounded-full bg-[#00e87a] mb-4"></div>
                <h3 className="text-base font-bold text-[#e8ebe5] mb-2">{f.title}</h3>
                <p className="text-xs text-[#6b7068] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Visual Architecture Flow */}
          <div className="p-8 rounded-2xl bg-[#111211] border border-[#1e201e] mb-16">
            <h3 className="text-xs font-mono uppercase tracking-widest text-[#6b7068] mb-8 text-center">
              Compilation Pipeline Architecture
            </h3>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs">
              {[
                { name: "Source", sub: "app/ & server/" },
                { name: "Module Graph", sub: "Dependency Tree" },
                { name: "Incremental Compiler", sub: "esbuild Backend" },
                { name: "Cache", sub: ".velix/cache/pack/" },
                { name: "Optimized Output", sub: "Client & Server Chunks" },
              ].map((step, idx, arr) => (
                <div key={idx} className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                  <div className="w-full md:w-auto p-4 rounded-xl bg-[#0a0a0a] border border-[#1e201e] text-center min-w-[150px]">
                    <div className="text-[#00e87a] font-bold mb-1">{step.name}</div>
                    <div className="text-[10px] text-[#6b7068]">{step.sub}</div>
                  </div>
                  {idx < arr.length - 1 && (
                    <div className="text-[#6b7068] font-bold text-lg rotate-90 md:rotate-0">
                      ↓
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Terminal Simulation */}
          <div className="max-w-2xl mx-auto rounded-xl bg-[#111211] border border-[#1e201e] overflow-hidden shadow-2xl">
            <div className="flex items-center px-4 py-3 bg-[#0a0a0a] border-b border-[#1e201e]">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-[#1e201e]"></div>
                <div className="w-3 h-3 rounded-full bg-[#1e201e]"></div>
                <div className="w-3 h-3 rounded-full bg-[#1e201e]"></div>
              </div>
              <span className="mx-auto text-xs font-mono text-[#6b7068]">Terminal — velix dev --pack</span>
            </div>
            <div className="p-6 font-mono text-xs leading-loose text-[#e8ebe5] space-y-1">
              <div>
                <span className="text-[#00e87a]">$</span> velix dev --pack
              </div>
              <div className="text-[#00e87a]">✓ Velix Pack initialized</div>
              <div className="text-[#00e87a]">✓ Module graph ready</div>
              <div className="text-[#00e87a]">✓ Cache restored</div>
              <div className="text-[#00e87a]">✓ Dev server running</div>
              <div className="pt-2 text-[#6b7068]">
                Local: <span className="text-[#e8ebe5] underline">http://localhost:3000</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. PERFORMANCE SECTION ─── */}
      <section id="performance" className="relative py-28 px-6 border-t border-[#1e201e] bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-mono uppercase tracking-widest text-[#00e87a] mb-2 block">Performance</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#e8ebe5] mb-4">
              Designed for speed from the ground up.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 rounded-2xl bg-[#111211] border border-[#1e201e] hover:border-[#00e87a]/20 transition-colors">
              <div className="text-xs font-mono text-[#00e87a] font-bold uppercase tracking-wider mb-2">INCREMENTAL</div>
              <h3 className="text-xl font-bold text-[#e8ebe5] mb-3">Rebuild only what changed.</h3>
              <p className="text-sm text-[#6b7068] leading-relaxed">
                When a component is saved, Velix Pack traverses the module graph and recompiles strictly the affected dependency sub-tree.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-[#111211] border border-[#1e201e] hover:border-[#00e87a]/20 transition-colors">
              <div className="text-xs font-mono text-[#00e87a] font-bold uppercase tracking-wider mb-2">CACHED</div>
              <h3 className="text-xl font-bold text-[#e8ebe5] mb-3">Reuse previous compilation work.</h3>
              <p className="text-sm text-[#6b7068] leading-relaxed">
                Persistent filesystem caching stores transformed modules across cold restarts, enabling near-instant cold startups.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-[#111211] border border-[#1e201e] hover:border-[#00e87a]/20 transition-colors">
              <div className="text-xs font-mono text-[#00e87a] font-bold uppercase tracking-wider mb-2">SMART</div>
              <h3 className="text-xl font-bold text-[#e8ebe5] mb-3">Understand server and client boundaries.</h3>
              <p className="text-sm text-[#6b7068] leading-relaxed">
                Native directive detection guarantees server-only logic (`server/`) is never accidentally bundled into browser client code.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-[#111211] border border-[#1e201e] hover:border-[#00e87a]/20 transition-colors">
              <div className="text-xs font-mono text-[#00e87a] font-bold uppercase tracking-wider mb-2">FAST</div>
              <h3 className="text-xl font-bold text-[#e8ebe5] mb-3">Designed for Velix from the ground up.</h3>
              <p className="text-sm text-[#6b7068] leading-relaxed">
                Zero legacy bundle overhead. Built specifically around React 19 Server Components and Islands architecture.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. ARCHITECTURE SECTION ─── */}
      <section id="architecture" className="relative py-28 px-6 border-t border-[#1e201e] bg-[#0a0a0a]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-mono uppercase tracking-widest text-[#00e87a] mb-2 block">Architecture</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#e8ebe5] mb-4">
              The Velix Ecosystem
            </h2>
            <p className="text-base text-[#6b7068] max-w-lg mx-auto">
              A unified fullstack platform where every layer is designed to work in harmony.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-[#111211] border border-[#1e201e]">
            <div className="font-mono text-center mb-8 text-[#00e87a] font-bold text-lg">VELIX</div>
            <div className="flex justify-center mb-6">
              <div className="w-px h-8 bg-[#1e201e]"></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center font-mono text-xs">
              <div className="p-4 rounded-xl bg-[#0a0a0a] border border-[#1e201e] text-[#e8ebe5]">Router</div>
              <div className="p-4 rounded-xl bg-[#0a0a0a] border border-[#1e201e] text-[#e8ebe5]">Server</div>
              <div className="p-4 rounded-xl bg-[#0a0a0a] border border-[#1e201e] text-[#e8ebe5]">Query</div>
              <div className="p-4 rounded-xl bg-[#0a0a0a] border border-[#1e201e] text-[#e8ebe5]">Store</div>
              <div className="p-4 rounded-xl bg-[#0a0a0a] border border-[#00e87a]/40 text-[#00e87a] font-bold">Pack</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 5. ROADMAP SECTION ─── */}
      <section id="roadmap" className="relative py-28 px-6 border-t border-[#1e201e] bg-[#0a0a0a]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-mono uppercase tracking-widest text-[#00e87a] mb-2 block">Roadmap</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#e8ebe5] mb-4">
              Where Velix is heading
            </h2>
          </div>

          <div className="space-y-8 font-mono text-sm">
            <div className="p-6 rounded-xl bg-[#111211] border border-[#1e201e]">
              <div className="text-[#00e87a] font-bold mb-3">VELIX 5.3</div>
              <div className="space-y-2 text-xs text-[#e8ebe5]">
                <div>✓ New identity</div>
                <div>✓ New templates</div>
                <div>✓ Developer experience</div>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-[#111211] border border-[#00e87a]/40">
              <div className="text-[#00e87a] font-bold mb-3">VELIX PACK</div>
              <div className="space-y-2 text-xs text-[#00e87a]">
                <div>● Beta</div>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-[#111211] border border-[#1e201e]">
              <div className="text-[#6b7068] font-bold mb-3">NEXT</div>
              <div className="space-y-2 text-xs text-[#6b7068]">
                <div>○ Velix Router</div>
                <div>○ Velix Query</div>
                <div>○ Velix Store</div>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-[#111211] border border-[#1e201e]">
              <div className="text-[#6b7068] font-bold mb-3">FUTURE</div>
              <div className="space-y-2 text-xs text-[#6b7068]">
                <div>○ Velix DevTools</div>
                <div>○ Edge runtime improvements</div>
                <div>○ Advanced compiler optimizations</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 6. CTA SECTION ─── */}
      <section className="relative py-28 px-6 border-t border-[#1e201e] bg-[#0a0a0a]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#e8ebe5] mb-6">
            Ready to build with <span className="gradient-green-text">Velix</span>?
          </h2>
          <p className="text-base text-[#6b7068] mb-10">
            Get started in seconds. One command to create your project with Velix Pack Beta.
          </p>
          <div className="inline-flex items-center gap-3 px-6 py-3.5 rounded-xl bg-[#111211] border border-[#1e201e] font-mono text-sm mb-8">
            <span className="text-[#00e87a]">$</span>
            <span className="text-[#e8ebe5]">npx create-velix-app my-app</span>
          </div>
        </div>
      </section>
    </>
  );
}
