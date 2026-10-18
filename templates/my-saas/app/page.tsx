import React from 'react';

export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">VelixDesk Overview</h1>
          <p className="text-slate-400 text-sm mt-1">Real-time support operations & customer tickets</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center justify-center bg-[#00e87a] hover:bg-[#39ffa0] text-black font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors shadow-[0_0_15px_rgba(0,232,122,0.2)]">
            + New Ticket
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex flex-col p-6 rounded-xl border border-[#1e201e] bg-[#111211]">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Open Tickets</span>
          <span className="text-3xl font-extrabold text-white mt-2">24</span>
          <span className="text-xs text-[#00e87a] mt-2 flex items-center gap-1">↑ 12% from last week</span>
        </div>

        <div className="flex flex-col p-6 rounded-xl border border-[#1e201e] bg-[#111211]">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Avg Response Time</span>
          <span className="text-3xl font-extrabold text-white mt-2">14m</span>
          <span className="text-xs text-[#00e87a] mt-2 flex items-center gap-1">↓ 3m faster today</span>
        </div>

        <div className="flex flex-col p-6 rounded-xl border border-[#1e201e] bg-[#111211]">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Customer Satisfaction</span>
          <span className="text-3xl font-extrabold text-white mt-2">98.4%</span>
          <span className="text-xs text-[#00e87a] mt-2 flex items-center gap-1">★ 4.9 / 5.0 rating</span>
        </div>
      </div>
    </div>
  );
}
