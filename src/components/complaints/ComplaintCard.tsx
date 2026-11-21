import React from 'react';
import { Link } from 'react-router-dom';
import type { Complaint } from '../../types';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../ui/Badge';
import { MapPin, Calendar, ArrowRight } from 'lucide-react';

export const ComplaintCard: React.FC<{ complaint: Complaint }> = ({ complaint }) => {
  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-civic-card hover:shadow-civic-hover hover:border-slate-300 transition-all duration-200 flex flex-col justify-between overflow-hidden group">
      <div>
        {/* Optional Image Banner or Placeholder Accent */}
        {complaint.imageUrl ? (
          <div className="h-44 w-full relative overflow-hidden bg-slate-100">
            <img
              src={complaint.imageUrl}
              alt={complaint.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
              <StatusBadge status={complaint.status} size="sm" />
              {complaint.isDemo && (
                <span className="text-[10px] font-bold text-slate-700 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded shadow-xs border border-slate-200">
                  Demo
                </span>
              )}
            </div>
            <div className="absolute top-3 right-3">
              <PriorityBadge priority={complaint.priority} size="sm" />
            </div>
          </div>
        ) : (
          <div className="p-4 pb-0 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <StatusBadge status={complaint.status} size="sm" />
              {complaint.isDemo && (
                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  Demo
                </span>
              )}
            </div>
            <PriorityBadge priority={complaint.priority} size="sm" />
          </div>
        )}

        <div className="p-5">
          {/* Metadata Row */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              {complaint.id}
            </span>
            <span className="flex items-center gap-1 text-[11px]">
              <Calendar className="w-3 h-3 text-slate-400" />
              {formatDate(complaint.createdAt)}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-bold text-base text-slate-900 group-hover:text-teal-700 transition-colors line-clamp-2 mb-2">
            {complaint.title}
          </h3>

          {/* Description Snippet */}
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
            {complaint.description}
          </p>

          {/* Location Badge */}
          <div className="flex items-start gap-1.5 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mb-3">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span className="truncate">{complaint.location.address}</span>
          </div>

          {/* Category & Department */}
          <div className="flex items-center justify-between text-xs pt-1">
            <CategoryBadge category={complaint.category} />
            <span className="text-[11px] font-medium text-slate-500 truncate max-w-[130px]">
              {complaint.department}
            </span>
          </div>
        </div>
      </div>

      {/* Footer with Track Link */}
      <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs text-slate-500">Live status updates</span>
        <Link
          to={`/track?id=${complaint.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800 group/link"
        >
          <span>Track Live</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
};
