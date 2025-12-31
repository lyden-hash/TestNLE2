
import React, { useState, useMemo } from 'react';
import { AppLayout } from './components/Layout';
import { DashboardStats } from './components/Dashboard';
import { KanbanBoard } from './components/KanbanBoard';
import { DocumentScanner } from './components/DocumentScanner';
import { SiteReporter } from './components/SiteReporter';
import { SalesAssistant } from './components/SalesAssistant';
import { Estimate, Customer, EstimateStatus, LineItem, AIInsight, SuggestedItem, MarketInsight } from './types';
import { analyzeEstimate, getMaterialSuggestions, fetchMarketIntelligence } from './services/geminiService';
import { MOCK_CUSTOMERS, INITIAL_ESTIMATES } from './constants';

const App: React.FC = () => {
  const [view, setView] = useState<'dashboard' | 'estimates' | 'builder' | 'customers' | 'kanban' | 'docscan' | 'reporter' | 'assistant'>('dashboard');
  const [estimates, setEstimates] = useState<Estimate[]>(INITIAL_ESTIMATES);
  const [selectedEstId, setSelectedEstId] = useState<string | null>(null);
  
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [isMarketLoading, setIsMarketLoading] = useState(false);

  const [aiInsight, setAiInsight] = useState<AIInsight | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestedItem[] | null>(null);
  const [marketInsight, setMarketInsight] = useState<MarketInsight | null>(null);

  const activeEstimate = useMemo(() => 
    estimates.find(e => e.id === selectedEstId), 
    [estimates, selectedEstId]
  );

  const calculateSubtotal = (items: LineItem[]) => items.reduce((acc, l) => acc + l.amount, 0);

  const calculateGrandTotal = (est: Estimate) => {
    const subtotal = calculateSubtotal(est.lineItems);
    const marginAmt = subtotal * ((est.margin || 0) / 100);
    const taxAmt = (subtotal + marginAmt) * ((est.tax || 0) / 100);
    return subtotal + marginAmt + taxAmt;
  };

  const resetAISidebars = () => {
    setAiInsight(null);
    setSuggestions(null);
    setMarketInsight(null);
  };

  const handleCreateEstimate = () => {
    const newEst: Estimate = {
      id: `est-${Math.random().toString(36).substr(2, 5)}`,
      name: 'New Project Proposal',
      customerId: MOCK_CUSTOMERS[0].id,
      location: 'Tulsa, OK',
      status: 'Draft',
      total: 0,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      memo: '',
      exclusions: '',
      lineItems: [],
      updatedAt: Date.now(),
      margin: 15,
      tax: 8.5
    };
    setEstimates(prev => [newEst, ...prev]);
    setSelectedEstId(newEst.id);
    resetAISidebars();
    setView('builder');
  };

  const handleUpdateEstimate = (updates: Partial<Estimate>) => {
    if (!selectedEstId) return;
    setEstimates(prev => prev.map(e => {
      if (e.id === selectedEstId) {
        const merged = { ...e, ...updates, updatedAt: Date.now() };
        merged.total = calculateGrandTotal(merged);
        return merged;
      }
      return e;
    }));
  };

  const handleUpdateStatus = (id: string, status: EstimateStatus) => {
    setEstimates(prev => prev.map(e => e.id === id ? { ...e, status, updatedAt: Date.now() } : e));
  };

  const handleAddLineItem = (customItem?: Partial<LineItem>) => {
    if (!activeEstimate) return;
    const newItem: LineItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: customItem?.name || '',
      description: customItem?.description || '',
      qty: customItem?.qty || 1,
      rate: customItem?.rate || 0,
      amount: (customItem?.qty || 1) * (customItem?.rate || 0)
    };
    const newItems = [...activeEstimate.lineItems, newItem];
    handleUpdateEstimate({ lineItems: newItems });
  };

  const handleImportExtractedItems = (estimateId: string, items: Partial<LineItem>[]) => {
    setEstimates(prev => prev.map(est => {
      if (est.id === estimateId) {
        const newItems = [...est.lineItems, ...items.map(item => ({
          id: Math.random().toString(36).substr(2, 9),
          name: item.name || 'Extracted Item',
          description: item.description || '',
          qty: item.qty || 1,
          rate: item.rate || 0,
          amount: (item.qty || 1) * (item.rate || 0)
        }))];
        const merged = { ...est, lineItems: newItems, updatedAt: Date.now() };
        merged.total = calculateGrandTotal(merged);
        return merged;
      }
      return est;
    }));
    setSelectedEstId(estimateId);
    resetAISidebars();
    setView('builder');
  };

  const handleRunAI = async () => {
    if (!activeEstimate) return;
    setIsAiLoading(true);
    resetAISidebars();
    try {
      const insight = await analyzeEstimate(activeEstimate);
      setAiInsight(insight);
    } catch (e) {
      alert("AI Audit failed. Please try again.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleFetchSuggestions = async () => {
    if (!activeEstimate) return;
    setIsSuggestionsLoading(true);
    resetAISidebars();
    try {
      const items = await getMaterialSuggestions(activeEstimate);
      setSuggestions(items);
    } catch (e) {
      alert("Failed to get suggestions.");
    } finally {
      setIsSuggestionsLoading(false);
    }
  };

  const handleMarketIntelligence = async () => {
    if (!activeEstimate) return;
    setIsMarketLoading(true);
    resetAISidebars();
    try {
      const data = await fetchMarketIntelligence(activeEstimate);
      setMarketInsight(data);
    } catch (e) {
      alert("Market search failed. Please verify location.");
    } finally {
      setIsMarketLoading(false);
    }
  };

  const SidebarContent = (
    <nav className="space-y-8">
      <div className="space-y-1">
        <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-3 mb-2 block">Enterprise Suite</label>
        <NavBtn icon="fa-chart-simple" label="Dashboard" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
        <NavBtn icon="fa-columns" label="Pipeline" active={view === 'kanban'} onClick={() => setView('kanban')} />
        <NavBtn icon="fa-file-signature" label="Proposals" active={view === 'estimates'} onClick={() => setView('estimates')} />
        <NavBtn icon="fa-comments-dollar" label="Sales Specialist" active={view === 'assistant'} onClick={() => setView('assistant')} />
        <NavBtn icon="fa-camera" label="AI Scan" active={view === 'docscan'} onClick={() => setView('docscan')} />
        <NavBtn icon="fa-clipboard-list" label="Site Reporter" active={view === 'reporter'} onClick={() => setView('reporter')} />
        <NavBtn icon="fa-address-book" label="Clients" active={view === 'customers'} onClick={() => setView('customers')} />
      </div>

      <div className="pt-6 border-t border-slate-800">
        <button 
          onClick={handleCreateEstimate}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-indigo-500/20 active:scale-95 group"
        >
          <i className="fas fa-plus group-hover:rotate-90 transition-transform"></i>
          New Bid
        </button>
      </div>
    </nav>
  );

  return (
    <AppLayout sidebar={SidebarContent}>
      {view === 'dashboard' && <DashboardStats estimates={estimates} customers={MOCK_CUSTOMERS} />}

      {view === 'kanban' && (
        <KanbanBoard 
          estimates={estimates} 
          customers={MOCK_CUSTOMERS} 
          onSelectEstimate={(id) => { setSelectedEstId(id); setView('builder'); resetAISidebars(); }}
          onUpdateStatus={handleUpdateStatus}
        />
      )}

      {view === 'docscan' && (
        <DocumentScanner 
          estimates={estimates}
          onImport={handleImportExtractedItems}
        />
      )}

      {view === 'reporter' && (
        <SiteReporter />
      )}

      {view === 'assistant' && (
        <SalesAssistant 
          estimates={estimates}
          customers={MOCK_CUSTOMERS}
        />
      )}

      {view === 'estimates' && (
        <div className="p-8 animate-fade-in overflow-y-auto h-full custom-scrollbar">
          <header className="flex justify-between items-end mb-10">
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight uppercase italic">Proposals</h1>
              <p className="text-slate-500 font-medium mt-1">Review and manage active project bids.</p>
            </div>
          </header>
          
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-sm shadow-2xl">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-800/40 border-b border-slate-800">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Project</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Client</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Value</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {estimates.map(est => (
                  <tr key={est.id} className="hover:bg-indigo-500/5 transition-colors group cursor-pointer" onClick={() => { setSelectedEstId(est.id); setView('builder'); resetAISidebars(); }}>
                    <td className="px-8 py-6">
                      <div className="font-bold text-white group-hover:text-indigo-400 transition-colors">{est.name}</div>
                      <div className="text-[10px] text-slate-500 font-black uppercase tracking-tight mt-1">{est.location}</div>
                    </td>
                    <td className="px-8 py-6 text-sm text-slate-400">{MOCK_CUSTOMERS.find(c => c.id === est.customerId)?.name}</td>
                    <td className="px-8 py-6"><StatusBadge status={est.status} /></td>
                    <td className="px-8 py-6 text-right font-mono font-bold text-indigo-400 tabular-nums">${est.total.toLocaleString()}</td>
                    <td className="px-8 py-6 text-center">
                      <button className="w-8 h-8 rounded-full bg-slate-800 text-slate-500 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center"><i className="fas fa-chevron-right text-xs"></i></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === 'customers' && (
        <div className="p-8 animate-fade-in overflow-y-auto h-full custom-scrollbar">
           <header className="mb-10">
            <h1 className="text-3xl font-black text-white tracking-tight uppercase italic">Clients</h1>
            <p className="text-slate-500 font-medium mt-1">Manage relationships with owners, developers, and contractors.</p>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {MOCK_CUSTOMERS.map(cust => (
              <div key={cust.id} className="bg-slate-900/50 border border-slate-800 rounded-[40px] p-8 backdrop-blur-sm hover:border-indigo-500/50 transition-all group shadow-xl">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner border border-slate-700">
                    <i className="fas fa-building text-2xl"></i>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${cust.type === 'GC' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}>
                    {cust.type}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">{cust.name}</h3>
                <div className="space-y-3 mt-6">
                  <div className="flex items-center gap-3 text-slate-500 text-xs font-medium">
                    <i className="fas fa-phone w-4 text-center text-slate-700"></i>
                    <span>{cust.phone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500 text-xs font-medium">
                    <i className="fas fa-envelope w-4 text-center text-slate-700"></i>
                    <span>{cust.email || 'N/A'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'builder' && activeEstimate && (
        <div className="h-full flex flex-col animate-fade-in overflow-hidden">
          <div className="flex-none bg-slate-900 border-b border-slate-800 px-8 py-5 flex items-center justify-between shadow-lg z-10">
            <div className="flex items-center gap-6">
              <button onClick={() => { setView('estimates'); resetAISidebars(); }} className="w-10 h-10 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-all flex items-center justify-center border border-slate-700">
                <i className="fas fa-arrow-left"></i>
              </button>
              <div>
                <input 
                  type="text" 
                  value={activeEstimate.name}
                  onChange={(e) => handleUpdateEstimate({ name: e.target.value })}
                  className="bg-transparent text-2xl font-black text-white outline-none focus:text-indigo-400 transition-colors w-[400px] italic"
                />
              </div>
            </div>
            <div className="flex gap-4">
               <button 
                 onClick={handleMarketIntelligence}
                 disabled={isMarketLoading}
                 className="bg-amber-600/10 text-amber-400 border border-amber-500/30 px-6 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-amber-600/20 transition-all active:scale-95 disabled:opacity-30 shadow-lg"
               >
                 {isMarketLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-globe"></i>}
                 Market Intel
               </button>
               <button 
                 onClick={handleFetchSuggestions}
                 disabled={isSuggestionsLoading}
                 className="bg-emerald-600/10 text-emerald-400 border border-emerald-500/30 px-6 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-emerald-600/20 transition-all active:scale-95 disabled:opacity-30 shadow-lg"
               >
                 {isSuggestionsLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-wand-sparkles"></i>}
                 Scope advisor
               </button>
               <button 
                 onClick={handleRunAI}
                 disabled={isAiLoading || activeEstimate.lineItems.length === 0}
                 className="bg-indigo-600/10 text-indigo-400 border border-indigo-500/30 px-6 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-indigo-600/20 transition-all active:scale-95 disabled:opacity-30 shadow-lg"
               >
                 {isAiLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-microchip"></i>}
                 Audit
               </button>
               <button 
                onClick={() => { setView('estimates'); resetAISidebars(); }}
                className="bg-indigo-600 text-white px-8 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
               >
                 Finish
               </button>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar bg-slate-950/50">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Customer</label>
                    <select 
                      className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-slate-200 text-sm outline-none focus:border-indigo-500 transition-colors"
                      value={activeEstimate.customerId}
                      onChange={(e) => handleUpdateEstimate({ customerId: e.target.value })}
                    >
                      {MOCK_CUSTOMERS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                 </div>
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Market Location</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-slate-200 text-sm outline-none focus:border-indigo-500"
                      value={activeEstimate.location}
                      onChange={(e) => handleUpdateEstimate({ location: e.target.value })}
                    />
                 </div>
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Status</label>
                    <select 
                      className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-slate-200 text-sm outline-none focus:border-indigo-500"
                      value={activeEstimate.status}
                      onChange={(e) => handleUpdateEstimate({ status: e.target.value as EstimateStatus })}
                    >
                      <option value="Draft">Draft</option>
                      <option value="Submitted">Submitted</option>
                      <option value="Won">Won</option>
                      <option value="Lost">Lost</option>
                    </select>
                 </div>
               </div>

               <div className="space-y-6">
                 <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-3 uppercase italic">
                      <i className="fas fa-list-check text-indigo-500 text-sm not-italic"></i>
                      Bid Details
                    </h3>
                    <button onClick={() => handleAddLineItem()} className="bg-slate-800 hover:bg-slate-700 text-indigo-400 text-[10px] font-black py-2 px-5 rounded-full uppercase tracking-widest border border-slate-700 transition-all">
                      <i className="fas fa-plus mr-2"></i> Append Item
                    </button>
                 </div>
                 <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-sm shadow-xl">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-800/40 border-b border-slate-800">
                          <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Scope</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest w-28">Qty</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest w-44">Rate</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest w-44 text-right">Ext. Total</th>
                          <th className="px-8 py-5 w-16"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {activeEstimate.lineItems.map((item, idx) => (
                          <tr key={item.id} className="group hover:bg-white/5 transition-colors">
                            <td className="px-8 py-5">
                              <input className="bg-transparent text-white font-bold text-sm outline-none w-full" value={item.name} onChange={(e) => {
                                const newItems = [...activeEstimate.lineItems];
                                newItems[idx].name = e.target.value;
                                handleUpdateEstimate({ lineItems: newItems });
                              }} />
                              <input className="bg-transparent text-slate-500 text-[10px] font-bold outline-none w-full mt-1 uppercase" value={item.description} onChange={(e) => {
                                const newItems = [...activeEstimate.lineItems];
                                newItems[idx].description = e.target.value;
                                handleUpdateEstimate({ lineItems: newItems });
                              }} />
                            </td>
                            <td className="px-8 py-5">
                              <input type="number" className="bg-slate-800/50 px-3 py-1.5 rounded-lg outline-none w-full font-mono text-xs border border-slate-700 focus:border-indigo-500 tabular-nums" value={item.qty} onChange={(e) => {
                                const val = Number(e.target.value);
                                const newItems = [...activeEstimate.lineItems];
                                newItems[idx].qty = val;
                                newItems[idx].amount = val * newItems[idx].rate;
                                handleUpdateEstimate({ lineItems: newItems });
                              }} />
                            </td>
                            <td className="px-8 py-5">
                              <input type="number" className="bg-slate-800/50 px-3 py-1.5 rounded-lg outline-none w-full font-mono text-xs border border-slate-700 focus:border-indigo-500 tabular-nums" value={item.rate} onChange={(e) => {
                                const val = Number(e.target.value);
                                const newItems = [...activeEstimate.lineItems];
                                newItems[idx].rate = val;
                                newItems[idx].amount = val * newItems[idx].qty;
                                handleUpdateEstimate({ lineItems: newItems });
                              }} />
                            </td>
                            <td className="px-8 py-5 text-right font-mono font-black text-indigo-400 tabular-nums">${item.amount.toLocaleString()}</td>
                            <td className="px-8 py-5 text-center">
                              <button onClick={() => {
                                const newItems = activeEstimate.lineItems.filter(l => l.id !== item.id);
                                handleUpdateEstimate({ lineItems: newItems });
                              }} className="w-8 h-8 rounded-full bg-slate-800 hover:bg-red-500/10 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center border border-slate-700"><i className="fas fa-trash-alt text-[10px]"></i></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                 </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-slate-900 border border-slate-800 rounded-[40px] p-10 space-y-6 shadow-xl">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pricing Strategy</h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Profit Margin (%)</label>
                        <input 
                          type="number"
                          className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-indigo-400 font-mono outline-none focus:border-indigo-500 tabular-nums"
                          value={activeEstimate.margin || 0}
                          onChange={(e) => handleUpdateEstimate({ margin: Number(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Sales Tax (%)</label>
                        <input 
                          type="number"
                          className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-400 font-mono outline-none focus:border-indigo-500 tabular-nums"
                          value={activeEstimate.tax || 0}
                          onChange={(e) => handleUpdateEstimate({ tax: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-end p-12 bg-indigo-600/10 border border-indigo-500/20 rounded-[40px] shadow-2xl items-baseline gap-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-[100px] pointer-events-none"></div>
                    <div className="w-full space-y-2 relative z-10">
                       <div className="flex justify-between items-center text-slate-500 text-[10px] font-black uppercase tracking-widest">
                         <span>Subtotal</span>
                         <span className="tabular-nums font-mono">${calculateSubtotal(activeEstimate.lineItems).toLocaleString()}</span>
                       </div>
                       <div className="flex justify-between items-center text-slate-500 text-[10px] font-black uppercase tracking-widest">
                         <span>Tax & Margin</span>
                         <span className="tabular-nums font-mono">+ ${(activeEstimate.total - calculateSubtotal(activeEstimate.lineItems)).toLocaleString()}</span>
                       </div>
                       <div className="pt-4 border-t border-slate-800/50 flex justify-between items-baseline">
                         <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest italic">Grand Total</p>
                         <span className="text-7xl font-black text-white font-mono tracking-tighter tabular-nums leading-none">
                            ${activeEstimate.total.toLocaleString()}
                         </span>
                       </div>
                    </div>
                  </div>
               </div>
            </div>

            {/* AI Sidebars Integrated Directly */}
            {aiInsight && (
              <div className="w-[450px] bg-slate-950 border-l border-slate-800 p-10 overflow-y-auto animate-in slide-in-from-right z-20 custom-scrollbar shadow-2xl">
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]"><i className="fas fa-bolt-lightning"></i></div>
                    <div>
                      <h3 className="text-xs font-black text-white uppercase tracking-widest">Bid Auditor</h3>
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-tight">AI Risk Mapping</p>
                    </div>
                  </div>
                  <button onClick={() => setAiInsight(null)} className="w-8 h-8 rounded-full hover:bg-slate-800 text-slate-600 hover:text-white transition-all"><i className="fas fa-times"></i></button>
                </div>
                <div className="space-y-10">
                  <div className="bg-slate-900/50 border border-indigo-500/20 rounded-[32px] p-10 text-center relative overflow-hidden shadow-inner">
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-4">Confidence Score</p>
                    <div className="text-7xl font-black text-indigo-400 tracking-tighter tabular-nums">{aiInsight.score}%</div>
                  </div>
                  <div className="space-y-4">
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest px-1">Executive Summary</p>
                    <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-inner">
                      <p className="text-sm text-slate-300 leading-relaxed italic font-medium">"{aiInsight.summary}"</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <p className="text-[10px] text-red-500 uppercase font-black tracking-widest px-1">Detected Risks</p>
                    {aiInsight.risks.map((risk, i) => (
                      <div key={i} className="flex gap-4 text-xs text-slate-300 bg-red-500/5 border border-red-500/10 p-5 rounded-2xl shadow-sm">
                        <i className="fas fa-triangle-exclamation text-red-500 mt-0.5"></i>
                        <span className="leading-relaxed font-medium">{risk}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {suggestions && (
              <div className="w-[450px] bg-slate-950 border-l border-slate-800 p-10 overflow-y-auto animate-in slide-in-from-right z-20 custom-scrollbar shadow-2xl">
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]"><i className="fas fa-wand-sparkles"></i></div>
                    <div>
                      <h3 className="text-xs font-black text-white uppercase tracking-widest">Scope Advisor</h3>
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-tight">Scope Extensions</p>
                    </div>
                  </div>
                  <button onClick={() => setSuggestions(null)} className="w-8 h-8 rounded-full hover:bg-slate-800 text-slate-600 hover:text-white transition-all"><i className="fas fa-times"></i></button>
                </div>
                
                <div className="space-y-6">
                  {suggestions.map((item, i) => (
                    <div key={i} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl hover:border-emerald-500/30 transition-all group shadow-xl">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="text-sm font-black text-white group-hover:text-emerald-400 transition-colors uppercase italic">{item.name}</h4>
                        <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded-full border border-emerald-500/10 tabular-nums">${item.suggestedRate.toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed mb-4 font-medium">{item.description}</p>
                      <button 
                        onClick={() => {
                          handleAddLineItem({ 
                            name: item.name, 
                            description: item.description, 
                            qty: item.suggestedQty, 
                            rate: item.suggestedRate 
                          });
                          setSuggestions(suggestions.filter((_, idx) => idx !== i));
                        }}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-600/10 active:scale-95 flex items-center justify-center gap-2"
                      >
                        <i className="fas fa-plus"></i>
                        Add to Bid
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {marketInsight && (
              <div className="w-[450px] bg-slate-950 border-l border-slate-800 p-10 overflow-y-auto animate-in slide-in-from-right z-20 custom-scrollbar shadow-2xl">
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]"><i className="fas fa-earth-americas"></i></div>
                    <div>
                      <h3 className="text-xs font-black text-white uppercase tracking-widest">Market Intel</h3>
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-tight">Grounded Live Search</p>
                    </div>
                  </div>
                  <button onClick={() => setMarketInsight(null)} className="w-8 h-8 rounded-full hover:bg-slate-800 text-slate-600 hover:text-white transition-all"><i className="fas fa-times"></i></button>
                </div>
                
                <div className="space-y-8">
                  <div className="text-slate-300 leading-relaxed bg-slate-900 border border-slate-800 p-6 rounded-[32px] shadow-inner text-xs font-medium">
                    {marketInsight.text}
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Sources</h4>
                    <div className="space-y-3">
                      {marketInsight.sources.map((src, i) => (
                        <a 
                          key={i} 
                          href={src.uri} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-amber-500/50 transition-all group"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <i className="fas fa-link text-slate-700 group-hover:text-amber-500 text-[10px]"></i>
                            <span className="text-[10px] font-black text-slate-500 group-hover:text-white truncate uppercase tracking-tight">{src.title}</span>
                          </div>
                          <i className="fas fa-external-link-alt text-[9px] text-slate-700"></i>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
};

const NavBtn = ({ icon, label, active, onClick }: { icon: string, label: string, active?: boolean, onClick: () => void }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group ${active ? 'bg-indigo-600/10 text-indigo-400 font-black border border-indigo-500/20 shadow-lg shadow-indigo-500/5' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}>
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${active ? 'bg-indigo-600 text-white' : 'bg-slate-800 group-hover:bg-slate-700 border border-slate-700'}`}><i className={`fas ${icon} text-xs`}></i></div>
    <span className="text-[11px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

const StatusBadge = ({ status }: { status: EstimateStatus }) => {
  const styles = {
    Draft: 'bg-slate-800 text-slate-500 border-slate-700',
    Submitted: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    Won: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Lost: 'bg-red-500/10 text-red-400 border-red-500/20',
  };
  return <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${styles[status]}`}>{status}</span>;
};

export default App;
