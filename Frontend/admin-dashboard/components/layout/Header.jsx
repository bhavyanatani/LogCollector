'use client';

import { useState, useEffect } from 'react';
import { getHealth } from '@/lib/api';

export default function Header({ title = 'Dashboard', onRefresh, autoRefresh, setAutoRefresh }) {
  const [apiConnected, setApiConnected] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const checkHealth = async () => {
    try {
      setChecking(true);
      const res = await getHealth();
      setApiConnected(res.success && res.data?.status === 'UP');
    } catch (err) {
      setApiConnected(false);
    } finally {
      setChecking(false);
    }
  };

  return (
    <header className="h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-20 px-6 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <h1 className="text-base font-extrabold text-white tracking-wide">{title}</h1>
      </div>

      <div className="flex items-center space-x-4">
        {/* API Health Indicator */}
        <div
          className={`flex items-center space-x-2 px-3 py-1 rounded-full border text-xs font-semibold ${
            apiConnected
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${apiConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
          <span>{apiConnected ? 'Analytics API Connected' : 'Analytics API Unavailable'}</span>
        </div>

        {/* Auto Refresh Toggle */}
        {setAutoRefresh && (
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold border transition ${
              autoRefresh
                ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            Auto-refresh: {autoRefresh ? 'ON (30s)' : 'OFF'}
          </button>
        )}

        {/* Manual Refresh Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Refresh Data"
          >
            <svg className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )}
      </div>
    </header>
  );
}
