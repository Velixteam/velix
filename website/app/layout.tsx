import "./globals.css";

export const metadata = {
  title: "Velix - The Modern React Framework",
  description:
    "Build fast. Ship faster. Velix is a blazing-fast full-stack React framework with file-based routing, server actions, Islands architecture, and zero-config deployment.",
};

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-velix-deep/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-velix-accent to-velix-cyan flex items-center justify-center">
            <span className="text-white font-bold text-sm">V</span>
          </div>
          <span className="text-white font-bold text-xl tracking-tight">Velix</span>
        </a>
        <div className="flex items-center gap-8">
          <a href="/docs" className="text-sm text-gray-400 hover:text-white transition-colors">Docs</a>
          <a href="/compare" className="text-sm text-gray-400 hover:text-white transition-colors">Compare</a>
          <a
            href="https://github.com/Velixteam/velix"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            GitHub
          </a>
          <a
            href="https://www.npmjs.com/package/@teamvelix/velix"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-1.5 text-sm font-medium rounded-full bg-velix-accent hover:bg-velix-accent/90 text-white transition-colors"
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
    <footer className="border-t border-white/5 bg-velix-deep">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <div className="space-y-2">
              <a href="/docs" className="block text-sm text-gray-500 hover:text-gray-300 transition-colors">Documentation</a>
              <a href="/compare" className="block text-sm text-gray-500 hover:text-gray-300 transition-colors">Compare</a>
            </div>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Community</h4>
            <div className="space-y-2">
              <a href="https://github.com/Velixteam/velix" className="block text-sm text-gray-500 hover:text-gray-300 transition-colors">GitHub</a>
              <a href="https://www.npmjs.com/package/@teamvelix/velix" className="block text-sm text-gray-500 hover:text-gray-300 transition-colors">npm</a>
            </div>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <div className="space-y-2">
              <a href="/docs" className="block text-sm text-gray-500 hover:text-gray-300 transition-colors">Getting Started</a>
              <a href="/docs" className="block text-sm text-gray-500 hover:text-gray-300 transition-colors">API Reference</a>
            </div>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <div className="space-y-2">
              <span className="block text-sm text-gray-500">MIT License</span>
            </div>
          </div>
        </div>
        <div className="border-t border-white/5 pt-8 flex items-center justify-between">
          <p className="text-sm text-gray-600">&copy; 2025 Velix Team. All rights reserved.</p>
          <p className="text-sm text-gray-600">Built with Velix</p>
        </div>
      </div>
    </footer>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="/tailwind.css" />
      </head>
      <body className="bg-velix-deep text-gray-100 font-sans antialiased min-h-screen">
        <Navbar />
        <main className="pt-16">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
