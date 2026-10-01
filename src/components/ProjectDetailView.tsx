import React, { useState } from 'react';
import { ArrowLeft, Plus, Clock, CheckCircle2, Pencil, Archive, Trash2, Check } from 'lucide-react';
import { Project, Task } from '../types';
import { useTasks } from '../hooks/useTasks';
import { TaskItem } from './TaskItem';
import { TaskModal } from './TaskModal';
import { ProjectModal } from './ProjectModal';
import { ProjectDeleteModal } from './ProjectDeleteModal';
import { getFocusTimeForProject } from '../utils/focusMetrics';

interface ProjectDetailViewProps {
  project: Project;
  onBack: () => void;
  onUpdateProject: (id: string, updates: Partial<Project>) => void;
  onArchiveProject: (id: string) => void;
  onDeleteProject?: (id: string) => void;
  onSelectToday?: () => void;
}

type FilterMode = 'all' | 'active' | 'completed';

export const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({
  project,
  onBack,
  onUpdateProject,
  onArchiveProject,
  onDeleteProject,
  onSelectToday,
}) => {
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
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Tasks belonging to this project (non-archived)
  const projectTasks = tasks.filter(
    (t) => t.projectId === project.id && t.status !== 'archived'
  );

  const completedCount = projectTasks.filter(
    (t) => t.status === 'completed' || t.completed
  ).length;
  const totalCount = projectTasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Real focus time derived strictly from FocusSession records
  const focusTime = getFocusTimeForProject(project.id);

  // Filter tasks
  const filteredTasks = projectTasks.filter((t) => {
    const isComp = t.status === 'completed' || t.completed;
    if (filter === 'active') return !isComp;
    if (filter === 'completed') return isComp;
    return true;
  });

  const handleSaveTaskModal = (data: {
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
        projectId: project.id,
        priority: data.priority,
        estimatedMinutes: data.estimatedMinutes,
        description: data.description,
      });
    } else {
      createTask({
        title: data.title,
        subject: data.subject,
        projectId: project.id,
        priority: data.priority,
        estimatedMinutes: data.estimatedMinutes,
        description: data.description,
      });
    }
  };

  return (
    <div id={`project-detail-${project.id}`} className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Navigation and Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          id="project-detail-back-btn"
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#202024] bg-[#111113] px-3 py-1.5 text-xs text-[#8A8A90] hover:text-[#F5F5F7] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>All Projects</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            id="edit-project-btn"
            type="button"
            onClick={() => setIsProjectModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#202024] bg-[#111113] px-3 py-1.5 text-xs text-[#8A8A90] hover:text-[#F5F5F7] transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Edit Project</span>
          </button>
          <button
            id="archive-project-btn"
            type="button"
            onClick={() => {
              onArchiveProject(project.id);
              onBack();
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#202024] bg-[#111113] px-3 py-1.5 text-xs text-[#5F6066] hover:text-[#8A8A90] transition-colors"
            title="Archive this project"
          >
            <Archive className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Archive</span>
          </button>
          <button
            id="delete-project-btn"
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#202024] bg-[#111113] px-3 py-1.5 text-xs text-[#5F6066] hover:text-red-400 hover:border-[#3D1E1E] transition-colors"
            title="Delete this project"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>
      </div>

      {/* Project Overview Card */}
      <div
        id="project-overview-header-card"
        className="flex flex-col rounded-xl border border-[#202024] bg-[#0B0B0D] p-6 sm:p-8 shadow-xs"
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#8A8A90]">
                Project
              </span>
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded border border-[#202024] bg-[#141417] text-[#8A8A90]">
                {project.status}
              </span>
            </div>
            <h1
              id="project-detail-title"
              className="text-2xl sm:text-3xl font-light tracking-tight text-[#F5F5F7]"
            >
              {project.name}
            </h1>
            {project.description && (
              <p
                id="project-detail-description"
                className="max-w-2xl text-xs sm:text-sm text-[#8A8A90] leading-relaxed"
              >
                {project.description}
              </p>
            )}
          </div>

          {/* Key Metrics derived from authoritative FocusSession data */}
          <div className="flex items-center gap-4 sm:gap-6 pt-2 sm:pt-0">
            {/* Total Focus Time */}
            <div className="flex flex-col">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#5F6066]">
                Focus Time
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Clock className="h-3.5 w-3.5 text-[#8A8A90]" />
                <span
                  id="project-total-focus-time"
                  className="font-mono text-base sm:text-lg font-light text-[#F5F5F7]"
                >
                  {focusTime.formatted}
                </span>
              </div>
            </div>

            {/* Task Completion */}
            <div className="flex flex-col">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#5F6066]">
                Completion
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#8A8A90]" />
                <span
                  id="project-tasks-ratio"
                  className="font-mono text-base sm:text-lg font-light text-[#F5F5F7]"
                >
                  {completedCount} / {totalCount}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#5F6066]">
            <span>Progress</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-[#141417] overflow-hidden">
            <div
              className="h-full bg-[#E2E8F0] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tasks in Project Section */}
      <div
        id="project-tasks-section"
        className="flex flex-col rounded-xl border border-[#202024] bg-[#0B0B0D] p-5 sm:p-6 shadow-xs"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#202024]/60">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-semibold tracking-wider text-[#F5F5F7] uppercase">
              Tasks ({filteredTasks.length})
            </h2>
            <button
              id="project-new-task-btn"
              type="button"
              onClick={() => {
                setEditingTask(null);
                setIsTaskModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#2E2E35] bg-[#F5F5F7] px-2.5 py-1 text-xs font-medium text-[#050505] hover:bg-white transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Task in Project</span>
            </button>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 font-mono text-[10px]">
            {(['all', 'active', 'completed'] as FilterMode[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-2 py-1 rounded capitalize transition-colors ${
                  filter === f
                    ? 'bg-[#202024] text-[#F5F5F7] font-medium'
                    : 'text-[#5F6066] hover:text-[#8A8A90]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Task Items List */}
        <div className="mt-3 flex flex-col gap-1 min-h-[140px]">
          {filteredTasks.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center text-center text-xs text-[#5F6066]">
              <p>No {filter !== 'all' ? filter : ''} tasks found in this project.</p>
              <button
                type="button"
                onClick={() => {
                  setEditingTask(null);
                  setIsTaskModalOpen(true);
                }}
                className="mt-2 text-[11px] text-[#8A8A90] hover:text-[#F5F5F7] underline underline-offset-4"
              >
                Create a task for {project.name}
              </button>
            </div>
          ) : (
            filteredTasks.map((task) => (
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
                  setIsTaskModalOpen(true);
                }}
                onArchive={archiveTask}
                showProjectBadge={false}
              />
            ))
          )}
        </div>
      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTaskModal}
        initialTask={editingTask}
        defaultProjectId={project.id}
      />

      {/* Project Edit Modal */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSave={(data) => {
          onUpdateProject(project.id, data);
        }}
        initialProject={project}
      />

      {/* Project Delete Confirmation Modal */}
      <ProjectDeleteModal
        isOpen={isDeleteModalOpen}
        projectName={project.name}
        taskCount={projectTasks.length}
        onConfirm={() => {
          setIsDeleteModalOpen(false);
          onDeleteProject?.(project.id);
          onBack();
        }}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
};
