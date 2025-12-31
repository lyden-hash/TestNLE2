
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Estimate, Customer } from '../types';

export const PipelineDistribution: React.FC<{ estimates: Estimate[]; customers: Customer[] }> = ({ estimates }) => {
  const data = [
    { name: 'Draft', value: estimates.filter(e => e.status === 'Draft').length, color: '#64748b' },
    { name: 'Submitted', value: estimates.filter(e => e.status === 'Submitted').length, color: '#3b82f6' },
    { name: 'Won', value: estimates.filter(e => e.status === 'Won').length, color: '#10b981' },
    { name: 'Lost', value: estimates.filter(e => e.status === 'Lost').length, color: '#ef4444' },
  ].filter(d => d.value > 0);

  return (
    <div className="h-64 flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            innerRadius={60}
            outerRadius={90}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
            itemStyle={{ color: '#f8fafc', fontSize: '12px' }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-col gap-2 ml-4">
        {data.map((entry, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const CustomerPipeline: React.FC<{ estimates: Estimate[]; customers: Customer[] }> = ({ estimates, customers }) => {
  const customerTotals = customers.map(c => ({
    name: c.name,
    total: estimates.filter(e => e.customerId === c.id).reduce((acc, curr) => acc + curr.total, 0)
  })).sort((a, b) => b.total - a.total).slice(0, 5);

  return (
    <div className="h-56 mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={customerTotals} layout="vertical" margin={{ left: 20, right: 20 }}>
          <XAxis type="number" hide />
          <YAxis 
            dataKey="name" 
            type="category" 
            stroke="#64748b" 
            fontSize={10} 
            width={100} 
            axisLine={false} 
            tickLine={false} 
          />
          <Tooltip 
             formatter={(value: number) => `$${value.toLocaleString()}`}
             contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
             itemStyle={{ color: '#f8fafc', fontSize: '12px' }}
             cursor={{ fill: 'rgba(255,255,255,0.05)' }}
          />
          <Bar dataKey="total" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
