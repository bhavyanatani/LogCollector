'use client';

import Link from 'next/link';

export default function RecentFailures({ failures = [] }) {
  if (!failures || failures.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-6 text-center text-xs text-slate-400">
        No recurring failures recorded in this period.
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white tracking-wide uppercase">Top Recurring Failures</h3>
        <Link href="/failures" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">
          View All Failures &rarr;
        </Link>
      </div>

      <div className="divide-y divide-slate-800">
        {failures.slice(0, 5).map((item, idx) => (
          <div key={idx} className="py-3 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-rose-400 font-mono block">{item.event}</span>
              <span className="text-slate-500 font-mono text-[11px]">{item.service}</span>
            </div>
            <div className="text-right">
              <span className="font-bold text-white font-mono block">{item.count} occurrences</span>
              <span className="text-slate-400 text-[11px]">{item.percentageOfFailures}% of failures</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
