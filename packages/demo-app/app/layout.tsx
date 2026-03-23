import "./globals.css";

export const metadata = {
  title: "../demo-app",
  description: "Built with Velix v5",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-velix-dark text-slate-100 min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
