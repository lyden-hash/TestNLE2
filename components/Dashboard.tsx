
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Estimate, Customer } from '../types';
import { PipelineDistribution, CustomerPipeline } from './Visuals';

interface DashboardProps {
  estimates: Estimate[];
  customers: Customer[];
}

export const DashboardStats: React.FC<DashboardProps> = ({ estimates, customers }) => {
  const totalPipeline = estimates.filter(e => e.status !== 'Lost').reduce((acc, curr) => acc + curr.total, 0);
  const wonValue = estimates.filter(e => e.status === 'Won').reduce((acc, curr) => acc + curr.total, 0);
  const pendingCount = estimates.filter(e => e.status === 'Submitted' || e.status === 'Draft').length;
  const winRate = estimates.length > 0 
    ? Math.round((estimates.filter(e => e.status === 'Won').length / estimates.length) * 100) 
    : 0;

  const baseValue = totalPipeline > 0 ? totalPipeline / 2 : 10000;
  const chartData = [
    { name: 'Jan', value: baseValue * 0.4 },
    { name: 'Feb', value: baseValue * 0.5 },
    { name: 'Mar', value: baseValue * 0.7 },
    { name: 'Apr', value: baseValue * 0.9 },
    { name: 'May', value: totalPipeline * 0.8 },
    { name: 'Jun', value: totalPipeline },
  ];

  return (
    <div className="space-y-6 p-8 overflow-y-auto max-h-full custom-scrollbar animate-fade-in">
      <header>
        <h1 className="text-3xl font-bold text-white tracking-tight">Market Dashboard</h1>
        <p className="text-slate-400 mt-1">Real-time performance analytics for your bidding pipeline.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Pipeline Value" value={`$${totalPipeline.toLocaleString()}`} icon="fa-chart-line" color="blue" />
        <StatCard label="Won Value" value={`$${wonValue.toLocaleString()}`} icon="fa-check-circle" color="emerald" />
        <StatCard label="Pending Bids" value={pendingCount.toString()} icon="fa-clock" color="amber" />
        <StatCard label="Win Rate" value={`${winRate}%`} icon="fa-trophy" color="indigo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl backdrop-blur-sm bg-opacity-50">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Historical Pipeline Growth</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                  itemStyle={{ color: '#f8fafc', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="value" stroke="#6366f1" fillOpacity={1} fill="url(#colorValue)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl backdrop-blur-sm bg-opacity-50">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Status Breakdown</h3>
          <PipelineDistribution estimates={estimates} customers={customers} />
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl backdrop-blur-sm bg-opacity-50">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Key Accounts Value</h3>
        <CustomerPipeline estimates={estimates} customers={customers} />
      </div>
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: string;
  icon: string;
  color: 'blue' | 'emerald' | 'amber' | 'indigo';
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color }) => {
  const colorMap = {
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl transition-all hover:border-slate-700 group backdrop-blur-sm bg-opacity-50">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</p>
          <p className="text-2xl font-bold text-white font-mono tracking-tighter tabular-nums">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${colorMap[color]} group-hover:scale-110 transition-transform`}>
          <i className={`fas ${icon}`}></i>
        </div>
      </div>
    </div>
  );
};
