import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Task } from '../types';
import { TaskItem } from './TaskItem';
import { TaskModal } from './TaskModal';
import { useTasks } from '../hooks/useTasks';

type FilterMode = 'all' | 'active' | 'completed';

export const TaskList: React.FC = () => {
  const {
    tasks,
    activeTaskId,
    toggleTask,
    createTask,
    updateTask,
    archiveTask,
    startFocusOnTask,
  } = useTasks();

  const [filter, setFilter] = useState<FilterMode>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Active (non-archived) tasks for Today
  const todayTasks = tasks.filter((t) => t.status !== 'archived');
  const completedCount = todayTasks.filter((t) => t.status === 'completed' || t.completed).length;
  const totalCount = todayTasks.length;

  // Filter tasks based on selected mode
  const filteredTasks = todayTasks.filter((t) => {
    const isComp = t.status === 'completed' || t.completed;
    if (filter === 'active') return !isComp;
    if (filter === 'completed') return isComp;
    return true;
  });

  // Sorting:
  // 1. Currently focused task
  // 2. High priority
  // 3. Medium priority
  // 4. Low priority
  // 5. Completed tasks (subdued at the bottom)
  const priorityWeight: Record<string, number> = {
    high: 3,
    medium: 2,
    low: 1,
  };

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const isACompleted = a.status === 'completed' || a.completed;
    const isBCompleted = b.status === 'completed' || b.completed;

    // Completed always sink to bottom in 'all' view
    if (isACompleted !== isBCompleted) {
      return isACompleted ? 1 : -1;
    }

    // Currently focused task floats to top
    if (a.id === activeTaskId) return -1;
    if (b.id === activeTaskId) return 1;

    // Higher priority first
    const weightDiff = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
    if (weightDiff !== 0) return weightDiff;

    return b.createdAt - a.createdAt;
  });

  const handleOpenCreate = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleSaveModal = (data: {
    title: string;
    subject: string;
    projectId: string | null;
    priority: 'low' | 'medium' | 'high';
    estimatedMinutes: number;
    description?: string;
  }) => {
    if (editingTask) {
      updateTask(editingTask.id, {
        title: data.title,
        subject: data.subject,
        projectId: data.projectId,
        priority: data.priority,
        estimatedMinutes: data.estimatedMinutes,
        description: data.description,
      });
    } else {
      createTask({
        title: data.title,
        subject: data.subject,
        projectId: data.projectId,
        priority: data.priority,
        estimatedMinutes: data.estimatedMinutes,
        description: data.description,
      });
    }
  };

  return (
    <div
      id="today-tasks-card"
      className="flex flex-col justify-between rounded-xl border border-[#202024] bg-[#0B0B0D] tempo-card-surface p-5 shadow-xs transition-all hover:border-[#26262C]"
    >
      <div>
        {/* Header */}
        <div
          id="today-tasks-header"
          className="flex items-center justify-between pb-3 border-b border-[#202024]/60 mb-3"
        >
          <div className="flex items-center gap-2">
            <h2
              id="today-tasks-title"
              className="text-xs font-semibold tracking-wider text-[#F5F5F7] uppercase"
            >
              Today
            </h2>
            <button
              id="today-new-task-btn"
              type="button"
              onClick={handleOpenCreate}
              className="flex h-5 items-center gap-1 rounded border border-[#202024] bg-[#141417] px-1.5 text-[10px] font-mono text-[#8A8A90] hover:border-[#2E2E35] hover:text-[#F5F5F7] transition-all"
              title="Add task"
            >
              <Plus className="h-3 w-3" />
              <span>New</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Filter */}
            <div className="flex items-center gap-1 font-mono text-[10px]">
              {(['all', 'active', 'completed'] as FilterMode[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`px-2 py-0.5 rounded transition-all capitalize ${
                    filter === f
                      ? 'bg-[#18181D] border border-[#26262C] text-[#F5F5F7] font-medium'
                      : 'border border-transparent text-[#5F6066] hover:text-[#8A8A90] hover:bg-[#121215]'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <span
              id="today-tasks-progress"
              className="font-mono text-xs font-medium text-[#8A8A90]"
            >
              {completedCount} / {totalCount}
            </span>
          </div>
        </div>

        {/* Task Items List */}
        <div id="today-tasks-list" className="flex flex-col gap-0.5 min-h-[160px]">
          {sortedTasks.length === 0 ? (
            totalCount === 0 ? (
              <div className="flex h-36 flex-col items-center justify-center text-center text-xs text-[#5F6066]">
                <p className="text-sm font-medium text-[#F5F5F7]">Your focus starts here.</p>
                <button
                  id="today-empty-create-task-btn"
                  type="button"
                  onClick={handleOpenCreate}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-[#2E2E35] bg-[#141417] px-3 py-1.5 text-xs font-medium text-[#F5F5F7] hover:bg-[#1C1C22] transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create your first task</span>
                </button>
              </div>
            ) : (
              <div className="flex h-36 flex-col items-center justify-center text-center text-xs text-[#5F6066]">
                <p className="text-[#8A8A90] font-medium">No tasks in {filter}.</p>
              </div>
            )
          ) : (
            sortedTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                isCurrentlyFocused={task.id === activeTaskId}
                onToggle={toggleTask}
                onStartFocus={startFocusOnTask}
                onEdit={handleOpenEdit}
                onArchive={archiveTask}
              />
            ))
          )}
        </div>
      </div>

      {/* Subtle completion indicator line */}
      <div className="mt-4 pt-3 border-t border-[#202024]/40 flex flex-col gap-2 text-[11px] text-[#5F6066]">
        <div className="flex items-center justify-between">
          <span>Daily cadence</span>
          <span className="font-mono text-[#8A8A90]">
            {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%
          </span>
        </div>
        <div className="h-1 w-full rounded-full bg-[#16161A] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#202024] to-[#60A5FA]/40 transition-all duration-500 ease-out"
            style={{
              width: `${totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%`,
            }}
          />
        </div>
      </div>

      {/* Task Modal for Create / Edit */}
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
