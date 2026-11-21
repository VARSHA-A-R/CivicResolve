import React from 'react';
import type { ComplaintStatus, ComplaintTimelineEvent } from '../../types';
import {
  CheckCircle2,
  Clock,
  Bot,
  User,
  ShieldCheck,
  HardHat,
} from 'lucide-react';

interface StatusTimelineProps {
  currentStatus: ComplaintStatus;
  events: ComplaintTimelineEvent[];
}

export const StatusTimeline: React.FC<StatusTimelineProps> = ({ currentStatus, events }) => {
  // Stepper milestones
  const steps: Array<{ key: ComplaintStatus; label: string; desc: string }> = [
    { key: 'reported', label: 'Reported', desc: 'Logged & AI Triaged' },
    { key: 'in_progress', label: 'In Progress', desc: 'Assigned to Ward Engineer' },
    { key: 'resolved', label: 'Resolved', desc: 'Work Verified & Closed' },
  ];

  const getStepIndex = (status: ComplaintStatus): number => {
    switch (status) {
      case 'reported':
        return 0;
      case 'in_progress':
        return 1;
      case 'resolved':
        return 2;
      case 'rejected':
        return 0;
    }
  };

  const currentStepIndex = getStepIndex(currentStatus);

  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const getActorIcon = (role: ComplaintTimelineEvent['actorRole']) => {
    switch (role) {
      case 'ai_system':
        return <Bot className="w-4 h-4 text-teal-600" />;
      case 'officer':
        return <ShieldCheck className="w-4 h-4 text-blue-600" />;
      case 'field_worker':
        return <HardHat className="w-4 h-4 text-amber-600" />;
      case 'citizen':
      default:
        return <User className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Visual Stepper */}
      <div className="bg-white p-5 rounded-xl border border-slate-200">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
          Lifecycle Progression
        </h4>

        <div className="relative flex items-center justify-between">
          {/* Background Track Line */}
          <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-slate-200 -z-0" />
          {/* Active Track Line */}
          <div
            className="absolute left-6 top-1/2 -translate-y-1/2 h-1 bg-teal-600 transition-all duration-500 -z-0"
            style={{
              width:
                currentStepIndex === 0
                  ? '0%'
                  : currentStepIndex === 1
                  ? '50%'
                  : 'calc(100% - 3rem)',
            }}
          />

          {steps.map((step, idx) => {
            const isCompleted = idx < currentStepIndex || (idx === currentStepIndex && currentStatus === 'resolved');
            const isCurrent = idx === currentStepIndex && currentStatus !== 'resolved';

            return (
              <div key={step.key} className="relative z-10 flex flex-col items-center group text-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all shadow-sm ${
                    isCompleted
                      ? 'bg-teal-600 text-white'
                      : isCurrent
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                      : 'bg-white border-2 border-slate-300 text-slate-400'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : isCurrent ? (
                    <Clock className="w-5 h-5 animate-spin" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>
                <div className="mt-2.5">
                  <div
                    className={`text-xs font-bold ${
                      isCompleted || isCurrent ? 'text-slate-900' : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </div>
                  <div className="text-[11px] text-slate-500 hidden sm:block max-w-[120px]">
                    {step.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Chronological Event Audit Log */}
      <div className="bg-white p-5 rounded-xl border border-slate-200">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
          Status History & Public Progress Updates
        </h4>

        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {events.map((evt, idx) => (
            <div key={evt.id || idx} className="relative group">
              {/* Dot Icon */}
              <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center shadow-xs">
                {getActorIcon(evt.actorRole)}
              </div>

              {/* Event Content */}
              <div className="bg-slate-50/70 p-3.5 rounded-lg border border-slate-200/70">
                <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                  <span className="text-sm font-semibold text-slate-900">{evt.statusLabel}</span>
                  <span className="text-xs text-slate-500 font-mono">
                    {formatTimestamp(evt.timestamp)}
                  </span>
                </div>
                <div className="text-xs text-slate-600 font-medium mb-1.5 flex items-center gap-1.5">
                  <span>Actor:</span>
                  <span className="font-semibold text-slate-800">{evt.actor}</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-700">
                    {evt.actorRole}
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed bg-white p-2.5 rounded border border-slate-100">
                  {evt.note}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
