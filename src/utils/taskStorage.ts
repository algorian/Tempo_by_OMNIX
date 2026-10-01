import { Task, TaskPriority, TaskStatus } from '../types';

export const TASKS_STORAGE_KEY = 'tempo_tasks';
export const ACTIVE_TASK_KEY = 'tempo_active_task_id';

export function getAllTasks(): Task[] {
  try {
    const raw = localStorage.getItem(TASKS_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    // Filter out any mock/seeded/demo tasks to guarantee genuine clean user state
    const realTasks = parsed.filter(
      (t: Task) =>
        t &&
        typeof t === 'object' &&
        typeof t.id === 'string' &&
        !t.id.startsWith('demo-') &&
        !t.id.startsWith('mock-') &&
        !t.id.startsWith('seed-') &&
        !t.id.startsWith('sample-') &&
        !t.id.startsWith('fake-') &&
        !t.id.startsWith('task-baseline-')
    );
    // If seeded/mock tasks were detected, purge them from storage
    if (realTasks.length !== parsed.length) {
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(realTasks));
    }
    // Normalize properties for backwards compatibility
    return realTasks.map((t: Task) => ({
      ...t,
      completed: t.status === 'completed' || t.completed === true,
      duration: t.duration || `${t.estimatedMinutes || 30} min`,
    }));
  } catch {
    return [];
  }
}

export function getActiveTasks(): Task[] {
  return getAllTasks().filter((t) => t.status !== 'archived');
}

export function getTaskById(id: string | null): Task | undefined {
  if (!id) return undefined;
  return getAllTasks().find((t) => t.id === id);
}

export function getTasksByProject(projectId: string): Task[] {
  return getAllTasks().filter((t) => t.projectId === projectId && t.status !== 'archived');
}

export function saveTask(task: Task): void {
  try {
    const tasks = getAllTasks();
    const idx = tasks.findIndex((t) => t.id === task.id);
    let updated: Task[];

    const normalizedTask: Task = {
      ...task,
      completed: task.status === 'completed',
      duration: `${task.estimatedMinutes} min`,
      updatedAt: Date.now(),
    };

    if (idx >= 0) {
      updated = [...tasks];
      updated[idx] = normalizedTask;
    } else {
      updated = [normalizedTask, ...tasks];
    }

    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tempo_tasks_updated'));
    }
  } catch (err) {
    console.error('Failed to save task', err);
  }
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  subject: string;
  projectId?: string | null;
  priority?: TaskPriority;
  estimatedMinutes?: number;
  category?: string;
}

export function createTask(input: CreateTaskInput): Task {
  const now = Date.now();
  const estimated = input.estimatedMinutes && input.estimatedMinutes > 0 ? input.estimatedMinutes : 30;

  const newTask: Task = {
    id: `task-${now}-${Math.random().toString(36).slice(2, 6)}`,
    title: input.title.trim(),
    description: (input.description || '').trim(),
    status: 'todo',
    priority: input.priority || 'medium',
    projectId: input.projectId || null,
    subject: input.subject.trim() || 'Focus',
    category: input.category || (input.projectId ? 'Project' : 'General'),
    estimatedMinutes: estimated,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
    completed: false,
    duration: `${estimated} min`,
  };

  saveTask(newTask);
  return newTask;
}

export function updateTask(
  id: string,
  updates: Partial<Omit<Task, 'id' | 'createdAt'>>
): Task | null {
  const tasks = getAllTasks();
  const existing = tasks.find((t) => t.id === id);
  if (!existing) return null;

  const updatedStatus = updates.status !== undefined ? updates.status : existing.status;
  const isNowCompleted = updatedStatus === 'completed';

  const updated: Task = {
    ...existing,
    ...updates,
    status: updatedStatus,
    completed: isNowCompleted,
    completedAt: isNowCompleted
      ? updates.completedAt !== undefined
        ? updates.completedAt
        : existing.completedAt || Date.now()
      : updatedStatus === 'todo'
      ? null
      : existing.completedAt,
    duration: updates.estimatedMinutes
      ? `${updates.estimatedMinutes} min`
      : existing.duration || `${existing.estimatedMinutes} min`,
    updatedAt: Date.now(),
  };

  saveTask(updated);
  return updated;
}

export function toggleTaskCompletion(id: string): Task | null {
  const task = getTaskById(id);
  if (!task) return null;

  const nextCompleted = !(task.status === 'completed');
  return updateTask(id, {
    status: nextCompleted ? 'completed' : 'todo',
    completedAt: nextCompleted ? Date.now() : null,
  });
}

export function archiveTask(id: string): void {
  updateTask(id, { status: 'archived' });
  // If this task was currently active, clear active task
  if (getActiveTaskId() === id) {
    setActiveTaskId(null);
  }
}

export function orphanTasksForProject(projectId: string): void {
  try {
    const tasks = getAllTasks();
    let changed = false;
    const updated = tasks.map((t) => {
      if (t.projectId === projectId) {
        changed = true;
        return {
          ...t,
          projectId: null,
          category: t.category === 'Project' ? 'General' : t.category,
          updatedAt: Date.now(),
        };
      }
      return t;
    });

    if (changed) {
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(updated));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('tempo_tasks_updated'));
      }
    }
  } catch (err) {
    console.error('Failed to orphan tasks for project', err);
  }
}

export function deleteTask(id: string): void {
  try {
    const tasks = getAllTasks().filter((t) => t.id !== id);
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    if (getActiveTaskId() === id) {
      setActiveTaskId(null);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tempo_tasks_updated'));
    }
  } catch (err) {
    console.error('Failed to delete task', err);
  }
}

/* =========================================================================
   Active Focusing Task Tracking
   ========================================================================= */

export function getActiveTaskId(): string | null {
  try {
    const id = localStorage.getItem(ACTIVE_TASK_KEY);
    if (!id) return null;
    const exists = getAllTasks().some((t) => t.id === id);
    if (!exists) {
      localStorage.removeItem(ACTIVE_TASK_KEY);
      return null;
    }
    return id;
  } catch {
    return null;
  }
}

export function setActiveTaskId(id: string | null): void {
  try {
    if (id) {
      localStorage.setItem(ACTIVE_TASK_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_TASK_KEY);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tempo_active_task_updated', { detail: id }));
    }
  } catch (err) {
    console.error('Failed to set active task', err);
  }
}

/**
 * Get count of tasks completed today based on local calendar day
 */
export function getTodayCompletedTasksCount(): number {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
    const endOfDay = startOfDay + 86400000;
    return getAllTasks().filter(
      (t) =>
        (t.status === 'completed' || t.completed) &&
        t.completedAt !== null &&
        t.completedAt >= startOfDay &&
        t.completedAt < endOfDay
    ).length;
  } catch {
    return 0;
  }
}
