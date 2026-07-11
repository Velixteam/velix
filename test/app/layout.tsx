import "./globals.css";

export const metadata = {
  title: "test",
  description: "Built with Velix v5",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-velix-deep text-slate-100 min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
