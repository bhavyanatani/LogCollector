'use client';

export default function TimeRangeSelector({ selected = '24h', onChange }) {
  const ranges = [
    { label: 'Last 1 Hour', value: '1h' },
    { label: 'Last 6 Hours', value: '6h' },
    { label: 'Last 24 Hours', value: '24h' },
    { label: 'Last 7 Days', value: '7d' },
  ];

  return (
    <div className="flex items-center space-x-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs">
      {ranges.map((r) => {
        const isActive = selected === r.value;
        return (
          <button
            key={r.value}
            onClick={() => onChange && onChange(r.value)}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              isActive
                ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            {r.label}
          </button>
        );
      })}
    </div>
  );
}
