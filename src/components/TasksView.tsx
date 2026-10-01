import React, { useState, useMemo } from 'react';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  ArrowRight,
  Clock,
  Layers,
} from 'lucide-react';
import { Task, TaskPriority } from '../types';
import { useTasks } from '../hooks/useTasks';
import { useProjects } from '../hooks/useProjects';
import { TaskItem } from './TaskItem';
import { TaskModal } from './TaskModal';

interface TasksViewProps {
  onSelectToday?: () => void;
}

type StatusFilter = 'all' | 'active' | 'completed';

export const TasksView: React.FC<TasksViewProps> = ({ onSelectToday }) => {
  const {
    tasks,
    activeTaskId,
    toggleTask,
    createTask,
    updateTask,
    archiveTask,
    startFocusOnTask,
  } = useTasks();

  const { activeProjects } = useProjects();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const nonArchivedTasks = useMemo(
    () => tasks.filter((t) => t.status !== 'archived'),
    [tasks]
  );

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return nonArchivedTasks.filter((task) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = task.title.toLowerCase().includes(q);
        const matchSubject = task.subject.toLowerCase().includes(q);
        if (!matchTitle && !matchSubject) return false;
      }

      // Status
      const isComp = task.status === 'completed' || task.completed;
      if (statusFilter === 'active' && isComp) return false;
      if (statusFilter === 'completed' && !isComp) return false;

      // Project
      if (selectedProjectId !== 'all') {
        if (selectedProjectId === 'none') {
          if (task.projectId) return false;
        } else if (task.projectId !== selectedProjectId) {
          return false;
        }
      }

      // Priority
      if (selectedPriority !== 'all' && task.priority !== selectedPriority) {
        return false;
      }

      return true;
    });
  }, [nonArchivedTasks, searchQuery, statusFilter, selectedProjectId, selectedPriority]);

  // Sorting: Active focused on top, high priority next, completed on bottom
  const priorityWeight: Record<string, number> = {
    high: 3,
    medium: 2,
    low: 1,
  };

  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      const isACompleted = a.status === 'completed' || a.completed;
      const isBCompleted = b.status === 'completed' || b.completed;

      if (isACompleted !== isBCompleted) {
        return isACompleted ? 1 : -1;
      }

      if (a.id === activeTaskId) return -1;
      if (b.id === activeTaskId) return 1;

      const weightDiff = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
      if (weightDiff !== 0) return weightDiff;

      return b.createdAt - a.createdAt;
    });
  }, [filteredTasks, activeTaskId]);

  const totalTasks = nonArchivedTasks.length;
  const completedTasks = nonArchivedTasks.filter((t) => t.status === 'completed' || t.completed).length;

  const handleSaveModal = (data: {
    title: string;
    subject: string;
    projectId: string | null;
    priority: TaskPriority;
    estimatedMinutes: number;
    description?: string;
  }) => {
    if (editingTask) {
      updateTask(editingTask.id, data);
    } else {
      createTask(data);
    }
  };

  return (
    <div id="tasks-view-container" className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Header and Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#202024]/70">
        <div>
          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-[#8A8A90]" />
            <span className="font-mono text-xs uppercase tracking-widest text-[#5F6066]">
              Task Engine
            </span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-light tracking-tight text-[#F5F5F7]">
            All Tasks
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="tasks-view-new-task-btn"
            type="button"
            onClick={() => {
              setEditingTask(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#2E2E35] bg-[#F5F5F7] px-3.5 py-1.5 text-xs font-medium text-[#050505] hover:bg-white transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-[#202024] bg-[#0B0B0D] tempo-card-surface p-3.5 flex flex-col transition-all duration-200 hover:border-[#282830]">
          <span className="font-mono text-[10px] uppercase text-[#5F6066]">Total Tasks</span>
          <span className="font-mono text-xl font-light text-[#F5F5F7] mt-1">{totalTasks}</span>
        </div>
        <div className="rounded-xl border border-[#202024] bg-[#0B0B0D] tempo-card-surface p-3.5 flex flex-col transition-all duration-200 hover:border-[#282830]">
          <span className="font-mono text-[10px] uppercase text-[#5F6066]">Completed</span>
          <span className="font-mono text-xl font-light text-[#F5F5F7] mt-1">{completedTasks}</span>
        </div>
        <div className="rounded-xl border border-[#202024] bg-[#0B0B0D] tempo-card-surface p-3.5 flex flex-col transition-all duration-200 hover:border-[#282830]">
          <span className="font-mono text-[10px] uppercase text-[#5F6066]">Remaining</span>
          <span className="font-mono text-xl font-light text-[#F5F5F7] mt-1">{totalTasks - completedTasks}</span>
        </div>
        <div className="rounded-xl border border-[#202024] bg-[#0B0B0D] tempo-card-surface p-3.5 flex flex-col transition-all duration-200 hover:border-[#282830]">
          <span className="font-mono text-[10px] uppercase text-[#5F6066]">Focus Ratio</span>
          <span className="font-mono text-xl font-light text-[#F5F5F7] mt-1">
            {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-[#202024] bg-[#0B0B0D] tempo-card-surface p-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#5F6066]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks or subjects..."
            className="h-8 w-full rounded-lg border border-[#202024] bg-[#141417] pl-8 pr-3 text-xs text-[#F5F5F7] placeholder-[#5F6066] focus:border-[#2E2E35] focus:outline-none"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Pills */}
          <div className="flex items-center gap-1 font-mono text-[10px] bg-[#141417] p-0.5 rounded-lg border border-[#202024]">
            {(['all', 'active', 'completed'] as StatusFilter[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setStatusFilter(f)}
                className={`px-2 py-1 rounded capitalize transition-colors ${
                  statusFilter === f
                    ? 'bg-[#202024] text-[#F5F5F7] font-medium'
                    : 'text-[#5F6066] hover:text-[#8A8A90]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Project Filter */}
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="h-8 rounded-lg border border-[#202024] bg-[#141417] px-2 text-xs text-[#8A8A90] focus:outline-none"
          >
            <option value="all">All Projects</option>
            <option value="none">No Project</option>
            {activeProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="h-8 rounded-lg border border-[#202024] bg-[#141417] px-2 text-xs text-[#8A8A90] focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className="flex flex-col rounded-xl border border-[#202024] bg-[#0B0B0D] tempo-card-surface p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#202024]/60 mb-2">
          <span className="font-mono text-xs uppercase tracking-wider text-[#8A8A90]">
            Task Inventory ({sortedTasks.length})
          </span>
        </div>

        <div className="flex flex-col gap-1 min-h-[220px]">
          {sortedTasks.length === 0 ? (
            nonArchivedTasks.length === 0 ? (
              <div className="flex h-52 flex-col items-center justify-center text-center p-6">
                <p className="text-sm font-medium text-[#F5F5F7]">Your focus starts here.</p>
                <button
                  id="empty-state-create-task-btn"
                  type="button"
                  onClick={() => {
                    setEditingTask(null);
                    setIsModalOpen(true);
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-[#2E2E35] bg-[#141417] px-3.5 py-1.5 text-xs font-medium text-[#F5F5F7] hover:bg-[#1C1C22] hover:border-[#3E3E48] transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create your first task</span>
                </button>
              </div>
            ) : (
              <div className="flex h-44 flex-col items-center justify-center text-center text-xs text-[#5F6066]">
                <p className="text-[#8A8A90] font-medium">No matching tasks found.</p>
              </div>
            )
          ) : (
            sortedTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                isCurrentlyFocused={task.id === activeTaskId}
                onToggle={toggleTask}
                onStartFocus={(t: Task) => {
                  startFocusOnTask(t);
                  onSelectToday?.();
                }}
                onEdit={(t) => {
                  setEditingTask(t);
                  setIsModalOpen(true);
                }}
                onArchive={archiveTask}
                showProjectBadge={true}
              />
            ))
          )}
        </div>
      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveModal}
        initialTask={editingTask}
      />
    </div>
  );
};
