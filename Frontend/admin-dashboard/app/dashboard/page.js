'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/layout/AdminLayout';
import TimeRangeSelector from '@/components/common/TimeRangeSelector';
import StatCard from '@/components/dashboard/StatCard';
import RecentFailures from '@/components/dashboard/RecentFailures';
import ResponseTimeChart from '@/components/charts/ResponseTimeChart';
import Loading from '@/components/common/Loading';
import ErrorState from '@/components/common/ErrorState';
import LogTable from '@/components/logs/LogTable';
import {
  getOverview,
  getPerformance,
  getFailures,
  getServices,
  getLogs
} from '@/lib/api';
import { formatNumber, formatPercent, formatMs } from '@/lib/utils';

export default function DashboardPage() {
  const [range, setRange] = useState('24h');
  const [autoRefresh, setAutoRefresh] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [overview, setOverview] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [failures, setFailures] = useState([]);
  const [services, setServices] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const [overviewRes, perfRes, failRes, servRes, logsRes] = await Promise.all([
        getOverview({ range }).catch(() => null),
        getPerformance({ range }).catch(() => null),
        getFailures({ range, limit: 5 }).catch(() => null),
        getServices({ range }).catch(() => null),
        getLogs({ page: 1, limit: 5 }).catch(() => null),
      ]);

      if (overviewRes?.success) setOverview(overviewRes.data);
      if (perfRes?.success) setPerformance(perfRes.data);
      if (failRes?.success) setFailures(failRes.data || []);
      if (servRes?.success) setServices(servRes.data || []);
      if (logsRes?.success) setRecentLogs(logsRes.data?.logs || []);

      if (!overviewRes && !perfRes && !failRes) {
        throw new Error('Failed to fetch data from Analytics API');
      }
    } catch (err) {
      setError(err.message || 'Unable to connect to Analytics API');
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadDashboardData]);

  return (
    <AdminLayout
      title="System Overview"
      onRefresh={loadDashboardData}
      autoRefresh={autoRefresh}
      setAutoRefresh={setAutoRefresh}
    >
      {/* Header controls bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Observability Overview</h2>
          <p className="text-xs text-slate-400 mt-0.5">Real-time system health, error rates, and latency analytics.</p>
        </div>
        <TimeRangeSelector selected={range} onChange={setRange} />
      </div>

      {error ? (
        <ErrorState message={error} onRetry={loadDashboardData} />
      ) : loading && !overview ? (
        <Loading type="card" count={4} />
      ) : (
        <>
          {/* Stat Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <StatCard
              title="Total Logs"
              value={formatNumber(overview?.totalLogs)}
              subtext={`${formatNumber(overview?.totalRequests)} HTTP requests`}
            />
            <StatCard
              title="Error Rate"
              value={formatPercent(overview?.errorRate)}
              subtext={`${formatNumber(overview?.totalErrors)} total errors`}
              status={overview?.errorRate > 5 ? 'danger' : overview?.errorRate > 2 ? 'warning' : 'success'}
            />
            <StatCard
              title="Avg Latency"
              value={formatMs(overview?.averageResponseTimeMs)}
              subtext={`${formatNumber(overview?.slowRequests)} slow (≥500ms)`}
              status={overview?.averageResponseTimeMs > 500 ? 'warning' : 'neutral'}
            />
            <StatCard
              title="Business Failures"
              value={formatNumber(overview?.businessFailures)}
              subtext="Payment & Login errors"
              status={overview?.businessFailures > 0 ? 'warning' : 'neutral'}
            />
            <StatCard
              title="External Failures"
              value={formatNumber(overview?.externalServiceFailures)}
              subtext="Email service errors"
              status={overview?.externalServiceFailures > 0 ? 'danger' : 'neutral'}
            />
          </div>

          {/* Main Grid: Chart + Failures */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 glass-panel rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wide">Response Time Trend</h3>
                  <p className="text-xs text-slate-400">Average request latency over time ({range})</p>
                </div>
                <Link href="/performance" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">
                  View Performance &rarr;
                </Link>
              </div>
              <ResponseTimeChart data={performance?.trend} />
            </div>

            <div className="lg:col-span-4">
              <RecentFailures failures={failures} />
            </div>
          </div>

          {/* Service Health Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wide">Service Health Breakdown</h3>
              <Link href="/services" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">
                View All Services &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['auth-service', 'order-service', 'email-service'].map((svcName) => {
                const svc = services.find((s) => s.service === svcName) || {
                  service: svcName,
                  requests: 0,
                  errors: 0,
                  errorRate: 0,
                  averageResponseTimeMs: 0
                };

                const isHealthy = svc.errorRate < 2.0;

                return (
                  <div key={svcName} className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white font-mono">{svcName}</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          isHealthy
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}
                      >
                        {isHealthy ? 'Healthy' : 'Needs Attention'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block">Requests</span>
                        <span className="text-white font-bold">{formatNumber(svc.requests)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block">Error Rate</span>
                        <span className={svc.errorRate > 2 ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                          {formatPercent(svc.errorRate)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block">Avg Latency</span>
                        <span className="text-white">{formatMs(svc.averageResponseTimeMs)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block">Slow Requests</span>
                        <span className="text-amber-400">{formatNumber(svc.slowRequests)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Logs Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wide">Recent Processed Logs</h3>
              <Link href="/logs" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">
                View All Logs &rarr;
              </Link>
            </div>
            <LogTable logs={recentLogs} />
          </div>
        </>
      )}
    </AdminLayout>
  );
}
