export default function EmptyState({ title = 'No Data Found', message = 'No data matched your selected criteria.' }) {
  return (
    <div className="glass-panel rounded-2xl p-10 text-center max-w-md mx-auto my-6">
      <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <h3 className="text-base font-bold text-white mb-1">{title}</h3>
      <p className="text-slate-400 text-xs">{message}</p>
    </div>
  );
}
