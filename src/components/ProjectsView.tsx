import React, { useState } from 'react';
import {
  FolderKanban,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  Archive,
  Trash2,
  ChevronRight,
} from 'lucide-react';
import { Project } from '../types';
import { useProjects } from '../hooks/useProjects';
import { useTasks } from '../hooks/useTasks';
import { ProjectDetailView } from './ProjectDetailView';
import { ProjectModal } from './ProjectModal';
import { ProjectDeleteModal } from './ProjectDeleteModal';
import { getFocusTimeForProject } from '../utils/focusMetrics';

interface ProjectsViewProps {
  onSelectToday?: () => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({ onSelectToday }) => {
  const {
    projects,
    activeProjects,
    createProject,
    updateProject,
    archiveProject,
    deleteProject,
  } = useProjects();
  const { tasks } = useTasks();

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const displayedProjects = showArchived
    ? projects
    : activeProjects;

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  if (selectedProject) {
    return (
      <ProjectDetailView
        project={selectedProject}
        onBack={() => setSelectedProjectId(null)}
        onUpdateProject={updateProject}
        onArchiveProject={archiveProject}
        onDeleteProject={deleteProject}
        onSelectToday={onSelectToday}
      />
    );
  }

  return (
    <div id="projects-view-container" className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Header and Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#202024]/70">
        <div>
          <div className="flex items-center gap-2">
            <FolderKanban className="h-4 w-4 text-[#8A8A90]" />
            <span className="font-mono text-xs uppercase tracking-widest text-[#5F6066]">
              Workspace
            </span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-light tracking-tight text-[#F5F5F7]">
            Projects
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowArchived(!showArchived)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors ${
              showArchived
                ? 'border-[#2E2E35] bg-[#202024] text-[#F5F5F7]'
                : 'border-[#202024] bg-[#111113] text-[#5F6066] hover:text-[#8A8A90]'
            }`}
          >
            {showArchived ? 'Showing All' : 'Active Only'}
          </button>

          <button
            id="create-project-btn"
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#2E2E35] bg-[#F5F5F7] px-3.5 py-1.5 text-xs font-medium text-[#050505] hover:bg-white transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      <div id="projects-grid" className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {displayedProjects.length === 0 ? (
          <div className="col-span-full flex h-52 flex-col items-center justify-center rounded-xl border border-[#202024] bg-[#0B0B0D] tempo-card-surface p-6 text-center text-xs text-[#5F6066]">
            <p className="text-[#F5F5F7] font-medium text-sm">Organize your work into focused projects.</p>
            <button
              id="create-first-project-btn"
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-[#2E2E35] bg-[#141417] px-3.5 py-1.5 text-xs font-medium text-[#F5F5F7] hover:bg-[#1C1C22] transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create your first project</span>
            </button>
          </div>
        ) : (
          displayedProjects.map((project) => {
            const projectTasks = tasks.filter(
              (t) => t.projectId === project.id && t.status !== 'archived'
            );
            const completedCount = projectTasks.filter(
              (t) => t.status === 'completed' || t.completed
            ).length;
            const totalCount = projectTasks.length;
            const progressPercent =
              totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
            const focusTime = getFocusTimeForProject(project.id);

            return (
              <div
                key={project.id}
                id={`project-card-${project.id}`}
                onClick={() => setSelectedProjectId(project.id)}
                className="group relative flex flex-col justify-between rounded-xl border border-[#202024] bg-[#0B0B0D] tempo-card-surface p-5 sm:p-6 transition-all duration-200 hover:border-[#2E2E35] hover:bg-[#0E0E12] cursor-pointer shadow-xs"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-medium tracking-tight text-[#F5F5F7] group-hover:text-white transition-colors">
                          {project.name}
                        </h3>
                        {project.status === 'archived' && (
                          <span className="font-mono text-[9px] uppercase px-1.5 py-0.2 rounded border border-[#202024] bg-[#141417] text-[#5F6066]">
                            Archived
                          </span>
                        )}
                      </div>
                      {project.description && (
                        <p className="mt-1 text-xs text-[#8A8A90] line-clamp-2 leading-relaxed">
                          {project.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setProjectToDelete(project);
                        }}
                        title={`Delete ${project.name}`}
                        aria-label={`Delete ${project.name}`}
                        className="rounded-lg border border-transparent p-1.5 text-[#5F6066] hover:border-[#3D1E1E] hover:bg-[#1A1010] hover:text-[#F87171] transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <span className="rounded-lg border border-transparent p-1 text-[#5F6066] group-hover:border-[#202024] group-hover:text-[#F5F5F7] transition-all">
                        <ChevronRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>

                  {/* Tasks Preview */}
                  <div className="mt-4 flex flex-col gap-1.5 pt-3 border-t border-[#202024]/50">
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#5F6066]">
                      <span>Recent Tasks</span>
                      <span>
                        {completedCount} of {totalCount} done
                      </span>
                    </div>

                    {projectTasks.slice(0, 3).map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between text-xs py-0.5 text-[#8A8A90]"
                      >
                        <span className={`truncate ${t.status === 'completed' || t.completed ? 'line-through text-[#5F6066]' : ''}`}>
                          • {t.title}
                        </span>
                        <span className="font-mono text-[10px] text-[#5F6066] shrink-0 ml-2">
                          {t.subject}
                        </span>
                      </div>
                    ))}

                    {projectTasks.length === 0 && (
                      <span className="text-[11px] italic text-[#5F6066]">
                        No tasks yet
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress & Focus Time Bar */}
                <div className="mt-5 pt-3 border-t border-[#202024]/50 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-[#8A8A90]">
                      <Clock className="h-3 w-3 text-[#5F6066]" />
                      <span className="font-mono text-[11px]">{focusTime.formatted} focused</span>
                    </div>

                    <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#8A8A90]">
                      <span>{progressPercent}%</span>
                    </div>
                  </div>

                  <div className="h-1 w-full rounded-full bg-[#141417] overflow-hidden">
                    <div
                      className="h-full bg-[#E2E8F0] transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Project Modal */}
      <ProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={(data) => {
          createProject(data);
        }}
      />

      {/* Delete Project Confirmation Modal */}
      <ProjectDeleteModal
        isOpen={Boolean(projectToDelete)}
        projectName={projectToDelete?.name || ''}
        taskCount={
          projectToDelete
            ? tasks.filter((t) => t.projectId === projectToDelete.id && t.status !== 'archived').length
            : 0
        }
        onConfirm={() => {
          if (projectToDelete) {
            deleteProject(projectToDelete.id);
            setProjectToDelete(null);
          }
        }}
        onCancel={() => setProjectToDelete(null)}
      />
    </div>
  );
};
