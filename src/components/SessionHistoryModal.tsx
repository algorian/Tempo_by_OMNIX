import React, { useState } from 'react';
import { X, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { FocusSession } from '../types';
import {
  getTodaySessions,
  getThisWeekSessions,
  getAllSessions,
} from '../utils/sessionStorage';

interface SessionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FilterTab = 'today' | 'week' | 'all';

export const SessionHistoryModal: React.FC<SessionHistoryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [tab, setTab] = useState<FilterTab>('today');

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sessions: FocusSession[] =
    tab === 'today'
      ? getTodaySessions()
      : tab === 'week'
      ? getThisWeekSessions()
      : getAllSessions();

  return (
    <div
      id="session-history-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-history-title"
    >
      <div
        id="session-history-modal-content"
        className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-xl border border-[#202024] bg-[#0E0E11] p-5 sm:p-6 shadow-2xl transition-all"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#202024]">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#8A8A90]" />
            <h3
              id="session-history-title"
              className="text-sm font-medium tracking-tight text-[#F5F5F7]"
            >
              Session History
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#5F6066] hover:text-[#F5F5F7] transition-colors"
            aria-label="Close history"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 pt-3 pb-3">
          {(['today', 'week', 'all'] as FilterTab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-3 py-1 text-xs rounded-md font-mono uppercase tracking-wider transition-colors ${
                tab === t
                  ? 'bg-[#202024] text-[#F5F5F7] font-medium'
                  : 'text-[#8A8A90] hover:text-[#F5F5F7] hover:bg-[#141417]'
              }`}
            >
              {t === 'today' ? "Today's" : t === 'week' ? "This Week" : 'All'}
            </button>
          ))}
          <span className="ml-auto font-mono text-xs text-[#5F6066]">
            {sessions.length} recorded
          </span>
        </div>

        {/* List of Sessions */}
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 mt-1">
          {sessions.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#5F6066]">
              No sessions recorded for this period.
            </div>
          ) : (
            sessions.map((s) => {
              const minutes = Math.round(s.actualDuration / 60);
              const isFinishedEarly = s.completionReason === 'finishedEarly';
              const isFocus = s.mode === 'focus';
              const dateStr = new Date(s.startedAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-lg border border-[#202024]/60 bg-[#121215] p-3 text-xs"
                >
                  <div className="flex items-start gap-2.5">
                    {isFinishedEarly ? (
                      <AlertCircle className="h-3.5 w-3.5 mt-0.5 text-[#8A8A90] shrink-0" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-[#60A5FA] shrink-0" />
                    )}
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[#F5F5F7]">{s.subject}</span>
                        <span className="font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.2 rounded border border-[#202024] text-[#8A8A90] bg-[#17171B]">
                          {s.tag}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-[#5F6066]">
                        <span>{dateStr}</span>
                        <span>•</span>
                        <span>{s.category}</span>
                        {s.pausedDuration > 0 && (
                          <>
                            <span>•</span>
                            <span>{Math.round(s.pausedDuration)}s paused</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-0.5 pl-3 shrink-0">
                    <span className="font-mono font-medium text-[#F5F5F7]">
                      {minutes}m
                    </span>
                    <span className="font-mono text-[10px] text-[#5F6066]">
                      {isFinishedEarly ? 'early finish' : 'completed'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-[#202024] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-8 rounded-md border border-[#202024] bg-[#141417] px-4 text-xs text-[#8A8A90] hover:text-[#F5F5F7] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
