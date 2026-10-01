import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Check, FolderKanban, Clock } from 'lucide-react';
import { Task } from '../types';

export interface TaskSelectorPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  tasks: Task[];
  selectedTaskId: string | null | undefined;
  onSelectTask: (task: Task | null) => void;
  allowIndependent?: boolean;
}

export const TaskSelectorPopover: React.FC<TaskSelectorPopoverProps> = ({
  isOpen,
  onClose,
  triggerRef,
  tasks,
  selectedTaskId,
  onSelectTask,
  allowIndependent = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [position, setPosition] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    width: number;
    maxHeight: number;
  }>({ left: 16, width: 340, maxHeight: 320 });

  // Compute viewport-safe fixed position
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Determine width based on viewport
    const width = Math.min(360, Math.max(280, vw - 32));
    const margin = 16;

    // Horizontal centering relative to trigger, strictly clamped inside viewport
    const targetLeft = triggerRect.left + triggerRect.width / 2 - width / 2;
    const left = Math.max(margin, Math.min(targetLeft, vw - width - margin));

    // Vertical placement: evaluate space above vs below
    const spaceBelow = vh - triggerRect.bottom - margin;
    const spaceAbove = triggerRect.top - margin;
    const targetMaxHeight = 360;

    if (spaceBelow < 220 && spaceAbove > spaceBelow) {
      // Open upward
      const maxHeight = Math.min(targetMaxHeight, Math.max(160, spaceAbove - 8));
      setPosition({
        bottom: vh - triggerRect.top + 8,
        left,
        width,
        maxHeight,
      });
    } else {
      // Open downward
      const maxHeight = Math.min(targetMaxHeight, Math.max(160, spaceBelow - 8));
      setPosition({
        top: triggerRect.bottom + 8,
        left,
        width,
        maxHeight,
      });
    }
  }, [triggerRef]);

  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition();
    }
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      return;
    }

    // Auto-focus search input when opened
    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);

    const handleResizeOrScroll = () => {
      updatePosition();
    };

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;
      if (!target) return;

      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('resize', handleResizeOrScroll, { passive: true });
    window.addEventListener('scroll', handleResizeOrScroll, { passive: true, capture: true });
    document.addEventListener('pointerdown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResizeOrScroll);
      window.removeEventListener('scroll', handleResizeOrScroll, { capture: true });
      document.removeEventListener('pointerdown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, triggerRef, updatePosition]);

  if (!isOpen) return null;

  // Filter tasks based on query
  const query = searchQuery.trim().toLowerCase();
  const availableTasks = tasks.filter((t) => t.status !== 'archived');
  const filteredTasks = query
    ? availableTasks.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          (t.subject && t.subject.toLowerCase().includes(query)) ||
          (t.description && t.description.toLowerCase().includes(query))
      )
    : availableTasks;

  return createPortal(
    <div
      ref={popoverRef}
      id="tempo-task-selector-popover"
      role="dialog"
      aria-label="Select Focus Task"
      className="fixed z-[100] flex flex-col rounded-xl border border-[#26262E] bg-[#0E0E12]/98 backdrop-blur-xl p-3 shadow-[0_20px_50px_rgba(0,0,0,0.85)] text-xs select-none transition-all duration-150 animate-in fade-in-0 zoom-in-95"
      style={{
        left: `${position.left}px`,
        width: `${position.width}px`,
        top: position.top !== undefined ? `${position.top}px` : undefined,
        bottom: position.bottom !== undefined ? `${position.bottom}px` : undefined,
        maxHeight: `${position.maxHeight}px`,
      }}
    >
      {/* Header with Title & Close button */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1E1E24] shrink-0">
        <span className="font-mono text-[10px] uppercase tracking-wider text-[#8A8A90]">
          Select Focus Task
        </span>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-[#5F6066] hover:bg-[#1A1A20] hover:text-[#F5F5F7] transition-colors"
          aria-label="Close task selector"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Filter / Search input */}
      <div className="relative mb-2 shrink-0">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#5F6066]" />
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter tasks..."
          className="w-full rounded-lg border border-[#202026] bg-[#141418] pl-8 pr-7 py-1.5 text-xs text-[#F5F5F7] placeholder-[#5F6066] focus:border-[#383844] focus:outline-hidden transition-colors"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#5F6066] hover:text-[#F5F5F7]"
            aria-label="Clear filter"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Scrollable list */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-1 pr-0.5 overscroll-contain">
        {allowIndependent && !query && (
          <button
            type="button"
            onClick={() => {
              onSelectTask(null);
              onClose();
            }}
            className={`w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${
              !selectedTaskId
                ? 'bg-[#1C1C24] text-[#F5F5F7] border border-[#282834]'
                : 'text-[#8A8A90] hover:bg-[#16161B] hover:text-[#F5F5F7]'
            }`}
          >
            <div className="flex flex-col min-w-0 pr-2">
              <span className="font-medium text-[#F5F5F7]">Independent Session</span>
              <span className="text-[10px] text-[#5F6066]">Custom subject without task link</span>
            </div>
            {!selectedTaskId && <Check className="h-3.5 w-3.5 text-[#60A5FA] shrink-0" />}
          </button>
        )}

        {filteredTasks.length === 0 ? (
          <div className="py-6 text-center text-[11px] text-[#5F6066]">
            {query ? 'No matching tasks found' : 'No tasks available'}
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isSelected = selectedTaskId === task.id;
            const isCompleted = task.status === 'completed' || task.completed;
            return (
              <button
                key={task.id}
                type="button"
                onClick={() => {
                  onSelectTask(task);
                  onClose();
                }}
                className={`w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${
                  isSelected
                    ? 'bg-[#162033] border border-[#2A3F66] text-[#F5F5F7]'
                    : 'text-[#8A8A90] hover:bg-[#16161B] hover:text-[#F5F5F7]'
                }`}
              >
                <div className="flex flex-col min-w-0 pr-2">
                  <span
                    className={`truncate font-medium ${
                      isCompleted ? 'line-through text-[#5F6066]' : 'text-[#F5F5F7]'
                    }`}
                  >
                    {task.title}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#5F6066]">
                    {task.subject && (
                      <span className="truncate flex items-center gap-1">
                        <FolderKanban className="h-2.5 w-2.5" />
                        {task.subject}
                      </span>
                    )}
                    {task.estimatedMinutes ? (
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="h-2.5 w-2.5" />
                        {task.estimatedMinutes}m
                      </span>
                    ) : null}
                  </div>
                </div>
                {isSelected && <Check className="h-3.5 w-3.5 text-[#60A5FA] shrink-0" />}
              </button>
            );
          })
        )}
      </div>
    </div>,
    document.body
  );
};
