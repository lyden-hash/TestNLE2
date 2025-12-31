
import React from 'react';

interface AppLayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, sidebar }) => {
  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-200 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 flex-none border-r border-slate-800 bg-slate-900/50 flex flex-col">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <i className="fas fa-hammer text-white text-xl"></i>
            </div>
            <h1 className="text-xl font-black tracking-tight text-white uppercase italic">Construct<span className="text-indigo-500">AI</span></h1>
          </div>
          {sidebar}
        </div>
        <div className="mt-auto p-8 border-t border-slate-800 bg-slate-900/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden border border-slate-600 shadow-xl shadow-black/40">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" alt="Alex Foreman" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Alex Foreman</p>
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Senior Estimator</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden flex flex-col bg-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(79,70,229,0.05),transparent_40%)] pointer-events-none"></div>
        <header className="flex-none h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-950/50 backdrop-blur-md z-10">
          <div className="flex items-center gap-4">
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Workspace</span>
             <i className="fas fa-chevron-right text-[8px] text-slate-700"></i>
             <span className="text-sm font-bold text-slate-300">Enterprise Pipeline</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-emerald-500 bg-emerald-500/5 px-3 py-1 rounded-full border border-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
               <span className="text-[10px] font-black uppercase tracking-widest">Live Engine</span>
            </div>
            <button className="text-slate-500 hover:text-white transition-colors p-2"><i className="fas fa-bell"></i></button>
            <button className="text-slate-500 hover:text-white transition-colors p-2"><i className="fas fa-cog"></i></button>
          </div>
        </header>
        <div className="flex-1 overflow-hidden relative bg-slate-950">
          {children}
        </div>
      </main>
    </div>
  );
};
