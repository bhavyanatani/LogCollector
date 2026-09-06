'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import LogLevelBadge from '@/components/logs/LogLevelBadge';
import Loading from '@/components/common/Loading';
import ErrorState from '@/components/common/ErrorState';
import EmptyState from '@/components/common/EmptyState';
import { getTrace } from '@/lib/api';
import { formatDate, formatMs } from '@/lib/utils';

export default function TracePage() {
  const params = useParams();
  const requestId = params?.requestId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trace, setTrace] = useState(null);
  const [expandedEvents, setExpandedEvents] = useState({});

  const loadTraceData = useCallback(async () => {
    if (!requestId) return;

    try {
      setLoading(true);
      setError('');
      const res = await getTrace(requestId);

      if (res?.success && res.data) {
        setTrace(res.data);
      } else {
        throw new Error(res?.message || 'Failed to load request trace');
      }
    } catch (err) {
      setError(err.message || 'Trace not found or Analytics API unreachable');
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    loadTraceData();
  }, [loadTraceData]);

  const toggleEventExpand = (eventId) => {
    setExpandedEvents((prev) => ({
      ...prev,
      [eventId]: !prev[eventId]
    }));
  };

  const isFailed = trace?.status === 'FAILED';

  // Compute service transitions for visualization flow
  const serviceSequence = trace?.timeline?.reduce((acc, item) => {
    if (acc.length === 0 || acc[acc.length - 1] !== item.service) {
      acc.push(item.service);
    }
    return acc;
  }, []) || [];

  return (
    <AdminLayout title="Distributed Request Trace" onRefresh={loadTraceData}>
      <div className="space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/logs"
            className="text-xs font-semibold text-slate-400 hover:text-white flex items-center space-x-1 font-mono transition"
          >
            <span>&larr; Back to Log Explorer</span>
          </Link>
          <span className="text-xs font-mono text-slate-500">
            Request ID: <span className="text-indigo-400 font-bold">{requestId}</span>
          </span>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={loadTraceData} />
        ) : loading ? (
          <Loading type="card" count={3} />
        ) : !trace ? (
          <EmptyState
            title="Trace Not Found"
            message={`No log events associated with request ID "${requestId}" were found in MongoDB.`}
          />
        ) : (
          <div className="space-y-8">
            {/* Header Trace Overview Banner */}
            <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6 border border-slate-800">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-mono font-bold border tracking-wider uppercase ${
                        isFailed
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      }`}
                    >
                      {isFailed ? '✖ FAILED TRACE' : '✔ SUCCESSFUL TRACE'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {trace.totalEvents} Log {trace.totalEvents === 1 ? 'Event' : 'Events'}
                    </span>
                  </div>

                  <h1 className="text-xl sm:text-2xl font-extrabold text-white font-mono break-all">
                    {trace.requestId}
                  </h1>
                </div>

                {/* Quick Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 uppercase block">Total Duration</span>
                    <span className="text-sm font-bold text-white">{formatMs(trace.durationMs)}</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 uppercase block">Services Involved</span>
                    <span className="text-sm font-bold text-indigo-400">{trace.services.length}</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 uppercase block">Total Events</span>
                    <span className="text-sm font-bold text-slate-200">{trace.totalEvents}</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 uppercase block">Overall Status</span>
                    <span className={`text-sm font-bold ${isFailed ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {trace.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Service Transition Flow Diagram */}
              <div>
                <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-3">
                  Service Transition Flow
                </h3>
                <div className="flex items-center flex-wrap gap-2.5 font-mono text-xs">
                  <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 font-bold">
                    Client Request
                  </span>

                  {serviceSequence.map((svc, idx) => (
                    <div key={idx} className="flex items-center space-x-2.5">
                      <span className="text-indigo-400 font-bold text-base">&rarr;</span>
                      <span className="px-3.5 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 font-bold">
                        {svc}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Chronological Event Timeline */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wide font-mono flex items-center justify-between">
                <span>Chronological Execution Timeline</span>
                <span className="text-xs text-slate-400 font-normal">Sorted by timestamp ascending</span>
              </h3>

              <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2.5 sm:before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
                {trace.timeline.map((event, index) => {
                  const isEventError = event.level === 'ERROR' || event.analytics?.isServerError;
                  const isExpanded = !!expandedEvents[event._id || index];
                  const statusCode = event.http?.statusCode;

                  return (
                    <div key={event._id || index} className="relative group">
                      {/* Timeline Dot */}
                      <div
                        className={`absolute -left-[19px] sm:-left-[23px] top-4 w-4 h-4 rounded-full border-2 bg-slate-950 transition ${
                          isEventError
                            ? 'border-rose-500 bg-rose-500/30 ring-4 ring-rose-500/10'
                            : 'border-indigo-500 bg-indigo-500/30'
                        }`}
                      />

                      {/* Event Card */}
                      <div
                        className={`glass-panel rounded-2xl p-5 border transition space-y-3 ${
                          isEventError
                            ? 'border-rose-500/40 bg-rose-950/10'
                            : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {/* Event Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs">
                          <div className="flex items-center flex-wrap gap-2.5">
                            <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/20 text-[11px]">
                              {event.service}
                            </span>
                            <LogLevelBadge level={event.level} />
                            <span className="text-white font-bold text-sm tracking-tight">{event.event}</span>
                          </div>

                          <div className="text-slate-400 text-[11px]">
                            {formatDate(event.timestamp)}
                          </div>
                        </div>

                        {/* Event Message */}
                        <p className="text-slate-200 text-xs sm:text-sm font-sans">{event.message}</p>

                        {/* HTTP & Performance Badges */}
                        <div className="flex items-center flex-wrap gap-4 font-mono text-xs pt-1">
                          {event.http?.method && (
                            <div className="flex items-center space-x-1.5 text-slate-300">
                              <span className="text-slate-500 text-[10px] uppercase">HTTP:</span>
                              <span className="font-bold text-white">{event.http.method} {event.http.path}</span>
                              {statusCode && (
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                    statusCode >= 500
                                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                      : statusCode >= 400
                                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  }`}
                                >
                                  {statusCode}
                                </span>
                              )}
                            </div>
                          )}

                          {event.performance?.responseTimeMs !== undefined && (
                            <div className="flex items-center space-x-1 text-slate-300">
                              <span className="text-slate-500 text-[10px] uppercase">Latency:</span>
                              <span
                                className={`font-bold ${
                                  event.analytics?.isVerySlowRequest
                                    ? 'text-rose-400'
                                    : event.analytics?.isSlowRequest
                                    ? 'text-amber-400'
                                    : 'text-slate-200'
                                }`}
                              >
                                {event.performance.responseTimeMs} ms
                              </span>
                            </div>
                          )}

                          {/* Toggle Details / Metadata */}
                          {(event.metadata && Object.keys(event.metadata).length > 0) || event.error ? (
                            <button
                              onClick={() => toggleEventExpand(event._id || index)}
                              className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition underline ml-auto"
                            >
                              {isExpanded ? 'Hide Raw Details ▲' : 'View Raw Details ▼'}
                            </button>
                          ) : null}
                        </div>

                        {/* Error Snapshot */}
                        {event.error && (
                          <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/30 space-y-1 font-mono text-xs">
                            <div className="text-rose-400 font-bold">
                              Error [{event.error.code || 'ERROR'}]: {event.error.type}
                            </div>
                            <div className="text-slate-300">{event.error.message}</div>
                          </div>
                        )}

                        {/* Expandable JSON Metadata */}
                        {isExpanded && event.metadata && Object.keys(event.metadata).length > 0 && (
                          <div className="pt-2 border-t border-slate-800/80">
                            <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">
                              Metadata Payload
                            </span>
                            <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto">
                              {JSON.stringify(event.metadata, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
