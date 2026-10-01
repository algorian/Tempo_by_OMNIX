import { Project, ProjectStatus } from '../types';
import { orphanTasksForProject } from './taskStorage';

export const PROJECTS_STORAGE_KEY = 'tempo_projects';

export function getAllProjects(): Project[] {
  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    // Filter out any mock/seeded/demo projects to guarantee genuine clean user state
    const realProjects = parsed.filter(
      (p: Project) =>
        p &&
        typeof p === 'object' &&
        typeof p.id === 'string' &&
        !p.id.startsWith('demo-') &&
        !p.id.startsWith('mock-') &&
        !p.id.startsWith('seed-') &&
        !p.id.startsWith('sample-') &&
        !p.id.startsWith('fake-') &&
        !p.id.startsWith('project-baseline-')
    );
    // If seeded/mock projects were detected, purge them from storage
    if (realProjects.length !== parsed.length) {
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(realProjects));
    }
    return realProjects;
  } catch {
    return [];
  }
}

export function getActiveProjects(): Project[] {
  return getAllProjects().filter((p) => p.status === 'active');
}

export function getProjectById(id: string | null): Project | undefined {
  if (!id) return undefined;
  return getAllProjects().find((p) => p.id === id);
}

export function saveProject(project: Project): void {
  try {
    const projects = getAllProjects();
    const idx = projects.findIndex((p) => p.id === project.id);
    let updated: Project[];

    if (idx >= 0) {
      updated = [...projects];
      updated[idx] = { ...project, updatedAt: Date.now() };
    } else {
      updated = [project, ...projects];
    }

    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tempo_projects_updated'));
    }
  } catch (err) {
    console.error('Failed to save project', err);
  }
}

export function createProject(data: { name: string; description?: string }): Project {
  const newProject: Project = {
    id: `project-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: data.name.trim(),
    description: (data.description || '').trim(),
    status: 'active',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  saveProject(newProject);
  return newProject;
}

export function updateProject(
  id: string,
  updates: Partial<Omit<Project, 'id' | 'createdAt'>>
): Project | null {
  const projects = getAllProjects();
  const existing = projects.find((p) => p.id === id);
  if (!existing) return null;

  const updated: Project = {
    ...existing,
    ...updates,
    updatedAt: Date.now(),
  };

  saveProject(updated);
  return updated;
}

export function archiveProject(id: string): void {
  updateProject(id, { status: 'archived' });
}

export function deleteProject(id: string): boolean {
  try {
    const projects = getAllProjects();
    const filtered = projects.filter((p) => p.id !== id);
    if (filtered.length === projects.length) {
      return false;
    }

    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(filtered));

    // Safely orphan all tasks belonging to this project (projectId -> null)
    orphanTasksForProject(id);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tempo_projects_updated'));
    }
    return true;
  } catch (err) {
    console.error('Failed to delete project', err);
    return false;
  }
}

