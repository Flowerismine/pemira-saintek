import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  trend?: string;
  trendUp?: boolean;
}

export default function StatCard({ title, value, icon, trend, trendUp }: StatCardProps) {
  return (
    <div className="glass-panel p-6 group hover:-translate-y-1 transition-all duration-300 hover:shadow-md border-transparent hover:border-primary-100">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-slate-500 font-medium mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-slate-900 group-hover:text-primary-600 transition-colors">{value}</h3>
        </div>
        <div className="p-3 bg-primary-50 rounded-xl text-primary-600 group-hover:bg-primary-600 group-hover:text-white group-hover:scale-110 transition-all duration-300 shadow-sm">
          {icon}
        </div>
      </div>
      
      {trend && (
        <div className="mt-4 flex items-center gap-2">
          <span className={`text-xs font-semibold px-2 py-1 rounded-md ${trendUp ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
            {trend}
          </span>
          <span className="text-xs text-slate-400">dari minggu lalu</span>
        </div>
      )}
    </div>
  );
}
