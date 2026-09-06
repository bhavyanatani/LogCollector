'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

export default function ServiceHealthChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-500">
        No service health data available.
      </div>
    );
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="service" stroke="#64748b" tick={{ fontSize: 10 }} tickLine={false} />
          <YAxis stroke="#64748b" tick={{ fontSize: 10 }} tickLine={false} />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1">
                    <p className="font-bold text-indigo-400">{item.service}</p>
                    <p className="text-slate-300">Requests: <span className="font-mono text-white">{item.requests}</span></p>
                    <p className="text-rose-400">Errors: <span className="font-mono">{item.errors} ({item.errorRate}%)</span></p>
                    <p className="text-amber-400">Avg Latency: <span className="font-mono">{item.averageResponseTimeMs} ms</span></p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
          <Bar dataKey="requests" name="Total Requests" fill="#6366f1" radius={[4, 4, 0, 0]} />
          <Bar dataKey="errors" name="Errors" fill="#f43f5e" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
