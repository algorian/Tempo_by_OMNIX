import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Play, Pause, CheckCircle2, Minimize2, Maximize2, ChevronDown } from 'lucide-react';
import { AtmosphericBackground } from './AtmosphericBackground';
import { TimerProgressBar } from './TimerProgressBar';
import { FinishEarlyModal } from './FinishEarlyModal';
import { SessionCompleteModal } from './SessionCompleteModal';
import { TaskChangeConfirmModal } from './TaskChangeConfirmModal';
import { TaskSelectorPopover } from './TaskSelectorPopover';
import { useTimer } from '../hooks/useTimer';
import { useQuote } from '../hooks/useQuote';
import { useTasks } from '../hooks/useTasks';
import { getTaskById } from '../utils/taskStorage';
import { getSettings } from '../utils/settingsStorage';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface FocusModeViewProps {
  timer: ReturnType<typeof useTimer>;
  onExit: () => void;
}

export const FocusModeView: React.FC<FocusModeViewProps> = ({ timer, onExit }) => {
  const { quote, author } = useQuote();
  const { tasks } = useTasks();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTaskSelectorOpen, setIsTaskSelectorOpen] = useState(false);
  const taskTriggerRef = useRef<HTMLButtonElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Environment context: greeting and formatted date
  const [now] = useState(() => new Date());
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning.' : hour < 17 ? 'Good afternoon.' : 'Good evening.';
  const formattedDate = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(now).toUpperCase();
  }, [now]);

  // Check auto-fullscreen setting on mount
  useEffect(() => {
    const settings = getSettings();
    if (settings.focusModeFullscreen && !document.fullscreenElement) {
      try {
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      } catch {
        // Ignore fullscreen error
      }
    }
  }, []);

  // Monitor browser fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Toggle browser fullscreen safely without blocking if unavailable
  const handleToggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      }
    } catch {
      // Gracefully ignore Fullscreen API errors
    }
  };

  // Resolve clean active task hierarchy (Subject on top, Title below)
  const { taskSubject, taskTitle } = useMemo(() => {
    if (timer.session.taskId) {
      const task = getTaskById(timer.session.taskId);
      if (task) {
        const subject = task.subject || 'TASK';
        let title = task.title;
        if (task.subject && task.title.toLowerCase().startsWith(task.subject.toLowerCase())) {
          title = task.title.replace(new RegExp(`^${task.subject}\\s*[-—:]*\\s*`, 'i'), '');
        }
        return { taskSubject: subject, taskTitle: title };
      }
    }
    if (timer.session.subject && timer.session.subject.trim() && timer.session.subject !== 'Focus Session') {
      if (timer.session.subject.includes('—') || timer.session.subject.includes('-')) {
        const parts = timer.session.subject.split(/[-—]/);
        return { taskSubject: parts[0].trim(), taskTitle: parts.slice(1).join('—').trim() };
      }
      return { taskSubject: timer.session.category || 'FOCUS', taskTitle: timer.session.subject };
    }
    return { taskSubject: 'FOCUS TARGET', taskTitle: 'Focus Session' };
  }, [timer.session.taskId, timer.session.subject, timer.session.category]);

  // Handle Keyboard Shortcuts:
  // Space: Pause / Resume
  // Escape: Exit Focus Mode (Never finishes session)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If modal is active, let modal handle Escape/keys
      if (timer.isFinishEarlyModalOpen || timer.completedSessionForModal) {
        return;
      }

      // Ignore input elements if any
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        onExit();
      } else if (e.code === 'Space') {
        e.preventDefault();
        if (timer.status === 'paused' || timer.status === 'completed') {
          timer.resume();
        } else {
          timer.pause();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [timer, onExit]);

  const isPaused = timer.status === 'paused';
  const isCompleted = timer.status === 'completed';
  const isFocusing = timer.status === 'focus';

  return (
    <div
      id="tempo-focus-mode-screen"
      className={`h-[100dvh] max-h-[100dvh] w-screen fixed inset-0 z-50 flex flex-col justify-between items-center bg-[#050505] text-[#F5F5F7] select-none overflow-hidden ${
        prefersReducedMotion ? '' : 'transition-opacity duration-500 ease-out'
      }`}
      role="region"
      aria-label="Distraction-free Focus Mode"
    >
      {/* Dynamic atmospheric background tuned for focus sanctuary */}
      <AtmosphericBackground status={timer.status} isFocusMode={true} />

      {/* Top Header Bar: Restrained Context (TEMPO + greeting + date) + Quiet Controls */}
      <header
        id="focus-mode-header"
        className="relative z-10 w-full max-w-4xl lg:max-w-5xl flex items-center justify-between px-4 sm:px-8 lg:px-10 shrink-0 h-14 sm:h-16"
      >
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span
              id="focus-mode-brand"
              className="font-mono text-[11px] font-medium tracking-[0.25em] text-[#71717A] uppercase select-none"
            >
              TEMPO
            </span>
            <span
              id="focus-mode-status-indicator"
              className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
                isFocusing
                  ? 'bg-[#60A5FA]'
                  : isPaused
                  ? 'bg-[#71717A]'
                  : isCompleted
                  ? 'bg-[#34D399]'
                  : 'bg-[#5F6066]'
              }`}
              title={timer.status}
            />
          </div>

          <div className="flex flex-col">
            <span className="text-xs sm:text-sm font-medium tracking-tight text-[#D4D4D8]">
              {greeting}
            </span>
            <span className="text-[9px] sm:text-[9.5px] font-mono font-medium tracking-[0.2em] text-[#5A5A62] uppercase select-none">
              {formattedDate}
            </span>
          </div>
        </div>

        {/* Secondary quiet utilities: Fullscreen toggle & Exit Focus Mode */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <button
            id="focus-mode-fullscreen-btn"
            type="button"
            onClick={handleToggleFullscreen}
            className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-md border border-[#1A1A22] bg-[#0A0A0E] text-[#606068] transition-all hover:border-[#282832] hover:text-[#EDEDEF] hover:bg-[#121216]"
            title={isFullscreen ? 'Exit browser fullscreen' : 'Enter browser fullscreen'}
            aria-label={isFullscreen ? 'Exit browser fullscreen' : 'Enter browser fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </button>

          <button
            id="focus-mode-exit-btn"
            type="button"
            onClick={onExit}
            className="group flex h-7 sm:h-8 items-center gap-1.5 rounded-md border border-[#1A1A22] bg-[#0A0A0E] px-2.5 text-xs font-mono font-medium text-[#71717A] transition-all hover:border-[#282832] hover:text-[#EDEDEF] hover:bg-[#121216]"
            title="Leave Focus Mode (session continues in dashboard)"
            aria-label="Exit Focus Mode"
          >
            <span>Exit Focus</span>
            <kbd className="hidden sm:inline rounded bg-[#141418] px-1 py-0.5 text-[9px] text-[#4E4E56] group-hover:text-[#71717A]">
              Esc
            </kbd>
          </button>
        </div>
      </header>

      {/* Main Focus Stage: Optically centered available canvas between Top and Bottom Environments */}
      <main
        id="focus-mode-main-stage"
        className="relative z-10 flex-1 min-h-0 w-full max-w-4xl lg:max-w-5xl flex flex-col items-center justify-center px-4 py-1 select-none"
      >
        <div
          id="focus-mode-instrument"
          className="relative flex flex-col items-center justify-center text-center w-full"
        >
          {/* 1. Status: Small, quiet, tracked label with subtle dot */}
          <div id="focus-mode-status" className="flex items-center justify-center gap-2 mb-6 sm:mb-8 md:mb-10 select-none shrink-0">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isFocusing
                  ? 'bg-[#60A5FA]'
                  : isPaused
                  ? 'bg-[#71717A]'
                  : isCompleted
                  ? 'bg-[#34D399]'
                  : 'bg-[#5F6066]'
              }`}
            />
            <span className="font-mono text-[9px] sm:text-[10px] font-medium tracking-[0.3em] uppercase text-[#64646D]">
              {isFocusing
                ? 'Focusing'
                : isPaused
                ? 'Paused'
                : isCompleted
                ? 'Completed'
                : timer.status}
            </span>
          </div>

          {/* 2. Central Typographic Timer */}
          <div className="relative flex items-center justify-center w-full select-none shrink-0 my-1 sm:my-2">
            {/* Monumental, optically centered timer with quieter colon separator */}
            <div
              id="focus-mode-timer-display"
              className="relative z-10 font-sans font-medium text-7xl sm:text-8xl md:text-9xl lg:text-[9.5rem] xl:text-[10.5rem] -tracking-[0.03em] tabular-nums text-[#EDEDEF] select-none leading-none text-center flex items-center justify-center"
            >
              <span>{timer.formattedTime.split(':')[0]}</span>
              <span className="opacity-35 font-light mx-0.5 sm:mx-1 select-none">:</span>
              <span>{timer.formattedTime.split(':')[1]}</span>
            </div>
          </div>

          {/* 3. Minimal Precision Progress Indicator: 2px monochrome continuous line */}
          <TimerProgressBar
            id="focus-mode-progress-instrument"
            status={timer.status}
            progress={timer.progress}
            getExactProgress={timer.getExactProgress}
            className="w-48 sm:w-60 md:w-72 mt-5 sm:mt-6 md:mt-7 mb-4 sm:mb-5 mx-auto"
          />

          {/* 4. Task Name & Session Category: Subordinate to timer, clear & readable */}
          <div
            id="focus-mode-task-name-container"
            className="relative flex flex-col items-center text-center px-4 max-w-xl shrink-0"
          >
            <button
              ref={taskTriggerRef}
              id="focus-mode-task-btn"
              type="button"
              onClick={() => setIsTaskSelectorOpen(!isTaskSelectorOpen)}
              className="group flex flex-col items-center gap-1 px-3 py-1 rounded-lg hover:bg-[#141418]/60 transition-all cursor-pointer select-none"
              title="Click to select or change focus task"
            >
              {taskSubject && (
                <span className="font-mono text-[9px] sm:text-[10px] font-medium tracking-[0.22em] uppercase text-[#5A5A64] group-hover:text-[#8E8E96] transition-colors">
                  {taskSubject}
                </span>
              )}
              <div className="flex items-center gap-1.5 max-w-sm sm:max-w-md md:max-w-lg">
                <span className="text-base sm:text-lg md:text-xl font-medium tracking-tight text-[#D4D4D8] group-hover:text-[#F4F4F5] transition-colors truncate">
                  {taskTitle}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-[#4A4A52] group-hover:text-[#8E8E96] transition-colors shrink-0" />
              </div>
            </button>

            <span
              id="focus-mode-category-tag"
              className="mt-0.5 font-mono text-[9px] sm:text-[10px] font-medium text-[#44444D] tracking-[0.25em] uppercase select-none"
            >
              {timer.session.tag || timer.session.category || 'Deep Work'}
            </span>
          </div>

          {/* 5. Essential Controls: Restrained precision instruments, balanced breathing room */}
          <div
            id="focus-mode-controls"
            className="mt-7 sm:mt-9 md:mt-10 flex w-full max-w-[280px] sm:max-w-xs items-center justify-center gap-3 shrink-0 mx-auto"
          >
            {/* Pause / Resume Button */}
            <button
              id="focus-mode-btn-pause"
              type="button"
              onClick={isPaused || isCompleted ? timer.resume : timer.pause}
              className={`flex h-10 min-h-[40px] flex-1 items-center justify-center gap-2 rounded-lg border px-4 text-xs font-medium tracking-wide transition-all active:scale-[0.98] ${
                isFocusing
                  ? 'border-[#262630] bg-[#121216] hover:bg-[#18181E] hover:border-[#343440] text-[#E4E4E7]'
                  : 'border-[#222E42] bg-[#101624] hover:bg-[#161F32] hover:border-[#30405C] text-[#93C5FD]'
              }`}
              aria-label={isPaused ? 'Resume focus session' : 'Pause focus session'}
            >
              {isPaused || isCompleted ? (
                <>
                  <Play className="h-3.5 w-3.5 fill-current text-current" />
                  <span>Resume</span>
                </>
              ) : (
                <>
                  <Pause className="h-3.5 w-3.5 fill-current text-current" />
                  <span>Pause</span>
                </>
              )}
            </button>

            {/* Finish Button */}
            <button
              id="focus-mode-btn-finish"
              type="button"
              onClick={timer.finish}
              disabled={isCompleted}
              className={`flex h-10 min-h-[40px] flex-1 items-center justify-center gap-2 rounded-lg border px-4 text-xs font-medium tracking-wide transition-all active:scale-[0.98] ${
                isCompleted
                  ? 'bg-[#0B0B0E] text-[#3E3E44] cursor-default border-[#141418]'
                  : 'border-[#1C1C22] bg-[#0C0C10] hover:bg-[#121216] text-[#8E8E96] hover:text-[#E4E4E7] hover:border-[#282832]'
              }`}
              aria-label="Finish focus session"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-[#52525A]" />
              <span>{isCompleted ? 'Completed' : 'Finish'}</span>
            </button>
          </div>

          {/* 6. Keyboard shortcut hint */}
          <div
            id="focus-mode-keyboard-hints"
            className="mt-2.5 flex items-center justify-center gap-2 text-[9px] font-mono font-medium text-[#3E3E48] tracking-widest shrink-0 select-none mx-auto"
          >
            <span>Space: Pause</span>
            <span>•</span>
            <span>Esc: Exit</span>
          </div>
        </div>
      </main>

      {/* Bottom Environment: In-flow footer matched in height with Top Environment, quote never shifts center */}
      <footer
        id="focus-mode-quote-container"
        className="relative z-10 w-full max-w-4xl lg:max-w-5xl flex items-center justify-center sm:justify-end px-4 sm:px-8 lg:px-10 shrink-0 h-14 sm:h-16 select-none"
      >
        <div className="max-w-sm sm:max-w-md text-center sm:text-right">
          <blockquote
            id="focus-mode-quote"
            className="text-xs sm:text-[13px] font-normal text-[#8A8A92] leading-relaxed italic"
          >
            "{quote.text}"
          </blockquote>
          <span
            id="focus-mode-quote-author"
            className="block mt-0.5 font-mono text-[9px] font-medium text-[#5A5A62] tracking-[0.2em] uppercase"
          >
            — {author}
          </span>
        </div>
      </footer>

      {/* Viewport-Aware Clamped Task Selector Popover */}
      <TaskSelectorPopover
        isOpen={isTaskSelectorOpen}
        onClose={() => setIsTaskSelectorOpen(false)}
        triggerRef={taskTriggerRef}
        tasks={tasks}
        selectedTaskId={timer.session.taskId}
        onSelectTask={(task) => {
          timer.selectTask(task);
        }}
      />

      {/* Reuse exact existing confirmation & completion modals */}
      <FinishEarlyModal
        isOpen={timer.isFinishEarlyModalOpen}
        onContinue={timer.cancelFinishEarly}
        onConfirmFinish={timer.confirmFinishEarly}
        focusedMinutes={Math.max(
          1,
          Math.round((timer.session.plannedDuration - timer.remainingSeconds) / 60)
        )}
      />

      <SessionCompleteModal
        isOpen={Boolean(timer.completedSessionForModal)}
        session={timer.completedSessionForModal}
        onDone={() => {
          timer.dismissCompletedModal();
          timer.reset();
          onExit();
        }}
        onStartBreak={() => {
          timer.dismissCompletedModal();
          timer.switchMode('shortBreak');
          onExit();
        }}
      />

      <TaskChangeConfirmModal
        isOpen={timer.isTaskChangeModalOpen}
        currentTaskTitle={timer.currentAttachedTaskTitle}
        newTaskTitle={timer.targetTaskTitle}
        onStartNewSession={timer.confirmTaskChangeStartNew}
        onKeepCurrentSession={timer.keepCurrentSession}
        onCancel={timer.cancelTaskChange}
      />
    </div>
  );
};
