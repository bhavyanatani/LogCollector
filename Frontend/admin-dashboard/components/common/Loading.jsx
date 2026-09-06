export default function Loading({ type = 'card', count = 4 }) {
  if (type === 'chart') {
    return (
      <div className="glass-panel rounded-2xl p-6 animate-pulse">
        <div className="h-5 bg-slate-800 rounded w-1/4 mb-6"></div>
        <div className="h-64 bg-slate-900/60 rounded-xl"></div>
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="glass-panel rounded-2xl p-6 animate-pulse space-y-4">
        <div className="h-6 bg-slate-800 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-slate-900/80 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
          <div className="h-3 bg-slate-800 rounded w-1/2"></div>
          <div className="h-8 bg-slate-800 rounded w-3/4"></div>
        </div>
      ))}
    </div>
  );
}
