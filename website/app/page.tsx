export const metadata = { title: "Velix - The Modern React Framework | Build Fast. Ship Faster." };

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="group relative p-8 rounded-2xl bg-velix-dark/40 border border-white/5 hover:border-velix-cyan/15 transition-all duration-500">
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-velix-accent/0 to-velix-cyan/0 group-hover:from-velix-accent/5 group-hover:to-velix-cyan/5 transition-all duration-500"></div>
      <div className="relative z-10">
        <div className="w-12 h-12 rounded-xl bg-velix-cyan/10 flex items-center justify-center text-2xl mb-5">{icon}</div>
        <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>
        <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      {/* ─── Hero ─── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center overflow-hidden pt-20">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-velix-accent/10 rounded-full blur-[180px]"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-velix-cyan/8 rounded-full blur-[160px]"></div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto">
          {/* Beta Badge */}
          <div className="animate-fade-in-up inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-velix-accent"></span>
            <span className="text-xs font-medium text-slate-300">Now in public beta</span>
          </div>

          {/* Main Heading */}
          <h1 className="animate-fade-in-up animate-delay-100 text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.1] mb-8">
            <span className="text-white">Build fullstack apps</span>
            <br />
            <span className="text-velix-accent">faster</span>
          </h1>

          {/* Description */}
          <p className="animate-fade-in-up animate-delay-200 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Velix is a modern fullstack framework with server-first architecture, file-based
            routing, and end-to-end type safety. Ship production-ready apps in record time.
          </p>

          {/* CTA Buttons */}
          <div className="animate-fade-in-up animate-delay-300 flex flex-col sm:flex-row gap-4 justify-center items-center mb-20">
            <a 
              href="/docs#getting-started" 
              className="w-full sm:w-auto px-6 py-3 rounded-lg bg-velix-accent text-white font-medium text-sm hover:bg-velix-accent/90 transition-all"
            >
              Get Started
            </a>
            <a 
              href="https://github.com/Velixteam/velix" 
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-3 rounded-lg bg-white/5 border border-white/10 text-slate-300 font-medium text-sm hover:bg-white/10 transition-all"
            >
              GitHub
            </a>
          </div>

          {/* Code Preview */}
          <div className="animate-fade-in-up animate-delay-400 max-w-3xl mx-auto">
            <div className="rounded-xl bg-[#0d1117] border border-white/10 overflow-hidden shadow-2xl">
              {/* Terminal Header */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-[#161b22]">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                  <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
                </div>
              </div>
              {/* Code Content */}
              <div className="p-6 font-mono text-sm text-left">
                <div className="text-slate-500 mb-3">
                  <span className="text-purple-400">import</span> {"{ "}
                  <span className="text-velix-cyan">createApp</span> {"}"} 
                  <span className="text-purple-400"> from</span> 
                  <span className="text-green-400"> 'velix'</span>
                </div>
                <div className="text-slate-300 mb-1">
                  <span className="text-purple-400">export default</span> 
                  <span className="text-velix-cyan"> createApp</span>
                  <span className="text-yellow-300">({"{"}</span>
                </div>
                <div className="text-slate-300 pl-4">
                  <span className="text-velix-glow">routes</span>
                  <span className="text-slate-400">:</span> 
                  <span className="text-green-400"> './routes'</span>
                  <span className="text-slate-400">,</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="relative py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <span className="text-xs font-semibold tracking-widest uppercase text-velix-cyan mb-4 block">Features</span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">Everything you need.<br /><span className="gradient-text">Nothing you don't.</span></h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">Velix gives you the complete toolkit for building modern web apps, with sensible defaults and the flexibility to customize everything.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard icon="📁" title="File-Based Routing" description="Create pages by adding files to the app/ directory. Nested layouts, dynamic routes, and catch-all segments built in." />
            <FeatureCard icon="⚡" title="Server Actions" description="Type-safe server functions callable directly from your components. No API boilerplate required." />
            <FeatureCard icon="🏝️" title="Islands Architecture" description="Ship zero JavaScript by default. Hydrate only the interactive parts of your page for optimal performance." />
            <FeatureCard icon="🔌" title="API Routes" description="Build full REST APIs with simple exported functions. GET, POST, PUT, DELETE — all file-based." />
            <FeatureCard icon="🛡️" title="Middleware" description="Intercept and modify requests with powerful middleware. Authentication, logging, headers — all in one place." />
            <FeatureCard icon="🎯" title="Built-in SEO" description="Export metadata from any page. Automatic meta tags, Open Graph, structured data, and sitemap generation." />
            <FeatureCard icon="📦" title="Zero Config" description="Start building immediately. TypeScript, Tailwind CSS, and all tooling configured out of the box." />
            <FeatureCard icon="🚀" title="Edge Ready" description="Deploy anywhere — Node.js, serverless, or the edge. Optimized bundles for every environment." />
          </div>
        </div>
      </section>

      {/* ─── Code Examples ─── */}
      <section className="relative py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <span className="text-xs font-semibold tracking-widest uppercase text-velix-cyan mb-4 block">Developer Experience</span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">Write less. <span className="gradient-text">Do more.</span></h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">Clean, intuitive APIs that let you focus on building your product instead of fighting your framework.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-velix-accent/15 flex items-center justify-center text-sm">📁</div>
                <div><h3 className="text-sm font-semibold text-white">File-Based Routing</h3><p className="text-xs text-slate-500">app/page.tsx</p></div>
              </div>
              <div className="code-block">
                <pre className="font-mono text-sm"><code><span className="text-slate-500">{"// app/page.tsx"}</span>{"\n"}<span className="text-purple-400">export const</span> <span className="text-velix-cyan">metadata</span> = {"{"}{"\n"}{"  "}<span className="text-velix-glow">title</span>: <span className="text-green-400">"My App"</span>,{"\n"}{"}"};{"\n\n"}<span className="text-purple-400">export default function</span> <span className="text-yellow-300">HomePage</span>() {"{"}{"\n"}{"  "}<span className="text-purple-400">return</span> <span className="text-slate-400">{"<"}</span><span className="text-red-400">h1</span><span className="text-slate-400">{">"}</span>Welcome<span className="text-slate-400">{"</"}</span><span className="text-red-400">h1</span><span className="text-slate-400">{">"}</span>;{"\n"}{"}"}</code></pre>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-velix-cyan/15 flex items-center justify-center text-sm">⚡</div>
                <div><h3 className="text-sm font-semibold text-white">Server Actions</h3><p className="text-xs text-slate-500">server/actions/auth.ts</p></div>
              </div>
              <div className="code-block">
                <pre className="font-mono text-sm"><code><span className="text-purple-400">import</span> {"{ "}<span className="text-velix-cyan">serverAction</span>{" }"} <span className="text-purple-400">from</span> <span className="text-green-400">"velix/server"</span>;{"\n\n"}<span className="text-purple-400">export const</span> <span className="text-yellow-300">login</span> = <span className="text-velix-cyan">serverAction</span>({"\n"}{"  "}<span className="text-purple-400">async</span> <span className="text-yellow-300">handler</span>(<span className="text-orange-300">data</span>) {"{"}{"\n"}{"    "}<span className="text-purple-400">const</span> user = <span className="text-purple-400">await</span> db.verify(data);{"\n"}{"    "}<span className="text-purple-400">return</span> {"{ "}token: sign(user) {"}"};{"\n"}{"  }"}{"\n"});</code></pre>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-green-500/15 flex items-center justify-center text-sm">🔌</div>
                <div><h3 className="text-sm font-semibold text-white">API Routes</h3><p className="text-xs text-slate-500">server/api/tasks.ts</p></div>
              </div>
              <div className="code-block">
                <pre className="font-mono text-sm"><code><span className="text-purple-400">export function</span> <span className="text-yellow-300">GET</span>(<span className="text-orange-300">req</span>) {"{"}{"\n"}{"  "}<span className="text-purple-400">return</span> {"{ "}tasks: db.findAll() {"}"};{"\n"}{"}"}{"\n\n"}<span className="text-purple-400">export function</span> <span className="text-yellow-300">POST</span>(<span className="text-orange-300">req</span>) {"{"}{"\n"}{"  "}<span className="text-purple-400">const</span> task = db.create(req.body);{"\n"}{"  "}<span className="text-purple-400">return</span> {"{ "}task, msg: <span className="text-green-400">"Created"</span> {"}"};{"\n"}{"}"}</code></pre>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center text-sm">🛡️</div>
                <div><h3 className="text-sm font-semibold text-white">Middleware</h3><p className="text-xs text-slate-500">server/middleware.ts</p></div>
              </div>
              <div className="code-block">
                <pre className="font-mono text-sm"><code><span className="text-purple-400">export default async function</span>(<span className="text-orange-300">req</span>, <span className="text-orange-300">res</span>, <span className="text-orange-300">next</span>) {"{"}{"\n"}{"  "}console.log(<span className="text-green-400">`${"{"}</span>req.method<span className="text-green-400">{"}"} ${"{"}</span>req.url<span className="text-green-400">{"}"}`</span>);{"\n"}{"  "}res.setHeader(<span className="text-green-400">"X-Frame"</span>, <span className="text-green-400">"DENY"</span>);{"\n"}{"  "}<span className="text-purple-400">await</span> next();{"\n"}{"}"}</code></pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Performance ─── */}
      <section className="relative py-32 px-6">
        <div className="absolute inset-0 pointer-events-none"><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-velix-accent/5 rounded-full blur-[160px]"></div></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <span className="text-xs font-semibold tracking-widest uppercase text-velix-cyan mb-4 block">Performance</span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">Blazing fast.<br /><span className="gradient-text">By design.</span></h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">Velix is built from the ground up for speed. Zero-JS pages by default, smart code splitting, and optimized server rendering.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 rounded-2xl bg-velix-dark/50 border border-white/5 divide-x divide-white/5">
            {[
              { value: "0", suffix: "kb", label: "Default JS bundle" },
              { value: "~3", suffix: "ms", label: "Server response" },
              { value: "100", suffix: "", label: "Lighthouse score" },
              { value: "10", suffix: "x", label: "Faster than CRA" },
            ].map((s, i) => (
              <div key={i} className="text-center p-8">
                <div className="text-5xl md:text-6xl font-extrabold gradient-text mb-2">{s.value}<span className="text-2xl text-slate-500">{s.suffix}</span></div>
                <div className="text-sm text-slate-400">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Quick Comparison ─── */}
      <section className="relative py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <span className="text-xs font-semibold tracking-widest uppercase text-velix-cyan mb-4 block">Comparison</span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">How Velix <span className="gradient-text">stacks up</span></h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">See how Velix compares to other popular React frameworks.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 px-6 text-sm font-semibold text-slate-400">Feature</th>
                  <th className="text-center py-4 px-6 text-sm font-semibold text-velix-cyan">Velix</th>
                  <th className="text-center py-4 px-6 text-sm font-semibold text-slate-400">Next.js</th>
                  <th className="text-center py-4 px-6 text-sm font-semibold text-slate-400">Remix</th>
                  <th className="text-center py-4 px-6 text-sm font-semibold text-slate-400">Astro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {([
                  ["File-Based Routing", true, true, true, true],
                  ["Server Actions", true, true, true, false],
                  ["Islands Architecture", true, false, false, true],
                  ["Zero-JS by Default", true, false, false, true],
                  ["API Routes", true, true, false, true],
                  ["Built-in Middleware", true, true, false, false],
                  ["React 19 Support", true, true, true, false],
                  ["Zero Config", true, false, false, true],
                ] as [string, boolean, boolean, boolean, boolean][]).map(([feature, v, n, r, a], i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-6 text-sm text-slate-300">{feature}</td>
                    <td className="text-center py-4 px-6">{v ? <span className="text-velix-cyan text-lg">✓</span> : <span className="text-slate-600">✗</span>}</td>
                    <td className="text-center py-4 px-6">{n ? <span className="text-green-400/70 text-lg">✓</span> : <span className="text-slate-600">✗</span>}</td>
                    <td className="text-center py-4 px-6">{r ? <span className="text-green-400/70 text-lg">✓</span> : <span className="text-slate-600">✗</span>}</td>
                    <td className="text-center py-4 px-6">{a ? <span className="text-green-400/70 text-lg">✓</span> : <span className="text-slate-600">✗</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-center mt-10">
            <a href="/compare" className="inline-flex items-center gap-2 text-sm text-velix-cyan hover:text-white transition-colors font-medium">
              See full comparison →
            </a>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="relative py-32 px-6">
        <div className="absolute inset-0 pointer-events-none"><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-velix-cyan/8 rounded-full blur-[160px]"></div></div>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-6">Ready to build with<br /><span className="gradient-text">Velix</span>?</h2>
          <p className="text-lg text-slate-400 mb-10 max-w-xl mx-auto">Get started in seconds. One command to create your project, zero configuration needed.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-10">
            <a href="/docs#getting-started" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-velix-accent to-velix-cyan text-white font-semibold shadow-[0_0_30px_rgba(34,211,238,0.25)] hover:shadow-[0_0_50px_rgba(34,211,238,0.4)] transition-all hover:-translate-y-0.5">Start Building</a>
            <a href="https://github.com/Velixteam/velix" target="_blank" rel="noreferrer" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-semibold hover:bg-white/10 hover:text-white transition-all">View on GitHub</a>
          </div>
          <div className="inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-velix-dark/80 border border-white/5 font-mono text-sm">
            <span className="text-velix-cyan">$</span>
            <span className="text-slate-300">npx create-velix-app my-app</span>
          </div>
        </div>
      </section>
    </>
  );
}
