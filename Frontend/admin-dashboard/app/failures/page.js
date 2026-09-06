'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import TimeRangeSelector from '@/components/common/TimeRangeSelector';
import StatCard from '@/components/dashboard/StatCard';
import FailureChart from '@/components/charts/FailureChart';
import EndpointHealthTable from '@/components/dashboard/EndpointHealthTable';
import Loading from '@/components/common/Loading';
import ErrorState from '@/components/common/ErrorState';
import EmptyState from '@/components/common/EmptyState';
import { getFailures, getOverview, getEndpoints } from '@/lib/api';
import { formatNumber, formatPercent } from '@/lib/utils';

export default function FailuresPage() {
  const [range, setRange] = useState('24h');
  const [limit, setLimit] = useState(15);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [failures, setFailures] = useState([]);
  const [overview, setOverview] = useState(null);
  const [endpoints, setEndpoints] = useState([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const [failRes, overviewRes, epRes] = await Promise.all([
        getFailures({ range, limit }).catch(() => null),
        getOverview({ range }).catch(() => null),
        getEndpoints({ range, limit: 10 }).catch(() => null),
      ]);

      if (failRes?.success) setFailures(failRes.data || []);
      if (overviewRes?.success) setOverview(overviewRes.data);
      if (epRes?.success) setEndpoints(epRes.data || []);

      if (!failRes && !overviewRes && !epRes) {
        throw new Error('Failed to fetch failure analytics');
      }
    } catch (err) {
      setError(err.message || 'Unable to connect to Analytics API');
    } finally {
      setLoading(false);
    }
  }, [range, limit]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalFailures = failures.reduce((sum, item) => sum + (item.count || 0), 0);

  return (
    <AdminLayout title="Recurring Failures" onRefresh={loadData}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">System &amp; Business Failure Patterns</h2>
          <p className="text-xs text-slate-400 mt-0.5">Track recurring event failures, application errors, and endpoint error rates.</p>
        </div>
        <TimeRangeSelector selected={range} onChange={setRange} />
      </div>

      {error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : loading && failures.length === 0 ? (
        <Loading type="table" />
      ) : (
        <>
          {/* Failure Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Failures"
              value={formatNumber(totalFailures)}
              subtext="Combined error & failure count"
              status={totalFailures > 0 ? 'danger' : 'neutral'}
            />
            <StatCard
              title="Most Frequent Failure"
              value={failures[0]?.event || 'None'}
              subtext={failures[0] ? `${failures[0].count} occurrences (${failures[0].service})` : 'No failures'}
              status={failures[0] ? 'warning' : 'success'}
            />
            <StatCard
              title="Business Failures"
              value={formatNumber(overview?.businessFailures)}
              subtext="Payment, Login & Cancel errors"
              status={overview?.businessFailures > 0 ? 'warning' : 'neutral'}
            />
            <StatCard
              title="External Service Failures"
              value={formatNumber(overview?.externalServiceFailures)}
              subtext="Email provider & delivery errors"
              status={overview?.externalServiceFailures > 0 ? 'danger' : 'neutral'}
            />
          </div>

          {/* Endpoint Health Table */}
          <EndpointHealthTable endpoints={endpoints} />

          {/* Failures Chart */}
          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wide">Failure Events Distribution</h3>
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-slate-400">Limit:</span>
                <select
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white font-mono"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={20}>20</option>
                </select>
              </div>
            </div>
            <FailureChart data={failures} />
          </div>

          {/* Detailed Failures Table */}
          {failures.length === 0 ? (
            <EmptyState title="No Recurring Failures" message="Zero failure events logged for the selected time range." />
          ) : (
            <div className="glass-panel rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wide">Recurring Failures Ranking</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Rank</th>
                      <th className="py-3 px-4">Service</th>
                      <th className="py-3 px-4">Failure Event</th>
                      <th className="py-3 px-4">Occurrences</th>
                      <th className="py-3 px-4 text-right">% of All Failures</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {failures.map((item, index) => (
                      <tr key={index} className="hover:bg-slate-900/60 transition">
                        <td className="py-3 px-4 font-bold text-slate-400">#{index + 1}</td>
                        <td className="py-3 px-4 text-slate-200">{item.service}</td>
                        <td className="py-3 px-4 font-bold text-rose-400">{item.event}</td>
                        <td className="py-3 px-4 text-white font-bold">{formatNumber(item.count)}</td>
                        <td className="py-3 px-4 text-right font-bold text-indigo-400">
                          {formatPercent(item.percentageOfFailures)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
}
