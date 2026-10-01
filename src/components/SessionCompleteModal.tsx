import React, { useMemo, useState, useEffect } from 'react';
import { CheckCircle2, Coffee, Check } from 'lucide-react';
import { FocusSession } from '../types';
import { getTaskById, updateTask } from '../utils/taskStorage';

interface SessionCompleteModalProps {
  session: FocusSession | null;
  isOpen: boolean;
  onDone: () => void;
  onStartBreak?: () => void;
}

export const SessionCompleteModal: React.FC<SessionCompleteModalProps> = ({
  session,
  isOpen,
  onDone,
  onStartBreak,
}) => {
  const linkedTask = useMemo(() => {
    if (!session?.taskId) return null;
    return getTaskById(session.taskId) || null;
  }, [session?.taskId, isOpen]);

  const [isTaskCompleted, setIsTaskCompleted] = useState<boolean>(false);

  useEffect(() => {
    if (linkedTask) {
      setIsTaskCompleted(linkedTask.status === 'completed' || linkedTask.completed === true);
    } else {
      setIsTaskCompleted(false);
    }
  }, [linkedTask]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDone();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onDone]);

  if (!isOpen || !session) return null;

  const isFocus = session.mode === 'focus';
  const focusedMinutes = Math.max(1, Math.round(session.actualDuration / 60));
  const isFinishedEarly = session.completionReason === 'finishedEarly';

  const handleMarkTaskCompleted = () => {
    if (!linkedTask) return;
    updateTask(linkedTask.id, {
      status: 'completed',
      completedAt: session.completedAt || Date.now(),
    });
    setIsTaskCompleted(true);
  };

  return (
    <div
      id="session-complete-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-complete-title"
    >
      <div
        id="session-complete-modal-content"
        className="w-full max-w-sm rounded-xl border border-[#202024] bg-[#0E0E11] p-6 sm:p-7 text-center shadow-2xl transition-all"
      >
        {/* Restrained subtle check icon */}
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-[#202024] bg-[#141417]">
          <CheckCircle2 className="h-5 w-5 text-[#8A8A90]" />
        </div>

        {/* Calm title */}
        <span
          id="session-complete-subtitle"
          className="mt-4 block font-mono text-[10px] font-semibold tracking-[0.25em] text-[#8A8A90] uppercase"
        >
          {isFocus
            ? isFinishedEarly
              ? 'SESSION CONCLUDED'
              : 'FOCUS SESSION COMPLETE'
            : 'BREAK COMPLETE'}
        </span>

        <h3
          id="session-complete-title"
          className="mt-2 text-base font-medium tracking-tight text-[#F5F5F7]"
        >
          {linkedTask ? linkedTask.title : session.subject}
        </h3>

        <div className="mt-2 flex items-center justify-center gap-2 text-xs text-[#5F6066]">
          <span className="font-mono text-[#8A8A90]">
            {focusedMinutes} {isFocus ? 'min focused' : 'min break'}
          </span>
          {isFinishedEarly && (
            <>
              <span>•</span>
              <span className="font-mono text-[11px] text-[#5F6066]">finished early</span>
            </>
          )}
        </div>

        {/* Optional Linked Task Completion Action */}
        {linkedTask && (
          <div className="mt-5 pt-4 border-t border-[#202024]/70">
            {isTaskCompleted ? (
              <div
                id="session-complete-task-status-done"
                className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-[#0F1C16] border border-[#164E3A] text-xs text-[#34D399] font-medium"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-[#34D399]" />
                <span>Task marked as completed</span>
              </div>
            ) : (
              <button
                id="session-complete-btn-complete-task"
                type="button"
                onClick={handleMarkTaskCompleted}
                className="w-full flex items-center justify-center gap-2 h-9 rounded-md border border-[#2B3E66] bg-[#121B2B] px-4 text-xs font-medium text-[#93C5FD] hover:bg-[#1A263D] hover:border-[#3B5488] transition-colors"
              >
                <Check className="h-3.5 w-3.5 text-[#93C5FD]" />
                <span>Mark Task as Completed</span>
              </button>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-5 flex items-center justify-center gap-2.5">
          <button
            id="session-complete-btn-done"
            type="button"
            onClick={onDone}
            className="flex-1 h-10 rounded-md border border-[#202024] bg-[#141417] px-4 text-xs font-medium text-[#F5F5F7] hover:bg-[#1A1A1E] hover:border-[#2E2E35] transition-colors"
          >
            Done
          </button>

          {isFocus && onStartBreak && (
            <button
              id="session-complete-btn-break"
              type="button"
              onClick={onStartBreak}
              className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-md border border-[#2E2E35] bg-[#1A1A1E] px-4 text-xs font-medium text-[#F5F5F7] hover:bg-[#222228] transition-colors"
            >
              <Coffee className="h-3.5 w-3.5 text-[#8A8A90]" />
              <span>Start break</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
