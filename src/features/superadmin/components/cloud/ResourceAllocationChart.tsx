import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface ResourceAllocationProps {
  data: Array<{
    name: string;
    value: number;
  }>;
}

export const ResourceAllocationChart: React.FC<ResourceAllocationProps> = ({ data }) => {
  const COLORS = ['#0077FF', '#7B00FF', '#FF00C5', '#FF1A8C'];

  return (
    <div className="glass-panel">
      <h2 className="text-xl font-display font-bold mb-6 bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
        Resource Allocation
      </h2>
      
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              fill="#8884d8"
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]}
                  className="hover:opacity-80 transition-opacity duration-300"
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-dark-200/90 backdrop-blur-sm border border-primary-500/20 rounded-lg p-3">
                      <p className="text-sm font-medium text-gray-300">
                        {payload[0].name}
                      </p>
                      <p className="text-sm text-primary-400">
                        {payload[0].value}%
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-6 grid grid-cols-2 gap-4">
        {data.map((item, index) => (
          <div key={item.name} className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="text-sm text-gray-400">{item.name}</span>
            <span className="text-sm text-gray-300 font-medium">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};