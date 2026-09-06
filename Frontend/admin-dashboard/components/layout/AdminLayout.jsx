'use client';

import Sidebar from './Sidebar';
import Header from './Header';

export default function AdminLayout({ children, title, onRefresh, autoRefresh, setAutoRefresh }) {
  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="pl-64 flex-1 flex flex-col min-w-0">
        <Header
          title={title}
          onRefresh={onRefresh}
          autoRefresh={autoRefresh}
          setAutoRefresh={setAutoRefresh}
        />
        <main className="flex-1 p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
