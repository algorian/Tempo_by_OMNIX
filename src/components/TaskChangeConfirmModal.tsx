import React, { useEffect, useRef } from 'react';
import { AlertCircle, Play, ArrowRight, X } from 'lucide-react';

interface TaskChangeConfirmModalProps {
  isOpen: boolean;
  currentTaskTitle: string;
  newTaskTitle: string;
  onStartNewSession: () => void;
  onKeepCurrentSession: () => void;
  onCancel: () => void;
}

export const TaskChangeConfirmModal: React.FC<TaskChangeConfirmModalProps> = ({
  isOpen,
  currentTaskTitle,
  newTaskTitle,
  onStartNewSession,
  onKeepCurrentSession,
  onCancel,
}) => {
  const primaryButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Focus primary button on open
    primaryButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      id="task-change-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-change-title"
      aria-describedby="task-change-desc"
    >
      <div
        id="task-change-modal-content"
        className="w-full max-w-sm rounded-xl border border-[#202024] bg-[#0E0E11] p-6 text-left shadow-2xl transition-all"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#202024]">
          <div className="flex items-center gap-2 text-[#F5F5F7]">
            <AlertCircle className="h-4 w-4 text-[#8A8A90]" />
            <h3 id="task-change-title" className="text-sm font-medium tracking-tight">
              Change focused task?
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-[#5F6066] hover:text-[#F5F5F7] transition-colors p-1"
            aria-label="Cancel task switch"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Description & Context */}
        <div id="task-change-desc" className="mt-4 flex flex-col gap-3 text-xs leading-relaxed">
          <p className="text-[#8A8A90]">
            The current focus session is attached to:
          </p>
          <div className="rounded-lg border border-[#202024] bg-[#141417] px-3.5 py-2.5 font-medium text-[#F5F5F7] truncate">
            {currentTaskTitle || 'Current Session'}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-[#5F6066]">
            <span>Switch to</span>
            <ArrowRight className="h-3 w-3 text-[#5F6066]" />
            <span className="text-[#8A8A90] font-medium truncate">{newTaskTitle}</span>
          </div>

          <p className="text-[11px] text-[#5F6066]">
            Starting a new session will save your elapsed focus time on the current task and begin a fresh session.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col gap-2">
          {/* Primary Action */}
          <button
            ref={primaryButtonRef}
            id="task-change-btn-start-new"
            type="button"
            onClick={onStartNewSession}
            className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-[#2E2E35] bg-[#F5F5F7] px-4 text-xs font-medium text-[#050505] hover:bg-white transition-colors"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>Start New Session</span>
          </button>

          {/* Secondary Action */}
          <button
            id="task-change-btn-keep-current"
            type="button"
            onClick={onKeepCurrentSession}
            className="flex h-9 w-full items-center justify-center rounded-lg border border-[#202024] bg-[#141417] px-4 text-xs font-medium text-[#8A8A90] hover:text-[#F5F5F7] hover:border-[#2E2E35] transition-colors"
          >
            Keep Current Session
          </button>

          {/* Cancel */}
          <button
            id="task-change-btn-cancel"
            type="button"
            onClick={onCancel}
            className="mt-1 text-center text-[11px] text-[#5F6066] hover:text-[#8A8A90] transition-colors py-1"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
