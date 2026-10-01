import React from 'react';
import { RotateCcw, CheckCircle2, X } from 'lucide-react';
import { InterruptedSessionState } from '../hooks/useTimer';

export interface SessionRecoveryBannerProps {
  recovery: InterruptedSessionState;
  onResume: () => void;
  onEnd: () => void;
  onDismiss: () => void;
}

export const SessionRecoveryBanner: React.FC<SessionRecoveryBannerProps> = ({
  recovery,
  onResume,
  onEnd,
  onDismiss,
}) => {
  const { session, elapsedSeconds, remainingSeconds, isElapsedPastPlanned } = recovery;

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  const remainingMinutes = Math.ceil(remainingSeconds / 60);
  const plannedMinutes = Math.round(session.plannedDuration / 60);

  return (
    <aside
      id="tempo-session-recovery-banner"
      aria-label="Active session recovery"
      className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[#2B3E66]/60 bg-[#0C121E] px-4 py-3 shadow-md transition-all duration-200"
    >
      <div className="flex items-start sm:items-center gap-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#2B3E66] bg-[#141E33] text-[#60A5FA]">
          <RotateCcw className="h-3.5 w-3.5" />
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#93C5FD]">
              Session Interrupted
            </span>
            {isElapsedPastPlanned && (
              <span className="rounded bg-[#172554] px-1.5 py-0.2 font-mono text-[9px] text-[#BFDBFE]">
                Elapsed in background
              </span>
            )}
          </div>
          <p className="text-xs text-[#E2E8F0] truncate font-medium">
            {session.subject || 'Focus Session'}
            <span className="font-mono text-[11px] font-normal text-[#94A3B8] ml-2">
              {elapsedMinutes}m recorded of {plannedMinutes}m
              {!isElapsedPastPlanned && ` (${remainingMinutes}m remaining)`}
            </span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        <button
          id="recovery-btn-resume"
          type="button"
          onClick={onResume}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#3B82F6]/60 bg-[#1D4ED8]/30 px-3 py-1.5 text-xs font-medium text-[#DBEAFE] hover:bg-[#1D4ED8]/50 hover:text-white transition-colors"
          title="Resume this session from where it was interrupted"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Resume</span>
        </button>

        <button
          id="recovery-btn-end"
          type="button"
          onClick={onEnd}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#202024] bg-[#111113] px-3 py-1.5 text-xs font-medium text-[#8A8A90] hover:border-[#2E2E35] hover:text-[#F5F5F7] transition-colors"
          title="End session now and record elapsed focus time in history"
        >
          <CheckCircle2 className="h-3 w-3" />
          <span>End Session</span>
        </button>

        <button
          id="recovery-btn-dismiss"
          type="button"
          onClick={onDismiss}
          className="inline-flex items-center justify-center rounded-lg p-1.5 text-[#5F6066] hover:text-[#F5F5F7] transition-colors"
          title="Dismiss interrupted session snapshot without saving"
          aria-label="Dismiss interrupted session"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </aside>
  );
};
