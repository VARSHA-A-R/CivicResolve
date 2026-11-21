import React from 'react';
import type { ComplaintStatus, ComplaintPriority, ComplaintCategory } from '../../types';
import {
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Flame,
  AlertTriangle,
  Info,
} from 'lucide-react';

export const StatusBadge: React.FC<{ status: ComplaintStatus; size?: 'sm' | 'md' }> = ({
  status,
  size = 'md',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs font-semibold';

  switch (status) {
    case 'reported':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 shadow-xs ${sizeClasses}`}
        >
          <Clock className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5 text-amber-600'} />
          <span>Reported</span>
        </span>
      );
    case 'in_progress':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200/80 shadow-xs ${sizeClasses}`}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
          </span>
          <span>In Progress</span>
        </span>
      );
    case 'resolved':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-xs ${sizeClasses}`}
        >
          <CheckCircle2 className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5 text-emerald-600'} />
          <span>Resolved</span>
        </span>
      );
    case 'rejected':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300 shadow-xs ${sizeClasses}`}
        >
          <XCircle className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5 text-slate-500'} />
          <span>Closed / Ineligible</span>
        </span>
      );
  }
};

export const PriorityBadge: React.FC<{ priority: ComplaintPriority; size?: 'sm' | 'md' }> = ({
  priority,
  size = 'md',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  switch (priority) {
    case 'critical':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-md bg-rose-50 text-rose-800 border border-rose-200 font-bold ${sizeClasses}`}
        >
          <Flame className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
          <span>CRITICAL</span>
        </span>
      );
    case 'high':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-md bg-orange-50 text-orange-800 border border-orange-200 ${sizeClasses}`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
          <span>High Priority</span>
        </span>
      );
    case 'medium':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 ${sizeClasses}`}
        >
          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
          <span>Medium</span>
        </span>
      );
    case 'low':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses}`}
        >
          <Info className="w-3.5 h-3.5 text-slate-500" />
          <span>Low Priority</span>
        </span>
      );
  }
};

export const CategoryBadge: React.FC<{ category: ComplaintCategory }> = ({ category }) => {
  const config: Record<ComplaintCategory, { label: string; color: string }> = {
    roads: { label: 'Roads & Pavements', color: 'bg-zinc-100 text-zinc-800 border-zinc-200' },
    garbage: { label: 'Waste Management', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    streetlights: { label: 'Streetlights', color: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
    water: { label: 'Water Supply', color: 'bg-cyan-50 text-cyan-800 border-cyan-200' },
    drainage: { label: 'Storm Drainage', color: 'bg-blue-50 text-blue-800 border-blue-200' },
    encroachment: { label: 'Encroachment', color: 'bg-purple-50 text-purple-800 border-purple-200' },
    other: { label: 'Municipal General', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  };

  const item = config[category] || config.other;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${item.color}`}
    >
      {item.label}
    </span>
  );
};
