function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-velix-deep/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 bg-gradient-to-br from-velix-accent to-velix-cyan rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.2)] group-hover:shadow-[0_0_30px_rgba(34,211,238,0.35)] transition-shadow">
            <span className="text-sm font-black text-white">V</span>
          </div>
          <span className="text-lg font-bold text-white tracking-tight">Velix</span>
          <span className="hidden sm:inline-flex text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-velix-cyan/10 text-velix-cyan border border-velix-cyan/20">v5</span>
        </a>
        <nav className="hidden md:flex items-center gap-8">
          <a href="/docs" className="text-sm text-slate-400 hover:text-white transition-colors">Docs</a>
          <a href="/compare" className="text-sm text-slate-400 hover:text-white transition-colors">Compare</a>
          <a href="/docs#examples" className="text-sm text-slate-400 hover:text-white transition-colors">Examples</a>
          <a href="https://github.com/Velixteam/velix" target="_blank" rel="noreferrer" className="text-sm text-slate-400 hover:text-white transition-colors">GitHub</a>
        </nav>
        <div className="flex items-center gap-3">
          <a href="/docs#getting-started" className="hidden sm:inline-flex text-sm px-4 py-2 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10 hover:border-white/20 transition-all">
            Get Started
          </a>
          <a href="https://github.com/Velixteam/velix" target="_blank" rel="noreferrer" className="text-sm px-4 py-2 rounded-lg bg-gradient-to-r from-velix-accent to-velix-cyan text-white font-medium shadow-[0_0_20px_rgba(34,211,238,0.2)] hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] transition-all">
            <span className="hidden sm:inline">Star on </span>GitHub
          </a>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/5 bg-velix-deep">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Framework</h4>
            <ul className="space-y-3">
              <li><a href="/docs" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Documentation</a></li>
              <li><a href="/docs#getting-started" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Getting Started</a></li>
              <li><a href="/docs#api-routes" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">API Routes</a></li>
              <li><a href="/docs#server-actions" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Server Actions</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Resources</h4>
            <ul className="space-y-3">
              <li><a href="/compare" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Compare Frameworks</a></li>
              <li><a href="/docs#examples" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Examples</a></li>
              <li><a href="/docs#deployment" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Deployment</a></li>
              <li><a href="/docs#plugins" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Plugins</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Community</h4>
            <ul className="space-y-3">
              <li><a href="https://github.com/Velixteam/velix" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">GitHub</a></li>
              <li><a href="https://github.com/Velixteam/velix/issues" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Issues</a></li>
              <li><a href="https://github.com/Velixteam/velix/discussions" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Discussions</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">MIT License</a></li>
              <li><a href="#" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Privacy</a></li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/5">
          <div className="flex items-center gap-3 mb-4 md:mb-0">
            <div className="w-6 h-6 bg-gradient-to-br from-velix-accent to-velix-cyan rounded-md flex items-center justify-center">
              <span className="text-[10px] font-black text-white">V</span>
            </div>
            <span className="text-sm text-slate-500">Velix Framework &copy; {new Date().getFullYear()}</span>
          </div>
          <p className="text-xs text-slate-600">Built with Velix. Deployed on Vercel.</p>
        </div>
      </div>
    </footer>
  );
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-velix-deep text-slate-100 min-h-screen font-sans antialiased">
        <Navbar />
        <main className="pt-16">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
