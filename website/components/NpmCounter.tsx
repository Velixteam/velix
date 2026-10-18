'use client';

import React, { useState, useEffect } from 'react';

type Stats = {
  totalDownloads: number | null;
  weeklyDownloads: number | null;
  githubStars: number | null;
};

function StatItem({
  value,
  label,
  accentColor,
  icon,
}: {
  value: string;
  label: string;
  accentColor: string;
  icon: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col items-start pl-4 border-l-[3px] ${accentColor}`}>
      <div className="flex items-center gap-2 mb-0.5">
        {icon}
        <span className="text-xl sm:text-2xl font-bold text-white tracking-tight tabular-nums">
          {value}
        </span>
      </div>
      <span className="text-xs sm:text-sm font-medium text-slate-400">{label}</span>
    </div>
  );
}

export function NpmCounter() {
  const [stats, setStats] = useState<Stats>({
    totalDownloads: null,
    weeklyDownloads: null,
    githubStars: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchAll = async () => {
      if (!cancelled) {
        setStats({ totalDownloads: 2500, weeklyDownloads: 45, githubStars: 4 });
        setLoading(false);
      }
    };

    fetchAll();
    return () => { cancelled = true; };
  }, []);

  const fmt = (n: number | null) => {
    if (loading) return '...';
    if (n === null) return '0';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return n.toLocaleString('en-US');
  };

  return (
    <div className="flex flex-wrap gap-6 sm:gap-8">
      <StatItem
        value={fmt(stats.totalDownloads)}
        label="Total Downloads"
        accentColor="border-teal-500"
        icon={
          <svg className="w-4 h-4 text-teal-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        }
      />
      <StatItem
        value={fmt(stats.weeklyDownloads)}
        label="Weekly Downloads"
        accentColor="border-cyan-500"
        icon={
          <svg className="w-4 h-4 text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        }
      />
      <StatItem
        value={fmt(stats.githubStars)}
        label="GitHub Stars"
        accentColor="border-yellow-500"
        icon={
          <svg className="w-4 h-4 text-yellow-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        }
      />
    </div>
  );
}
