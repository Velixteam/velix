import React from 'react';

export function Navbar() {
  return (
    <header className="border-b border-[#1e201e] bg-[#111211]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#00e87a] flex items-center justify-center font-bold text-black">
            VD
          </div>
          <span className="font-bold text-lg text-white">VelixDesk</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs bg-[#00e87a]/10 text-[#00e87a] px-2.5 py-1 rounded-full border border-[#00e87a]/20 font-medium">
            SaaS Starter
          </span>
        </div>
      </div>
    </header>
  );
}
