'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell
} from 'recharts';

export default function FailureChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-500">
        No failure chart data available.
      </div>
    );
  }

  const COLORS = ['#f43f5e', '#fb7185', '#f43f5e', '#e11d48', '#be123c'];

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="event"
            stroke="#64748b"
            tick={{ fontSize: 10 }}
            tickLine={false}
          />
          <YAxis stroke="#64748b" tick={{ fontSize: 10 }} tickLine={false} />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1">
                    <p className="font-bold text-rose-400">{item.event}</p>
                    <p className="text-slate-300">Service: <span className="text-white font-mono">{item.service}</span></p>
                    <p className="text-white">Occurrences: <span className="font-mono">{item.count}</span></p>
                    <p className="text-slate-400">Share: <span className="font-mono">{item.percentageOfFailures}%</span></p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
