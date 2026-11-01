import React from 'react';
import { Card } from './Card';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  colorScheme?: 'orange' | 'navy' | 'turquoise' | 'red' | 'emerald';
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendUp,
  colorScheme = 'orange',
}: StatCardProps) {
  const colors = {
    orange: 'bg-amber-50 text-brand-orange border-amber-100',
    navy: 'bg-slate-100 text-brand-navy border-slate-200',
    turquoise: 'bg-cyan-50 text-brand-turquoise border-cyan-100',
    red: 'bg-rose-50 text-rose-600 border-rose-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  };

  return (
    <Card className="p-5 flex items-start justify-between relative overflow-hidden group hover:border-gray-200 transition-all duration-200">
      <div className="space-y-1.5 z-10">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-brand-navy tracking-tight">{value}</span>
          {trend && (
            <span className={`text-xs font-semibold ${trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
              {trendUp ? '↑' : '↓'} {trend}
            </span>
          )}
        </div>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>

      <div className={`p-3 rounded-2xl border ${colors[colorScheme]} transition-transform duration-200 group-hover:scale-105`}>
        {icon}
      </div>
    </Card>
  );
}
