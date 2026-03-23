import React from 'react';
import { cn } from "../../lib/utils";

export function Card({ title, description, children, className = '' }: { title: string; description: string; children?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("group relative p-8 bg-[#162032] border border-slate-800 rounded-2xl hover:border-[#22D3EE]/40 transition-colors duration-300 overflow-hidden", className)}>
      <div className="absolute inset-0 bg-gradient-to-br from-[#2563EB]/0 to-[#22D3EE]/0 group-hover:from-[#2563EB]/5 group-hover:to-[#22D3EE]/5 transition-all duration-500"></div>
      <h3 className="text-xl font-semibold text-slate-100 mb-3 relative z-10">{title}</h3>
      <p className="text-sm text-slate-400 leading-relaxed relative z-10 mb-4">{description}</p>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
