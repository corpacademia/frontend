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
    <div className="glass-panel p-4 sm:p-6 group hover:scale-[1.02] transition-all duration-300">
      <div className="flex items-start sm:items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm text-gray-300 font-medium leading-snug">{label}</p>
          <p className="mt-1.5 sm:mt-2 text-2xl sm:text-3xl font-bold truncate">
            <GradientText glow={true} animated={true}>{value}</GradientText>
          </p>
          {trend && (
            <p className={`text-xs sm:text-sm mt-1 sm:mt-2 font-medium flex items-center gap-1 ${trend.isPositive ? 'text-green-400' : 'text-red-400'
              }`}>
              <span className={trend.isPositive ? 'animate-bounce-x' : ''}>
                {trend.isPositive ? '↑' : '↓'}
              </span>
              {trend.value}%
            </p>
          )}
        </div>
        <div className={`p-2.5 sm:p-4 rounded-xl bg-gradient-to-br ${gradient}
          shadow-lg group-hover:shadow-xl transition-all duration-300
          group-hover:scale-110 relative flex-shrink-0`}>
          <div className="absolute inset-0 bg-white/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <Icon className="h-5 w-5 sm:h-7 sm:w-7 text-white relative z-10" />
        </div>
      </div>
    </div>
  );
};