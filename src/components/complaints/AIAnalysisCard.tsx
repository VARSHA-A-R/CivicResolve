import React from 'react';
import type { AIAnalysisResult } from '../../types';
import { PriorityBadge } from '../ui/Badge';
import {
  Sparkles,
  ShieldAlert,
  Building,
  Clock,
  CheckCircle,
  Cpu,
  Layers,
  Wrench,
} from 'lucide-react';

interface AIAnalysisCardProps {
  analysis: AIAnalysisResult;
  isPreview?: boolean;
}

export const AIAnalysisCard: React.FC<AIAnalysisCardProps> = ({
  analysis,
  isPreview = false,
}) => {
  const isGeminiLive = analysis.source === 'firebase-gemini-3.8-flash';

  // Urgency score color
  const getUrgencyColor = (score: number) => {
    if (score >= 8) return 'text-rose-600 bg-rose-50 border-rose-200';
    if (score >= 6) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (score >= 4) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-teal-600 bg-teal-50 border-teal-200';
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-xl p-5 shadow-lg border border-slate-800">
      {/* Header with AI Attribution badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              <span>AI Assessment · Decision Support</span>
              {isPreview && (
                <span className="text-[10px] font-semibold uppercase bg-teal-900/80 text-teal-300 px-2 py-0.5 rounded border border-teal-700">
                  Real-time Preview
                </span>
              )}
            </h4>
            <p className="text-xs text-slate-400">
              Automated classification, hazard evaluation, and departmental routing
            </p>
          </div>
        </div>

        {/* Source attribution tag */}
        <div className="flex items-center gap-1.5 text-xs">
          {isGeminiLive ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-teal-950 border border-teal-600/80 text-teal-300 text-[11px] font-medium shadow-xs">
              <Cpu className="w-3 h-3 text-teal-400" />
              <span>Gemini AI (Firebase AI Logic)</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-amber-300 text-[11px] font-medium">
              <Layers className="w-3 h-3 text-amber-400" />
              <span>Offline Heuristic Engine</span>
            </span>
          )}
        </div>
      </div>

      {/* Grid of Key AI Attributes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-b border-slate-800">
        {/* Category */}
        <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
            Detected Domain
          </span>
          <span className="text-sm font-semibold text-white block truncate">
            {analysis.categoryLabel}
          </span>
        </div>

        {/* Priority */}
        <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
            Assessed Priority
          </span>
          <PriorityBadge priority={analysis.priority} size="sm" />
        </div>

        {/* Urgency Score */}
        <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
            Urgency Rating
          </span>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-base font-extrabold px-2 py-0.5 rounded border text-xs ${getUrgencyColor(
                analysis.urgencyScore
              )}`}
            >
              {analysis.urgencyScore} / 10
            </span>
          </div>
        </div>

        {/* Est. Resolution */}
        <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
            Resolution SLA
          </span>
          <span className="text-xs font-semibold text-slate-200 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>
              {analysis.estimatedResolutionDays
                ? `${analysis.estimatedResolutionDays} day${analysis.estimatedResolutionDays > 1 ? 's' : ''}`
                : analysis.estimatedResolutionTime}
            </span>
          </span>
        </div>
      </div>

      {/* Department Routing */}
      <div className="py-3.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Building className="w-4 h-4 text-teal-400 shrink-0" />
          <span className="text-xs text-slate-400">Assigned Department:</span>
          <span className="text-xs font-bold text-teal-300 bg-teal-950/60 px-2.5 py-1 rounded border border-teal-800/80">
            {analysis.recommendedDepartment}
          </span>
        </div>

        {analysis.safetyHazard && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-950/80 text-rose-300 border border-rose-800 text-xs font-semibold animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>Safety Hazard Flagged</span>
          </span>
        )}
      </div>

      {/* AI Assessment Reason & Remediation */}
      <div className="pt-3.5 space-y-3">
        <div>
          <span className="text-xs font-semibold text-slate-400 block mb-1">
            AI Triage Reason & Justification:
          </span>
          <p className="text-xs text-slate-200 leading-relaxed bg-slate-800/40 p-3 rounded-lg border border-slate-800">
            {analysis.reason || analysis.summary}
          </p>
        </div>

        {analysis.recommendedAction && (
          <div>
            <span className="text-xs font-semibold text-teal-300 flex items-center gap-1.5 mb-1">
              <Wrench className="w-3.5 h-3.5 text-teal-400" />
              <span>Recommended Engineering Action:</span>
            </span>
            <div className="text-xs text-slate-200 bg-teal-950/40 p-3 rounded-lg border border-teal-800/50">
              {analysis.recommendedAction}
            </div>
          </div>
        )}

        {/* Action Items for Field Engineers */}
        {analysis.keyActionItems && analysis.keyActionItems.length > 0 && (
          <div>
            <span className="text-xs font-semibold text-slate-400 block mb-1.5">
              Protocol Checklist:
            </span>
            <ul className="space-y-1.5">
              {analysis.keyActionItems.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-xs text-slate-300 bg-slate-800/30 p-2 rounded border border-slate-800/60"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
