'use client';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { formatDate, formatMs } from '@/lib/utils';

export default function ResponseTimeChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-500">
        No performance trend data available for this range.
      </div>
    );
  }

  const formattedData = data.map((item) => ({
    ...item,
    formattedTime: formatDate(item.time)
  }));

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="formattedTime"
            stroke="#64748b"
            tick={{ fontSize: 10 }}
            tickLine={false}
          />
          <YAxis
            stroke="#64748b"
            tick={{ fontSize: 10 }}
            tickLine={false}
            unit="ms"
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1">
                    <p className="font-bold text-white mb-1">{item.formattedTime}</p>
                    <p className="text-indigo-400">Avg Latency: <span className="font-mono text-white">{formatMs(item.averageResponseTimeMs)}</span></p>
                    <p className="text-slate-300">Requests: <span className="font-mono text-white">{item.requestCount}</span></p>
                    <p className="text-amber-400">Slow Requests: <span className="font-mono text-white">{item.slowRequestCount}</span></p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="averageResponseTimeMs"
            stroke="#6366f1"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorAvg)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
