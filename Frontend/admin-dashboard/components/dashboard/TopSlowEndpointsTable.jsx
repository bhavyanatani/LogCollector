'use client';

import { formatMs, formatNumber } from '@/lib/utils';

export default function TopSlowEndpointsTable({ endpoints = [] }) {
  if (!endpoints || endpoints.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 text-center font-mono text-xs text-slate-400">
        No slow endpoint response metrics recorded.
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4 font-mono">
      {/* Title Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">
            TOP SLOW ENDPOINTS
          </h3>
          <p className="text-[11px] text-slate-500 font-sans mt-0.5">
            API endpoints ranked by highest average response latency
          </p>
        </div>
        <span className="text-[10px] px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400">
          Latency Ranking
        </span>
      </div>

      {/* Rows */}
      <div className="space-y-2 pt-1">
        {endpoints.map((ep, idx) => {
          const isVerySlow = ep.averageResponseTimeMs >= 1000;
          const isSlow = ep.averageResponseTimeMs >= 500 && ep.averageResponseTimeMs < 1000;

          return (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition"
            >
              <div className="flex items-center space-x-3 text-xs font-bold whitespace-nowrap">
                <span
                  className={`w-10 text-[10px] uppercase font-extrabold ${
                    ep.method === 'POST'
                      ? 'text-indigo-400'
                      : ep.method === 'GET'
                      ? 'text-emerald-400'
                      : ep.method === 'PUT' || ep.method === 'PATCH'
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {ep.method}
                </span>
                <span className="text-white font-mono break-all">{ep.path}</span>
              </div>

              <div className="flex items-center space-x-4">
                {ep.slowRequestCount > 0 && (
                  <span className="hidden sm:inline text-[10px] text-slate-400">
                    {formatNumber(ep.slowRequestCount)} slow requests
                  </span>
                )}
                <span
                  className={`text-xs font-bold font-mono px-2.5 py-1 rounded-md border ${
                    isVerySlow
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      : isSlow
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {formatMs(ep.averageResponseTimeMs)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
