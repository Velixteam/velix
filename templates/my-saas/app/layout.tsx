import React from 'react';
import './globals.css';
import { Navbar } from '../components/Navbar';

export const metadata = {
  title: 'VelixDesk — Modern Customer Support SaaS',
  description: 'Built with Velix v5 full-stack framework and React 19',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
        />
      </head>
      <body className="min-h-screen bg-[#0a0a0a] text-slate-100 font-sans antialiased">
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
