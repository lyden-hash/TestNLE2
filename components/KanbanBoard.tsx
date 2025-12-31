
import React, { useState, useMemo } from 'react';
import { Estimate, Customer, EstimateStatus } from '../types';

interface KanbanBoardProps {
  estimates: Estimate[];
  customers: Customer[];
  onSelectEstimate: (id: string) => void;
  onUpdateStatus: (id: string, status: EstimateStatus) => void;
}

const STATUS_CONFIG: { label: string; status: EstimateStatus; color: string; hoverColor: string }[] = [
  { label: 'Draft', status: 'Draft', color: 'border-slate-500', hoverColor: 'border-slate-400' },
  { label: 'Submitted', status: 'Submitted', color: 'border-blue-500', hoverColor: 'border-blue-400' },
  { label: 'Won', status: 'Won', color: 'border-emerald-500', hoverColor: 'border-emerald-400' },
  { label: 'Lost', status: 'Lost', color: 'border-red-500', hoverColor: 'border-red-400' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ estimates, customers, onSelectEstimate, onUpdateStatus }) => {
  const [dragOverColumn, setDragOverColumn] = useState<EstimateStatus | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEstimates = useMemo(() => {
    if (!searchQuery.trim()) return estimates;
    const query = searchQuery.toLowerCase();
    return estimates.filter((est) => {
      const customer = customers.find((c) => c.id === est.customerId);
      return (
        est.name.toLowerCase().includes(query) ||
        (customer && customer.name.toLowerCase().includes(query))
      );
    });
  }, [estimates, customers, searchQuery]);

  const onDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('estimateId', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e: React.DragEvent, status: EstimateStatus) => {
    e.preventDefault();
    if (dragOverColumn !== status) {
      setDragOverColumn(status);
    }
  };

  const onDragLeave = () => {
    setDragOverColumn(null);
  };

  const onDrop = (e: React.DragEvent, status: EstimateStatus) => {
    e.preventDefault();
    const estimateId = e.dataTransfer.getData('estimateId');
    if (estimateId) {
      onUpdateStatus(estimateId, status);
    }
    setDragOverColumn(null);
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 animate-fade-in overflow-hidden">
      <div className="flex-none px-8 pt-8 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Project Pipeline</h1>
          <p className="text-slate-400 mt-1">Track bid status from draft through project award.</p>
        </div>
        <div className="relative w-80">
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm"></i>
          <input
            type="text"
            placeholder="Filter projects..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-600 shadow-inner"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 flex gap-6 px-8 pb-8 overflow-x-auto custom-scrollbar">
        {STATUS_CONFIG.map((col) => {
          const colEstimates = filteredEstimates.filter((e) => e.status === col.status);
          const colTotal = colEstimates.reduce((acc, curr) => acc + curr.total, 0);
          const isOver = dragOverColumn === col.status;

          return (
            <div 
              key={col.status} 
              className={`flex-none w-80 flex flex-col h-full transition-all duration-200 ${
                isOver ? 'bg-indigo-500/5 ring-1 ring-indigo-500/20 rounded-2xl' : ''
              }`}
              onDragOver={(e) => onDragOver(e, col.status)}
              onDragLeave={onDragLeave}
              onDrop={(e) => onDrop(e, col.status)}
            >
              <div className={`flex flex-col gap-1 mb-4 border-t-2 ${isOver ? col.hoverColor : col.color} pt-3 px-1`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">{col.label}</h3>
                  <span className="bg-slate-800 text-slate-500 text-[10px] font-black px-2 py-0.5 rounded-full">
                    {colEstimates.length}
                  </span>
                </div>
                <p className="text-xs font-mono font-bold text-slate-600">${colTotal.toLocaleString()}</p>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-1 min-h-[100px]">
                {colEstimates.map((est) => {
                  const customer = customers.find((c) => c.id === est.customerId);
                  const initials = customer?.name.split(' ').map(n => n[0]).join('').substring(0, 2) || '?';
                  
                  return (
                    <div 
                      key={est.id}
                      draggable="true"
                      onDragStart={(e) => onDragStart(e, est.id)}
                      onClick={() => onSelectEstimate(est.id)}
                      className="bg-slate-900 border border-slate-800 p-5 rounded-2xl hover:border-indigo-500/50 transition-all cursor-grab active:cursor-grabbing group shadow-lg hover:shadow-indigo-500/5"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-8 h-8 bg-slate-800 rounded-xl flex items-center justify-center text-[10px] font-black text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                          {initials}
                        </div>
                        <span className="text-[9px] font-mono text-slate-600">#{est.id.slice(-4)}</span>
                      </div>

                      <h4 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors leading-tight mb-1">
                        {est.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight truncate">{customer?.name}</p>
                      
                      <div className="flex justify-between items-center pt-4 mt-4 border-t border-slate-800/50">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <i className="far fa-calendar text-[10px]"></i>
                          <span className="text-[10px] font-bold uppercase tracking-tighter">
                            {new Date(est.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <span className="text-xs font-black text-slate-200 font-mono tracking-tight">${est.total.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}

                {colEstimates.length === 0 && (
                  <div className="border-2 border-dashed border-slate-800/30 rounded-2xl h-32 flex flex-col items-center justify-center gap-2 opacity-50">
                    <i className="fas fa-file-import text-slate-800 text-xl"></i>
                    <span className="text-[9px] font-bold text-slate-700 uppercase tracking-widest">
                      {searchQuery ? 'No Results' : 'Drop Here'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
