import React, { useState, useRef, useEffect } from 'react';
import {
  Pause,
  Play,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';
import { FinishEarlyModal } from './FinishEarlyModal';
import { SessionCompleteModal } from './SessionCompleteModal';
import { TaskChangeConfirmModal } from './TaskChangeConfirmModal';
import { TaskSelectorPopover } from './TaskSelectorPopover';
import { TimerProgressBar } from './TimerProgressBar';
import { useTimer } from '../hooks/useTimer';
import { useTasks } from '../hooks/useTasks';

export interface TimerPanelProps {
  timer: ReturnType<typeof useTimer>;
  onEnterFocusMode?: () => void;
}

export const TimerPanel: React.FC<TimerPanelProps> = ({
  timer,
}) => {
  const [isTaskSelectorOpen, setIsTaskSelectorOpen] = useState(false);
  const { tasks } = useTasks();
  const taskTriggerRef = useRef<HTMLButtonElement>(null);

  const {
    mode,
    status,
    session,
    remainingSeconds,
    formattedTime,
    progress,
    pause,
    resume,
    finish,
    selectTask,
    isFinishEarlyModalOpen,
    confirmFinishEarly,
    cancelFinishEarly,
    completedSessionForModal,
    dismissCompletedModal,
    switchMode,
  } = timer;

  const isPaused = status === 'paused';
  const isCompleted = status === 'completed';
  const isFocusing = status === 'focus';

  // Focused minutes spent in active session for finish early confirmation
  const currentFocusedMinutes = Math.max(
    1,
    Math.round((session.plannedDuration - remainingSeconds) / 60)
  );

  // Active task display hierarchy: Subject on top (small uppercase tracked) & Title below (larger medium)
  const activeTask = tasks.find((t) => t.id === session.taskId);
  let taskSubject: string | null = null;
  let taskTitle: string = 'Choose a task to focus';

  if (activeTask) {
    taskSubject = activeTask.subject || 'TASK';
    if (activeTask.subject && activeTask.title.toLowerCase().startsWith(activeTask.subject.toLowerCase())) {
      taskTitle = activeTask.title.replace(new RegExp(`^${activeTask.subject}\\s*[-—:]*\\s*`, 'i'), '');
    } else {
      taskTitle = activeTask.title;
    }
  } else if (session.subject && session.subject !== 'Focus Session' && session.subject.trim() !== '') {
    if (session.subject.includes('—') || session.subject.includes('-')) {
      const parts = session.subject.split(/[-—]/);
      taskSubject = parts[0].trim();
      taskTitle = parts.slice(1).join('—').trim() || session.subject;
    } else {
      taskSubject = session.category || 'FOCUS';
      taskTitle = session.subject;
    }
  } else {
    taskSubject = 'FOCUS TARGET';
    taskTitle = 'Choose a task to focus';
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isTaskSelectorOpen) {
        setIsTaskSelectorOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTaskSelectorOpen]);

  return (
    <section
      id="tempo-focus-timer-panel"
      className="relative flex flex-col items-center justify-center w-full h-full min-h-0 bg-transparent py-1 sm:py-2 select-none"
    >
      {/* Central Instrument: STATUS -> (large breathing room) -> TIMER -> (moderate) -> PROGRESS -> (moderate) -> TASK -> (small) -> SESSION TYPE -> (larger) -> CONTROLS */}
      <div
        id="timer-instrument-stage"
        className="flex-1 min-h-0 flex flex-col items-center justify-center w-full my-auto py-2"
      >
        {/* 1. STATUS: Compact metadata system, small uppercase, tracked, medium weight */}
        <div id="timer-status-row" className="flex items-center gap-2 select-none shrink-0">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isCompleted
                ? 'bg-[#34D399]'
                : isPaused
                ? 'bg-[#71717A]'
                : mode === 'focus'
                ? 'bg-[#60A5FA]'
                : 'bg-[#A78BFA]'
            }`}
          />
          <span
            id="timer-status-indicator"
            className="font-mono text-[10px] sm:text-[11px] font-medium tracking-[0.25em] uppercase text-[#71717A]"
          >
            {isCompleted
              ? 'Completed'
              : isPaused
              ? 'Paused'
              : mode === 'focus'
              ? 'Focus'
              : mode === 'shortBreak'
              ? 'Short Break'
              : 'Long Break'}
          </span>
        </div>

        {/* 2. TYPOGRAPHIC TIMER */}
        <div className="relative flex items-center justify-center w-full select-none shrink-0 my-3 sm:my-4 md:my-6">
          <div
            id="timer-display"
            className="relative z-10 font-sans font-medium text-6xl sm:text-7xl md:text-8xl lg:text-9xl -tracking-[0.03em] tabular-nums text-[#EDEDEF] select-none leading-none text-center flex items-center justify-center"
          >
            <span>{formattedTime.split(':')[0]}</span>
            <span className="opacity-35 font-light mx-0.5 sm:mx-1 select-none">:</span>
            <span>{formattedTime.split(':')[1]}</span>
          </div>
        </div>

        {/* 3. Minimal Precision Progress Indicator: 2px monochrome continuous line */}
        <TimerProgressBar
          id="timer-progress-instrument"
          status={status}
          progress={progress}
          getExactProgress={timer.getExactProgress}
          className="w-44 sm:w-56 md:w-64 mt-1.5 sm:mt-2 mb-4 sm:mb-5 md:mb-6"
        />

        {/* 4. RESTRUCTURED CURRENT TASK: Subject/Category on top + Task Title below */}
        <div
          id="timer-task-section"
          className="relative flex flex-col items-center text-center px-4 max-w-xl shrink-0"
        >
          <button
            ref={taskTriggerRef}
            id="timer-select-task-btn"
            type="button"
            onClick={() => setIsTaskSelectorOpen(!isTaskSelectorOpen)}
            className="group flex flex-col items-center gap-1 px-4 py-1.5 rounded-lg hover:bg-[#16161B]/60 transition-all cursor-pointer select-none"
            title="Click to select or change focus task"
          >
            {taskSubject && (
              <span className="font-mono text-[10px] sm:text-[11px] font-medium tracking-[0.2em] uppercase text-[#71717A] group-hover:text-[#A1A1AA] transition-colors">
                {taskSubject}
              </span>
            )}
            <div className="flex items-center gap-1.5 max-w-sm sm:max-w-md md:max-w-lg">
              <span className="text-base sm:text-lg md:text-xl font-medium tracking-tight text-[#EDEDEF] group-hover:text-white transition-colors truncate">
                {taskTitle}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-[#52525A] group-hover:text-[#A1A1AA] transition-colors shrink-0" />
            </div>
          </button>

          {/* 5. SESSION TYPE: Small, tracked, restrained */}
          <span
            id="timer-category-tag"
            className="mt-1 font-mono text-[10px] sm:text-[11px] font-medium text-[#52525A] tracking-[0.25em] uppercase select-none"
          >
            {mode === 'focus' ? (session.tag || 'DEEP WORK') : 'RECHARGE'}
          </span>
        </div>

        {/* 6. CONTROLS: Tactile, comfortable 44px targets, medium typography */}
        <div
          id="timer-action-buttons"
          className="mt-6 sm:mt-8 flex w-full max-w-xs items-center justify-center gap-3 shrink-0"
        >
          {/* Primary Action: Pause / Resume / Start */}
          <button
            id="timer-btn-pause"
            type="button"
            onClick={isPaused || isCompleted ? resume : pause}
            className={`flex h-11 min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg border px-5 text-xs sm:text-sm font-medium tracking-wide transition-all active:scale-[0.98] ${
              isFocusing
                ? 'border-[#2E2E38] bg-[#16161C] hover:bg-[#1C1C23] hover:border-[#3E3E4C] text-[#F5F5F7]'
                : 'border-[#2A3448] bg-[#141A29] hover:bg-[#1B2338] hover:border-[#384766] text-[#93C5FD]'
            }`}
            aria-label={isPaused || isCompleted ? 'Resume timer' : 'Pause timer'}
          >
            {isPaused || isCompleted ? (
              <>
                <Play className="h-3.5 w-3.5 fill-current text-current" />
                <span>{isPaused && remainingSeconds === session.plannedDuration ? 'Start' : 'Resume'}</span>
              </>
            ) : (
              <>
                <Pause className="h-3.5 w-3.5 fill-current text-current" />
                <span>Pause</span>
              </>
            )}
          </button>

          {/* Secondary Action: Finish */}
          <button
            id="timer-btn-finish"
            type="button"
            onClick={finish}
            disabled={isCompleted}
            className={`flex h-11 min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg border px-5 text-xs sm:text-sm font-medium tracking-wide transition-all active:scale-[0.98] ${
              isCompleted
                ? 'bg-[#0E0E12] text-[#4A4A52] cursor-default border-[#16161A]'
                : 'border-[#202026] bg-[#0E0E12] hover:bg-[#15151A] text-[#A1A1AA] hover:text-[#F5F5F7] hover:border-[#2E2E38]'
            }`}
            aria-label="Finish focus session"
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-[#5F6066]" />
            <span>{isCompleted ? 'Completed' : 'Finish'}</span>
          </button>
        </div>
      </div>

      {/* Viewport-Aware Clamped Task Selector Popover */}
      <TaskSelectorPopover
        isOpen={isTaskSelectorOpen}
        onClose={() => setIsTaskSelectorOpen(false)}
        triggerRef={taskTriggerRef}
        tasks={tasks}
        selectedTaskId={session.taskId}
        onSelectTask={(task) => {
          selectTask(task);
        }}
      />

      {/* Task Change Confirmation Modal */}
      <TaskChangeConfirmModal
        isOpen={timer.isTaskChangeModalOpen}
        currentTaskTitle={timer.currentAttachedTaskTitle}
        newTaskTitle={timer.targetTaskTitle}
        onStartNewSession={timer.confirmTaskChangeStartNew}
        onKeepCurrentSession={timer.keepCurrentSession}
        onCancel={timer.cancelTaskChange}
      />

      {/* Modals preserved exactly */}
      <FinishEarlyModal
        isOpen={isFinishEarlyModalOpen}
        onContinue={cancelFinishEarly}
        onConfirmFinish={confirmFinishEarly}
        focusedMinutes={currentFocusedMinutes}
      />

      <SessionCompleteModal
        isOpen={Boolean(completedSessionForModal)}
        session={completedSessionForModal}
        onDone={() => {
          dismissCompletedModal();
          timer.reset();
        }}
        onStartBreak={() => {
          dismissCompletedModal();
          switchMode('shortBreak');
        }}
      />
    </section>
  );
};
