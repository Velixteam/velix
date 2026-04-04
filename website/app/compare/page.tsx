export const metadata = {
  title: "Compare Frameworks - Velix vs Next.js vs Remix vs Astro",
  description: "See how Velix compares to Next.js, Remix, and Astro across features, performance, and developer experience.",
};

function Check() { return <span className="text-velix-cyan text-lg font-bold">✓</span>; }
function Cross() { return <span className="text-slate-600 text-lg">✗</span>; }
function Partial() { return <span className="text-yellow-500/70 text-lg">◐</span>; }
function Val({ children, hl }: { children: React.ReactNode; hl?: boolean }) {
  return <span className={`text-xs font-mono font-semibold ${hl ? "text-velix-cyan" : "text-slate-400"}`}>{children}</span>;
}

function FrameworkCard({ name, color, description, pros, cons, bestFor }: {
  name: string; color: string; description: string; pros: string[]; cons: string[]; bestFor: string;
}) {
  return (
    <div className="p-8 rounded-2xl bg-velix-dark/40 border border-white/5 hover:border-white/10 transition-all">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center text-white font-bold text-sm`}>{name[0]}</div>
        <h3 className="text-xl font-bold text-white">{name}</h3>
      </div>
      <p className="text-sm text-slate-400 mb-6 leading-relaxed">{description}</p>
      <div className="space-y-4">
        <div>
          <h4 className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-2">Strengths</h4>
          <ul className="space-y-1.5">
            {pros.map((p, i) => <li key={i} className="text-sm text-slate-400 flex items-start gap-2"><span className="text-green-400 mt-0.5">+</span> {p}</li>)}
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-semibold text-red-400/70 uppercase tracking-wider mb-2">Limitations</h4>
          <ul className="space-y-1.5">
            {cons.map((c, i) => <li key={i} className="text-sm text-slate-400 flex items-start gap-2"><span className="text-red-400/70 mt-0.5">−</span> {c}</li>)}
          </ul>
        </div>
        <div className="pt-3 border-t border-white/5">
          <span className="text-xs text-slate-500 uppercase tracking-wider">Best for: </span>
          <span className="text-xs text-slate-300">{bestFor}</span>
        </div>
      </div>
    </div>
  );
}

export default function ComparePage() {
  const categories = [
    { name: "Core", rows: [
      { f: "File-Based Routing", v: <Check/>, n: <Check/>, r: <Check/>, a: <Check/> },
      { f: "Nested Layouts", v: <Check/>, n: <Check/>, r: <Check/>, a: <Check/> },
      { f: "Dynamic Routes", v: <Check/>, n: <Check/>, r: <Check/>, a: <Check/> },
      { f: "Catch-All Routes", v: <Check/>, n: <Check/>, r: <Cross/>, a: <Check/> },
      { f: "TypeScript Native", v: <Check/>, n: <Check/>, r: <Check/>, a: <Check/> },
    ]},
    { name: "Server", rows: [
      { f: "Server Actions", v: <Check/>, n: <Check/>, r: <Check/>, a: <Cross/> },
      { f: "API Routes", v: <Check/>, n: <Check/>, r: <Cross/>, a: <Check/> },
      { f: "Middleware", v: <Check/>, n: <Check/>, r: <Cross/>, a: <Partial/> },
      { f: "Server-Side Rendering", v: <Check/>, n: <Check/>, r: <Check/>, a: <Partial/> },
      { f: "Static Site Generation", v: <Check/>, n: <Check/>, r: <Cross/>, a: <Check/> },
      { f: "Edge Runtime", v: <Check/>, n: <Check/>, r: <Check/>, a: <Check/> },
    ]},
    { name: "Architecture", rows: [
      { f: "Islands Architecture", v: <Check/>, n: <Cross/>, r: <Cross/>, a: <Check/> },
      { f: "Zero JS by Default", v: <Check/>, n: <Cross/>, r: <Cross/>, a: <Check/> },
      { f: "Partial Hydration", v: <Check/>, n: <Partial/>, r: <Cross/>, a: <Check/> },
      { f: "React 19 Support", v: <Check/>, n: <Check/>, r: <Check/>, a: <Cross/> },
      { f: "Plugin System", v: <Check/>, n: <Partial/>, r: <Cross/>, a: <Check/> },
    ]},
    { name: "DX & Tooling", rows: [
      { f: "Zero Configuration", v: <Check/>, n: <Cross/>, r: <Cross/>, a: <Check/> },
      { f: "Built-in Tailwind CSS", v: <Check/>, n: <Cross/>, r: <Cross/>, a: <Cross/> },
      { f: "Hot Module Replacement", v: <Check/>, n: <Check/>, r: <Check/>, a: <Check/> },
      { f: "Built-in SEO Metadata", v: <Check/>, n: <Check/>, r: <Partial/>, a: <Partial/> },
      { f: "DevTools", v: <Check/>, n: <Cross/>, r: <Cross/>, a: <Partial/> },
      { f: "CLI Scaffolding", v: <Check/>, n: <Check/>, r: <Check/>, a: <Check/> },
    ]},
    { name: "Performance", rows: [
      { f: "Client Bundle Size", v: <Val hl>~18kb</Val>, n: <Val>~85kb</Val>, r: <Val>~60kb</Val>, a: <Val>~0kb</Val> },
      { f: "Cold Start Time", v: <Val hl>~120ms</Val>, n: <Val>~350ms</Val>, r: <Val>~280ms</Val>, a: <Val>~100ms</Val> },
      { f: "Build Speed (1000 pages)", v: <Val hl>~4s</Val>, n: <Val>~12s</Val>, r: <Val>~8s</Val>, a: <Val>~6s</Val> },
      { f: "Lighthouse Score", v: <Val hl>100</Val>, n: <Val>92-98</Val>, r: <Val>95-99</Val>, a: <Val>100</Val> },
    ]},
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative pt-24 pb-16 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-velix-accent/8 rounded-full blur-[160px]"></div>
        </div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <span className="text-xs font-semibold tracking-widest uppercase text-velix-cyan mb-4 block">Framework Comparison</span>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6">Velix vs the <span className="gradient-text">competition</span></h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">An honest, detailed comparison of Velix with Next.js, Remix, and Astro. Every framework has trade-offs — here's how they stack up.</p>
        </div>
      </section>

      {/* Legend */}
      <section className="px-6 mb-8">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-8 text-sm text-slate-500">
          <span className="flex items-center gap-2"><Check /> Supported</span>
          <span className="flex items-center gap-2"><Partial /> Partial</span>
          <span className="flex items-center gap-2"><Cross /> Not Available</span>
        </div>
      </section>

      {/* Full Comparison Table */}
      <section className="px-6 mb-32">
        <div className="max-w-7xl mx-auto rounded-2xl bg-velix-dark/30 border border-white/5 p-2 overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-5 px-6 text-sm font-semibold text-slate-400 w-[280px]">Feature</th>
                <th className="text-center py-5 px-6">
                  <div className="inline-flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-gradient-to-br from-velix-accent to-velix-cyan flex items-center justify-center"><span className="text-[9px] font-black text-white">V</span></div>
                    <span className="text-sm font-semibold text-velix-cyan">Velix</span>
                  </div>
                </th>
                <th className="text-center py-5 px-6 text-sm font-semibold text-slate-400">Next.js</th>
                <th className="text-center py-5 px-6 text-sm font-semibold text-slate-400">Remix</th>
                <th className="text-center py-5 px-6 text-sm font-semibold text-slate-400">Astro</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tbody key={cat.name}>
                  <tr>
                    <td colSpan={5} className="pt-8 pb-3 px-6">
                      <span className="text-xs font-semibold tracking-widest uppercase text-velix-cyan/70">{cat.name}</span>
                    </td>
                  </tr>
                  {cat.rows.map((row, i) => (
                    <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-6 text-sm text-slate-300">{row.f}</td>
                      <td className="text-center py-4 px-6 bg-velix-cyan/[0.02]">{row.v}</td>
                      <td className="text-center py-4 px-6">{row.n}</td>
                      <td className="text-center py-4 px-6">{row.r}</td>
                      <td className="text-center py-4 px-6">{row.a}</td>
                    </tr>
                  ))}
                </tbody>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Framework Deep Dives */}
      <section className="px-6 pb-32">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">Framework <span className="gradient-text">deep dive</span></h2>
            <p className="text-lg text-slate-400 max-w-xl mx-auto">Each framework excels in different areas. Choose the right tool for your project.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FrameworkCard
              name="Next.js" color="bg-black"
              description="The most popular React framework, backed by Vercel. Mature ecosystem with extensive features and enterprise adoption."
              pros={["Massive ecosystem and community", "Excellent Vercel integration", "App Router with React Server Components", "Comprehensive documentation", "Battle-tested at scale"]}
              cons={["Heavy client-side JavaScript (~85kb)", "Complex configuration for advanced use cases", "Vendor lock-in tendencies with Vercel", "Steep learning curve for newer features"]}
              bestFor="Enterprise apps, teams needing extensive ecosystem support"
            />
            <FrameworkCard
              name="Remix" color="bg-indigo-600"
              description="A full-stack React framework focused on web standards and progressive enhancement. Now part of React Router v7."
              pros={["Excellent data loading patterns", "Strong focus on web standards", "Progressive enhancement by default", "Great error handling with error boundaries"]}
              cons={["No built-in API routes", "Smaller ecosystem than Next.js", "No middleware support", "No static site generation"]}
              bestFor="Apps prioritizing web standards and progressive enhancement"
            />
            <FrameworkCard
              name="Astro" color="bg-orange-600"
              description="A content-focused framework with Islands architecture. Ships zero JavaScript by default and supports multiple UI frameworks."
              pros={["Zero JavaScript by default", "Islands architecture for partial hydration", "Multi-framework support (React, Vue, Svelte)", "Excellent for content-heavy sites"]}
              cons={["Not ideal for highly interactive apps", "No React 19 support yet", "No server actions", "Limited middleware capabilities"]}
              bestFor="Content sites, blogs, marketing pages, documentation"
            />
            <FrameworkCard
              name="Velix" color="bg-gradient-to-br from-velix-accent to-velix-cyan"
              description="A modern full-stack React framework combining the best ideas from Next.js, Remix, and Astro into a cohesive, fast, and developer-friendly package."
              pros={["Islands architecture with React 19", "Zero JS by default + partial hydration", "Server actions, API routes, and middleware", "Zero config — works out of the box", "Blazing fast builds with esbuild"]}
              cons={["Newer framework, smaller community", "Fewer third-party integrations (growing)", "Less battle-tested at massive scale"]}
              bestFor="Teams wanting the best of all worlds — speed, DX, and modern React features"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-32">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-6">Convinced? <span className="gradient-text">Try Velix today.</span></h2>
          <div className="inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-velix-dark/80 border border-white/5 font-mono text-sm mb-8">
            <span className="text-velix-cyan">$</span>
            <span className="text-slate-300">npx create-velix-app my-app</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/docs#getting-started" className="px-8 py-4 rounded-xl bg-gradient-to-r from-velix-accent to-velix-cyan text-white font-semibold shadow-[0_0_30px_rgba(34,211,238,0.25)] hover:shadow-[0_0_50px_rgba(34,211,238,0.4)] transition-all hover:-translate-y-0.5">Get Started</a>
            <a href="/docs" className="px-8 py-4 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-semibold hover:bg-white/10 hover:text-white transition-all">Read the Docs</a>
          </div>
        </div>
      </section>
    </div>
  );
}
