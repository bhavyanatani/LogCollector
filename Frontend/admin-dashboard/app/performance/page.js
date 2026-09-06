'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import TimeRangeSelector from '@/components/common/TimeRangeSelector';
import StatCard from '@/components/dashboard/StatCard';
import ResponseTimeChart from '@/components/charts/ResponseTimeChart';
import TopSlowEndpointsTable from '@/components/dashboard/TopSlowEndpointsTable';
import Loading from '@/components/common/Loading';
import ErrorState from '@/components/common/ErrorState';
import { getPerformance, getSlowEndpoints } from '@/lib/api';
import { formatNumber, formatMs, formatDate } from '@/lib/utils';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

export default function PerformancePage() {
  const [range, setRange] = useState('24h');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [performance, setPerformance] = useState(null);
  const [slowEndpoints, setSlowEndpoints] = useState([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [res, slowRes] = await Promise.all([
        getPerformance({ range }).catch(() => null),
        getSlowEndpoints({ range, limit: 10 }).catch(() => null)
      ]);

      if (res?.success) setPerformance(res.data);
      if (slowRes?.success) setSlowEndpoints(slowRes.data || []);

      if (!res && !slowRes) {
        throw new Error('Failed to fetch performance metrics');
      }
    } catch (err) {
      setError(err.message || 'Unable to connect to Analytics API');
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const summary = performance?.summary || {};
  const trend = performance?.trend || [];

  const formattedTrend = trend.map((item) => ({
    ...item,
    formattedTime: formatDate(item.time)
  }));

  return (
    <AdminLayout title="Performance Metrics" onRefresh={loadData}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Latency &amp; Throughput Analytics</h2>
          <p className="text-xs text-slate-400 mt-0.5 font-sans">Identify latency degradation, slow requests, and endpoint bottlenecks.</p>
        </div>
        <TimeRangeSelector selected={range} onChange={setRange} />
      </div>

      {error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : loading && !performance ? (
        <Loading type="chart" />
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              title="Average Latency"
              value={formatMs(summary.averageResponseTimeMs)}
              subtext="Overall mean response time"
              status={summary.averageResponseTimeMs > 500 ? 'warning' : 'neutral'}
            />
            <StatCard
              title="Min Latency"
              value={formatMs(summary.minimumResponseTimeMs)}
              subtext="Fastest recorded request"
              status="success"
            />
            <StatCard
              title="Max Latency"
              value={formatMs(summary.maximumResponseTimeMs)}
              subtext="Slowest recorded request"
              status={summary.maximumResponseTimeMs > 1000 ? 'danger' : 'warning'}
            />
            <StatCard
              title="Slow Requests (≥500ms)"
              value={formatNumber(summary.slowRequestCount)}
              subtext="Moderate latency requests"
              status={summary.slowRequestCount > 0 ? 'warning' : 'neutral'}
            />
            <StatCard
              title="Very Slow (>1000ms)"
              value={formatNumber(summary.verySlowRequestCount)}
              subtext="High latency requests"
              status={summary.verySlowRequestCount > 0 ? 'danger' : 'neutral'}
            />
          </div>

          {/* Top Slow Endpoints Table */}
          <TopSlowEndpointsTable endpoints={slowEndpoints} />

          {/* Main Response Time Trend Chart */}
          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wide font-mono">Average Response Time Trend</h3>
            <ResponseTimeChart data={trend} />
          </div>

          {/* Secondary Charts: Volume & Slow Requests */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-panel rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wide font-mono">Request Volume Trend</h3>
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={formattedTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="formattedTime" stroke="#64748b" tick={{ fontSize: 10 }} tickLine={false} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} tickLine={false} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload;
                          return (
                            <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1">
                              <p className="font-bold text-white">{item.formattedTime}</p>
                              <p className="text-indigo-400">Total Requests: <span className="font-mono text-white">{item.requestCount}</span></p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="requestCount" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wide font-mono">Slow Requests Trend (≥500ms)</h3>
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={formattedTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="formattedTime" stroke="#64748b" tick={{ fontSize: 10 }} tickLine={false} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} tickLine={false} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload;
                          return (
                            <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1 font-mono">
                              <p className="font-bold text-white">{item.formattedTime}</p>
                              <p className="text-amber-400">Slow Requests: <span className="font-mono text-white">{item.slowRequestCount}</span></p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="slowRequestCount" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Trend Breakdown Table */}
          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wide font-mono">Performance Data Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Bucket Time</th>
                    <th className="py-3 px-4">Request Volume</th>
                    <th className="py-3 px-4">Average Response Time</th>
                    <th className="py-3 px-4 text-right">Slow Requests</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {formattedTrend.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/60 transition">
                      <td className="py-3 px-4 font-bold text-white">{row.formattedTime}</td>
                      <td className="py-3 px-4 text-slate-300">{formatNumber(row.requestCount)}</td>
                      <td className="py-3 px-4 text-indigo-400 font-bold">{formatMs(row.averageResponseTimeMs)}</td>
                      <td className="py-3 px-4 text-right text-amber-400 font-bold">{formatNumber(row.slowRequestCount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
