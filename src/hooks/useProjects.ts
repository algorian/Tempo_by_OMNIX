import { useState, useEffect, useCallback, useMemo } from 'react';
import { Project } from '../types';
import {
  getAllProjects,
  getActiveProjects,
  createProject as createProjectStorage,
  updateProject as updateProjectStorage,
  archiveProject as archiveProjectStorage,
  deleteProject as deleteProjectStorage,
} from '../utils/projectStorage';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>(() => getAllProjects());

  const refreshProjects = useCallback(() => {
    setProjects(getAllProjects());
  }, []);

  useEffect(() => {
    window.addEventListener('tempo_projects_updated', refreshProjects);
    window.addEventListener('storage', refreshProjects);
    return () => {
      window.removeEventListener('tempo_projects_updated', refreshProjects);
      window.removeEventListener('storage', refreshProjects);
    };
  }, [refreshProjects]);

  const activeProjects = useMemo(() => projects.filter((p) => p.status === 'active'), [projects]);

  const createProject = useCallback((data: { name: string; description?: string }) => {
    const created = createProjectStorage(data);
    setProjects(getAllProjects());
    return created;
  }, []);

  const updateProject = useCallback(
    (id: string, updates: Partial<Omit<Project, 'id' | 'createdAt'>>) => {
      const updated = updateProjectStorage(id, updates);
      setProjects(getAllProjects());
      return updated;
    },
    []
  );

  const archiveProject = useCallback((id: string) => {
    archiveProjectStorage(id);
    setProjects(getAllProjects());
  }, []);

  const deleteProject = useCallback((id: string) => {
    const success = deleteProjectStorage(id);
    setProjects(getAllProjects());
    return success;
  }, []);

  return {
    projects,
    activeProjects,
    createProject,
    updateProject,
    archiveProject,
    deleteProject,
    refreshProjects,
  };
}
