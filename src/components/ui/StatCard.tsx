import React from 'react';
import { GradientText } from './GradientText';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  gradient: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  gradient,
  trend
}) => {
  return (
    <div className="glass-panel p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">{label}</p>
          <p className="mt-2 text-3xl font-semibold">
            <GradientText>{value}</GradientText>
          </p>
          {trend && (
            <p className={`text-sm mt-1 ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {trend.isPositive ? '↑' : '↓'} {trend.value}%
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-gradient-to-br ${gradient} bg-opacity-10`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
};