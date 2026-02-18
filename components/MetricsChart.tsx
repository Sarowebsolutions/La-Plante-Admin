import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Metric } from '../types.ts';

interface MetricsChartProps {
  data: Metric[];
}

const MetricsChart: React.FC<MetricsChartProps> = ({ data }) => {
  return (
    <div className="h-60 w-full animate-fade-in">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#59A541" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#59A541" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{fontSize: 9, fill: '#94a3b8', fontWeight: 700}} 
            dy={10}
            tickFormatter={(val) => {
              const d = new Date(val);
              return `${d.getMonth()+1}/${d.getDate()}`;
            }}
          />
          <YAxis 
            hide 
            domain={['dataMin - 2', 'dataMax + 2']} 
          />
          <Tooltip 
            cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }}
            contentStyle={{
              borderRadius: '16px', 
              border: 'none', 
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
              padding: '10px',
              fontSize: '11px',
              fontWeight: 'bold'
            }}
            labelStyle={{ color: '#64748b', marginBottom: '4px' }}
          />
          <Line 
            type="monotone" 
            dataKey="weight" 
            stroke="#59A541" 
            strokeWidth={3} 
            dot={{r: 4, fill: '#59A541', strokeWidth: 2, stroke: '#fff'}} 
            activeDot={{r: 6, fill: '#59A541', strokeWidth: 3, stroke: '#f0fdf4'}} 
            animationDuration={1500}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MetricsChart;