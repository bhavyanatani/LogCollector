export default function StatCard({ title, value, subtext, status = 'neutral', icon }) {
  const statusStyles = {
    neutral: 'border-slate-800 bg-slate-900/60 text-slate-100',
    warning: 'border-amber-500/30 bg-amber-500/5 text-amber-300',
    danger: 'border-rose-500/30 bg-rose-500/5 text-rose-300',
    success: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300',
  };

  return (
    <div className={`glass-card rounded-2xl p-5 border transition hover:border-slate-700 flex flex-col justify-between ${statusStyles[status] || statusStyles.neutral}`}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold font-mono text-slate-400 uppercase tracking-wider">{title}</span>
        {icon && <div className="text-slate-400">{icon}</div>}
      </div>
      <div className="mt-3">
        <div className="text-2xl font-extrabold text-white tracking-tight font-mono">{value}</div>
        {subtext && <p className="text-[11px] text-slate-400 mt-1">{subtext}</p>}
      </div>
    </div>
  );
}
