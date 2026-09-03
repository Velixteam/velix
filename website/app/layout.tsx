import "./globals.css";

export const metadata = {
  title: "Velix — The Fullstack React Framework Built for Speed",
  description:
    "Build modern applications with a server-first architecture, zero-config tooling, and Velix Pack — the incremental build engine designed for performance.",
};

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-[#1e201e]">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-[#00e87a] flex items-center justify-center font-bold text-[#0a0a0a] text-lg shadow-[0_0_15px_rgba(0,232,122,0.3)] group-hover:scale-105 transition-transform">
            V
          </div>
          <span className="text-[#e8ebe5] font-bold text-xl tracking-tight">Velix</span>
          <span className="px-2 py-0.5 rounded-full bg-[#111211] border border-[#1e201e] text-[11px] font-mono text-[#00e87a]">
            v5.3
          </span>
        </a>

        <div className="flex items-center gap-8">
          <a href="#framework" className="text-sm text-[#6b7068] hover:text-[#e8ebe5] transition-colors">Framework</a>
          <a href="#pack" className="text-sm text-[#6b7068] hover:text-[#00e87a] transition-colors flex items-center gap-1.5">
            Pack <span className="px-1.5 py-0.2 rounded bg-[#00e87a]/10 text-[#00e87a] text-[10px] font-mono">Beta</span>
          </a>
          <a href="/docs" className="text-sm text-[#6b7068] hover:text-[#e8ebe5] transition-colors">Docs</a>
          <a href="#roadmap" className="text-sm text-[#6b7068] hover:text-[#e8ebe5] transition-colors">Roadmap</a>
          <a
            href="https://github.com/Velixteam/velix"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[#6b7068] hover:text-[#e8ebe5] transition-colors"
          >
            GitHub
          </a>
          <a
            href="/docs#getting-started"
            className="px-4 py-2 text-sm font-medium rounded-lg bg-[#00e87a] hover:bg-[#00ff87] text-[#0a0a0a] transition-all shadow-[0_0_20px_rgba(0,232,122,0.2)] hover:shadow-[0_0_30px_rgba(0,232,122,0.4)]"
          >
            Get Started
          </a>
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[#1e201e] bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="text-[#e8ebe5] font-semibold text-sm mb-4">Framework</h4>
            <div className="space-y-2">
              <a href="/docs" className="block text-sm text-[#6b7068] hover:text-[#e8ebe5] transition-colors">Documentation</a>
              <a href="#architecture" className="block text-sm text-[#6b7068] hover:text-[#e8ebe5] transition-colors">Architecture</a>
              <a href="#performance" className="block text-sm text-[#6b7068] hover:text-[#e8ebe5] transition-colors">Performance</a>
            </div>
          </div>
          <div>
            <h4 className="text-[#e8ebe5] font-semibold text-sm mb-4">Ecosystem</h4>
            <div className="space-y-2">
              <a href="#pack" className="block text-sm text-[#6b7068] hover:text-[#00e87a] transition-colors">Velix Pack Beta</a>
              <span className="block text-sm text-[#6b7068]/50">Velix Router (Soon)</span>
              <span className="block text-sm text-[#6b7068]/50">Velix Query (Soon)</span>
            </div>
          </div>
          <div>
            <h4 className="text-[#e8ebe5] font-semibold text-sm mb-4">Community</h4>
            <div className="space-y-2">
              <a href="https://github.com/Velixteam/velix" className="block text-sm text-[#6b7068] hover:text-[#e8ebe5] transition-colors">GitHub</a>
              <a href="https://www.npmjs.com/package/@teamvelix/velix" className="block text-sm text-[#6b7068] hover:text-[#e8ebe5] transition-colors">npm</a>
              <a href="https://discord.gg/velix" className="block text-sm text-[#6b7068] hover:text-[#e8ebe5] transition-colors">Discord</a>
            </div>
          </div>
          <div>
            <h4 className="text-[#e8ebe5] font-semibold text-sm mb-4">Legal</h4>
            <div className="space-y-2">
              <span className="block text-sm text-[#6b7068]">MIT License</span>
            </div>
          </div>
        </div>
        <div className="border-t border-[#1e201e] pt-8 flex items-center justify-between">
          <p className="text-xs text-[#6b7068]">&copy; 2026 Velix Team. All rights reserved.</p>
          <div className="flex items-center gap-2 text-xs text-[#6b7068]">
            <span className="w-2 h-2 rounded-full bg-[#00e87a]"></span>
            Built with Velix v5.3 + Velix Pack
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <meta name="google-site-verification" content="mguAwrwKCuA9Ex9w0wPe13hKCGnFN-sTFi-4AKvl16g" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@300..900&family=Geist+Mono:wght@300..900&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href={`/tailwind.css?v=${Date.now()}`} />
      </head>
      <body className="bg-[#0a0a0a] text-[#e8ebe5] font-sans antialiased min-h-screen">
        <Navbar />
        <main className="pt-16">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
