import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { Task, TaskPriority } from '../types';
import { useProjects } from '../hooks/useProjects';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    subject: string;
    projectId: string | null;
    priority: TaskPriority;
    estimatedMinutes: number;
    description?: string;
  }) => void;
  initialTask?: Task | null;
  defaultProjectId?: string | null;
}

const COMMON_SUBJECTS = ['General', 'Deep Work', 'Engineering', 'Writing', 'Research', 'Design'];
const COMMON_DURATIONS = [15, 25, 30, 45, 50, 60];

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTask,
  defaultProjectId,
}) => {
  const { activeProjects } = useProjects();

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('General');
  const [customSubject, setCustomSubject] = useState('');
  const [projectId, setProjectId] = useState<string | null>(defaultProjectId || null);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(30);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    if (initialTask) {
      setTitle(initialTask.title);
      if (COMMON_SUBJECTS.includes(initialTask.subject)) {
        setSubject(initialTask.subject);
        setCustomSubject('');
      } else {
        setSubject('Custom');
        setCustomSubject(initialTask.subject);
      }
      setProjectId(initialTask.projectId || null);
      setPriority(initialTask.priority);
      setEstimatedMinutes(initialTask.estimatedMinutes || 30);
      setDescription(initialTask.description || '');
    } else {
      setTitle('');
      setSubject('General');
      setCustomSubject('');
      setProjectId(defaultProjectId || (activeProjects[0]?.id ?? null));
      setPriority('medium');
      setEstimatedMinutes(30);
      setDescription('');
    }
    setError('');
  }, [isOpen, initialTask, defaultProjectId]);

  useEffect(() => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task name is required');
      return;
    }

    const finalSubject = subject === 'Custom' ? customSubject.trim() || 'General' : subject;

    onSave({
      title: title.trim(),
      subject: finalSubject,
      projectId: projectId || null,
      priority,
      estimatedMinutes: Number(estimatedMinutes) > 0 ? Number(estimatedMinutes) : 30,
      description: description.trim(),
    });

    onClose();
  };

  return (
    <div
      id="task-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
    >
      <div
        id="task-modal-content"
        className="flex w-full max-w-md flex-col rounded-xl border border-[#202024] bg-[#0E0E11] p-5 sm:p-6 shadow-2xl transition-all"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#202024]">
          <h3
            id="task-modal-title"
            className="text-sm font-medium tracking-tight text-[#F5F5F7]"
          >
            {initialTask ? 'Edit Task' : 'New Task'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-[#5F6066] hover:text-[#F5F5F7] transition-colors"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4 text-xs">
          {error && (
            <div className="rounded border border-red-900/50 bg-red-950/20 px-3 py-1.5 text-[11px] text-red-400">
              {error}
            </div>
          )}

          {/* Task Title */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="task-title-input" className="text-[#8A8A90] font-mono text-[10px] uppercase tracking-wider">
              Task Name *
            </label>
            <input
              id="task-title-input"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. Draft technical architecture doc"
              className="h-9 rounded-lg border border-[#202024] bg-[#141417] px-3 text-xs text-[#F5F5F7] placeholder-[#5F6066] focus:border-[#2E2E35] focus:outline-none transition-colors"
              autoFocus
            />
          </div>

          {/* Subject & Project row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Subject */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="task-subject-select" className="text-[#8A8A90] font-mono text-[10px] uppercase tracking-wider">
                Subject
              </label>
              <select
                id="task-subject-select"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="h-9 rounded-lg border border-[#202024] bg-[#141417] px-3 text-xs text-[#F5F5F7] focus:border-[#2E2E35] focus:outline-none transition-colors"
              >
                {COMMON_SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
                <option value="Custom">Custom...</option>
              </select>

              {subject === 'Custom' && (
                <input
                  type="text"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder="Enter subject"
                  className="mt-1 h-8 rounded-lg border border-[#202024] bg-[#141417] px-2.5 text-xs text-[#F5F5F7] placeholder-[#5F6066] focus:outline-none"
                />
              )}
            </div>

            {/* Project */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="task-project-select" className="text-[#8A8A90] font-mono text-[10px] uppercase tracking-wider">
                Project
              </label>
              <select
                id="task-project-select"
                value={projectId || ''}
                onChange={(e) => setProjectId(e.target.value || null)}
                className="h-9 rounded-lg border border-[#202024] bg-[#141417] px-3 text-xs text-[#F5F5F7] focus:border-[#2E2E35] focus:outline-none transition-colors"
              >
                <option value="">No Project (Independent)</option>
                {activeProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Priority & Estimated Time row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Priority */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[#8A8A90] font-mono text-[10px] uppercase tracking-wider">
                Priority
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['low', 'medium', 'high'] as TaskPriority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`h-8 rounded-md border text-[11px] font-mono uppercase tracking-wider transition-colors ${
                      priority === p
                        ? p === 'high'
                          ? 'border-[#4a1c22] bg-[#221014] text-[#f87171]'
                          : p === 'medium'
                          ? 'border-[#3d3319] bg-[#1f190a] text-[#fbbf24]'
                          : 'border-[#202024] bg-[#1a1a1f] text-[#F5F5F7]'
                        : 'border-[#202024] bg-[#141417] text-[#5F6066] hover:text-[#8A8A90]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Estimated Time */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="task-duration-input" className="text-[#8A8A90] font-mono text-[10px] uppercase tracking-wider">
                Estimated Duration (min)
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  id="task-duration-input"
                  type="number"
                  min="5"
                  max="360"
                  step="5"
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                  className="h-8 w-20 rounded-lg border border-[#202024] bg-[#141417] px-2.5 text-xs text-[#F5F5F7] focus:border-[#2E2E35] focus:outline-none text-center font-mono"
                />
                <div className="flex gap-1 flex-1 overflow-x-auto">
                  {COMMON_DURATIONS.slice(1, 5).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setEstimatedMinutes(m)}
                      className={`h-8 flex-1 rounded border text-[10px] font-mono transition-colors ${
                        estimatedMinutes === m
                          ? 'border-[#2E2E35] bg-[#202024] text-[#F5F5F7]'
                          : 'border-[#202024] bg-[#141417] text-[#5F6066] hover:text-[#8A8A90]'
                      }`}
                    >
                      {m}m
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Description (Optional) */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="task-description-input" className="text-[#8A8A90] font-mono text-[10px] uppercase tracking-wider">
              Description (Optional)
            </label>
            <textarea
              id="task-description-input"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notes, references, or formulas to cover..."
              className="resize-none rounded-lg border border-[#202024] bg-[#141417] p-2.5 text-xs text-[#F5F5F7] placeholder-[#5F6066] focus:border-[#2E2E35] focus:outline-none transition-colors"
            />
          </div>

          {/* Footer actions */}
          <div className="mt-3 pt-3 border-t border-[#202024] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-8 rounded-lg border border-[#202024] bg-[#141417] px-3 text-xs text-[#8A8A90] hover:text-[#F5F5F7] transition-colors"
            >
              Cancel
            </button>
            <button
              id="save-task-submit-btn"
              type="submit"
              className="h-8 rounded-lg border border-[#2E2E35] bg-[#F5F5F7] px-4 text-xs font-medium text-[#050505] hover:bg-white transition-colors inline-flex items-center gap-1.5"
            >
              <Check className="h-3.5 w-3.5" />
              <span>{initialTask ? 'Update Task' : 'Save Task'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
