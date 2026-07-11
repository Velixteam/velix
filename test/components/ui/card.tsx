import React from "react";
import { cn } from "../../lib/utils";

export function Card({ title, description, className = '' }: { title: string; description: string; className?: string }) {
  return (
    <div className={cn("group relative p-8 bg-velix-dark/60 border border-white/5 rounded-2xl hover:border-velix-cyan/20 transition-colors duration-300 overflow-hidden", className)}>
      <div className="absolute inset-0 bg-gradient-to-br from-velix-accent/0 to-velix-cyan/0 group-hover:from-velix-accent/5 group-hover:to-velix-cyan/5 transition-all duration-500"></div>
      <h3 className="text-xl font-semibold text-slate-100 mb-3 relative z-10">{title}</h3>
      <p className="text-sm text-slate-400 leading-relaxed relative z-10">{description}</p>
    </div>
  );
}
