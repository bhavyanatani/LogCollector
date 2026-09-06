'use client';

import { formatNumber, formatPercent } from '@/lib/utils';

export default function EndpointHealthTable({ endpoints = [] }) {
  if (!endpoints || endpoints.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 text-center font-mono text-xs text-slate-400">
        No endpoint health data recorded for the selected filter.
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4 font-mono">
      {/* Table Header / Title Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">
            ENDPOINT HEALTH
          </h3>
          <p className="text-[11px] text-slate-500 font-sans mt-0.5">
            Most affected endpoints by error volume and failure rate (Option 2: System &amp; Business Failures)
          </p>
        </div>
        <span className="text-[10px] px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400">
          Top {endpoints.length}
        </span>
      </div>

      {/* Table Layout */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="text-slate-400 border-b border-dashed border-slate-800 text-[11px]">
              <th className="py-2.5 px-3 font-medium">Endpoint</th>
              <th className="py-2.5 px-3 font-medium text-right">Requests</th>
              <th className="py-2.5 px-3 font-medium text-right">Errors</th>
              <th className="py-2.5 px-3 font-medium text-right">Error %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900/80">
            {endpoints.map((ep, idx) => {
              const isHighError = ep.errorRate >= 5.0;
              const isMediumError = ep.errorRate >= 2.0 && ep.errorRate < 5.0;

              return (
                <tr key={idx} className="hover:bg-slate-900/60 transition group">
                  <td className="py-3 px-3 whitespace-nowrap text-white font-bold">
                    <span
                      className={`inline-block w-12 text-[10px] font-extrabold uppercase mr-2 ${
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
                    <span className="text-slate-200">{ep.path}</span>
                  </td>

                  <td className="py-3 px-3 text-right text-slate-300 font-semibold whitespace-nowrap">
                    {formatNumber(ep.requests)}
                  </td>

                  <td className="py-3 px-3 text-right font-bold whitespace-nowrap">
                    <span className={ep.errors > 0 ? 'text-rose-400' : 'text-slate-400'}>
                      {formatNumber(ep.errors)}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-right font-bold whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] ${
                        isHighError
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : isMediumError
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/10 text-emerald-400'
                      }`}
                    >
                      {formatPercent(ep.errorRate)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
