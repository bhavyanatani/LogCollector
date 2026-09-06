'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import TimeRangeSelector from '@/components/common/TimeRangeSelector';
import ServiceHealthChart from '@/components/charts/ServiceHealthChart';
import Loading from '@/components/common/Loading';
import ErrorState from '@/components/common/ErrorState';
import { getServices } from '@/lib/api';
import { formatNumber, formatPercent, formatMs } from '@/lib/utils';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

export default function ServicesPage() {
  const [range, setRange] = useState('24h');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [services, setServices] = useState([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getServices({ range });
      if (res?.success) {
        setServices(res.data || []);
      } else {
        throw new Error('Failed to fetch service health stats');
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

  const allServices = ['auth-service', 'order-service', 'email-service'].map((svcName) => {
    const found = services.find((s) => s.service === svcName);
    return found || {
      service: svcName,
      requests: 0,
      errors: 0,
      errorRate: 0,
      averageResponseTimeMs: 0,
      slowRequests: 0,
      businessFailures: 0,
      externalServiceFailures: 0
    };
  });

  return (
    <AdminLayout title="Service Health" onRefresh={loadData}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Microservices Health &amp; Performance</h2>
          <p className="text-xs text-slate-400 mt-0.5">Comparative throughput, error rate, and response latency across services.</p>
        </div>
        <TimeRangeSelector selected={range} onChange={setRange} />
      </div>

      {error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : loading && services.length === 0 ? (
        <Loading type="table" />
      ) : (
        <>
          {/* Service Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {allServices.map((svc) => {
              const isHealthy = svc.errorRate < 2.0;

              return (
                <div key={svc.service} className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white font-mono">{svc.service}</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        isHealthy
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}
                    >
                      {isHealthy ? '● Healthy' : '● Needs Attention'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs font-mono pt-2">
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase block">HTTP Requests</span>
                      <span className="text-sm font-bold text-white">{formatNumber(svc.requests)}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase block">Error Rate</span>
                      <span className={`text-sm font-bold ${svc.errorRate > 2 ? 'text-rose-400' : 'text-slate-200'}`}>
                        {formatPercent(svc.errorRate)}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase block">Avg Response</span>
                      <span className="text-sm font-bold text-indigo-400">{formatMs(svc.averageResponseTimeMs)}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase block">Slow Requests</span>
                      <span className="text-sm font-bold text-amber-400">{formatNumber(svc.slowRequests)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Comparative Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-panel rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wide">Request Volume &amp; Errors Comparison</h3>
              <ServiceHealthChart data={allServices} />
            </div>

            <div className="glass-panel rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wide">Average Response Time by Service</h3>
              <div className="w-full h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={allServices} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="service" stroke="#64748b" tick={{ fontSize: 10 }} tickLine={false} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} tickLine={false} unit="ms" />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload;
                          return (
                            <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1">
                              <p className="font-bold text-white">{item.service}</p>
                              <p className="text-indigo-400">Avg Latency: <span className="font-mono text-white">{formatMs(item.averageResponseTimeMs)}</span></p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="averageResponseTimeMs" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Detailed Service Table */}
          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wide">Detailed Service Metrics Table</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Service</th>
                    <th className="py-3 px-4">Requests</th>
                    <th className="py-3 px-4">Errors</th>
                    <th className="py-3 px-4">Error Rate</th>
                    <th className="py-3 px-4">Avg Latency</th>
                    <th className="py-3 px-4">Slow Requests</th>
                    <th className="py-3 px-4">Business Failures</th>
                    <th className="py-3 px-4 text-right">External Failures</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {allServices.map((row) => (
                    <tr key={row.service} className="hover:bg-slate-900/60 transition">
                      <td className="py-3 px-4 font-bold text-white">{row.service}</td>
                      <td className="py-3 px-4 text-slate-300">{formatNumber(row.requests)}</td>
                      <td className="py-3 px-4 text-rose-400 font-bold">{formatNumber(row.errors)}</td>
                      <td className="py-3 px-4 font-bold text-rose-400">{formatPercent(row.errorRate)}</td>
                      <td className="py-3 px-4 text-indigo-400 font-bold">{formatMs(row.averageResponseTimeMs)}</td>
                      <td className="py-3 px-4 text-amber-400 font-bold">{formatNumber(row.slowRequests)}</td>
                      <td className="py-3 px-4 text-slate-300">{formatNumber(row.businessFailures)}</td>
                      <td className="py-3 px-4 text-right text-slate-300">{formatNumber(row.externalServiceFailures)}</td>
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
