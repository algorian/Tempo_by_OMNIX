import React from 'react';
import { Check, Play, Pencil, Trash2 } from 'lucide-react';
import { Task } from '../types';
import { getProjectById } from '../utils/projectStorage';

interface TaskItemProps {
  task: Task;
  isCurrentlyFocused?: boolean;
  onToggle: (id: string) => void;
  onStartFocus?: (task: Task) => void;
  onEdit?: (task: Task) => void;
  onArchive?: (id: string) => void;
  showProjectBadge?: boolean;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  isCurrentlyFocused = false,
  onToggle,
  onStartFocus,
  onEdit,
  onArchive,
  showProjectBadge = true,
}) => {
  const isCompleted = task.status === 'completed' || task.completed;
  const project = task.projectId ? getProjectById(task.projectId) : undefined;

  return (
    <div
      id={`task-item-${task.id}`}
      className={`group relative flex items-center justify-between rounded-lg border p-2.5 transition-all duration-200 ${
        isCurrentlyFocused
          ? 'border-[#26354D] bg-gradient-to-r from-[#0C121D] to-[#0A0E17] shadow-xs'
          : isCompleted
          ? 'border-transparent opacity-60 hover:border-[#1E1E22] hover:bg-[#0E0E11]'
          : 'border-transparent hover:border-[#222228] hover:bg-[#111114]'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Checkbox */}
        <button
          id={`task-checkbox-${task.id}`}
          type="button"
          onClick={() => onToggle(task.id)}
          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded transition-all active:scale-95 ${
            isCompleted
              ? 'border border-[#202024] bg-[#202024] text-[#F5F5F7]'
              : 'border border-[#2E2E35] bg-transparent group-hover:border-[#5F6066]'
          }`}
          aria-label={isCompleted ? 'Mark task as todo' : 'Mark task as completed'}
        >
          {isCompleted && <Check className="h-3 w-3 stroke-[2.5]" />}
        </button>

        {/* Task Title & Metadata */}
        <div className="flex flex-col min-w-0 pr-2 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              id={`task-title-${task.id}`}
              className={`truncate text-xs font-normal tracking-tight transition-colors ${
                isCompleted
                  ? 'text-[#5F6066] line-through'
                  : 'text-[#F5F5F7]'
              }`}
            >
              {task.title}
            </span>

            {/* Restrained Active Focusing State */}
            {isCurrentlyFocused && (
              <span
                id={`task-focusing-badge-${task.id}`}
                className="font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.2 rounded border border-[#1E293B] bg-[#0F172A] text-[#93C5FD]"
              >
                FOCUSING
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#5F6066] mt-0.5 flex-wrap">
            <span>{task.subject}</span>
            {showProjectBadge && project && (
              <>
                <span>•</span>
                <span className="text-[#8A8A90] truncate max-w-[130px]">{project.name}</span>
              </>
            )}
            <span>•</span>
            <span>{task.estimatedMinutes || 30} min</span>
          </div>
        </div>
      </div>

      {/* Right-side metadata & actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Priority Badge */}
        <span
          id={`task-priority-${task.id}`}
          className={`font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${
            task.priority === 'high'
              ? 'border-[#302024] bg-[#1a0f12] text-[#e06c75]'
              : task.priority === 'medium'
              ? 'border-[#28261e] bg-[#14130d] text-[#e5c07b]'
              : 'border-[#202024] bg-[#111113] text-[#5F6066]'
          }`}
        >
          {task.priority}
        </span>

        {/* Hover / Active Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Start Focus Button */}
          {onStartFocus && !isCompleted && (
            <button
              id={`task-start-focus-${task.id}`}
              type="button"
              onClick={() => onStartFocus(task)}
              className={`flex h-6 items-center gap-1 rounded border px-1.5 text-[10px] font-mono uppercase tracking-wider transition-colors ${
                isCurrentlyFocused
                  ? 'border-[#2563EB]/40 bg-[#1E3A8A]/30 text-[#93C5FD]'
                  : 'border-[#202024] bg-[#141417] text-[#8A8A90] hover:border-[#2E2E35] hover:text-[#F5F5F7]'
              }`}
              title="Start focus timer on this task"
            >
              <Play className="h-2.5 w-2.5 fill-current" />
              <span className="hidden sm:inline">Focus</span>
            </button>
          )}

          {/* Edit Button */}
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(task)}
              className="flex h-6 w-6 items-center justify-center rounded border border-[#202024] bg-[#141417] text-[#5F6066] hover:text-[#F5F5F7] transition-colors"
              title="Edit task"
              aria-label="Edit task"
            >
              <Pencil className="h-2.5 w-2.5" />
            </button>
          )}

          {/* Archive / Delete Button */}
          {onArchive && (
            <button
              type="button"
              onClick={() => onArchive(task.id)}
              className="flex h-6 w-6 items-center justify-center rounded border border-[#202024] bg-[#141417] text-[#5F6066] hover:text-red-400 transition-colors"
              title="Archive task"
              aria-label="Archive task"
            >
              <Trash2 className="h-2.5 w-2.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
