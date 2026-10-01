import { useState, useEffect, useCallback } from 'react';
import { Task } from '../types';
import {
  getAllTasks,
  getActiveTasks,
  createTask as createTaskStorage,
  updateTask as updateTaskStorage,
  toggleTaskCompletion as toggleTaskStorage,
  archiveTask as archiveTaskStorage,
  deleteTask as deleteTaskStorage,
  getActiveTaskId,
  setActiveTaskId,
  CreateTaskInput,
} from '../utils/taskStorage';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(() => getAllTasks());
  const [activeTaskId, setActiveTaskIdState] = useState<string | null>(() => getActiveTaskId());

  const refreshTasks = useCallback(() => {
    setTasks(getAllTasks());
    setActiveTaskIdState(getActiveTaskId());
  }, []);

  useEffect(() => {
    const handleTasksUpdate = () => refreshTasks();
    const handleActiveTaskUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<string | null>;
      setActiveTaskIdState(customEvent.detail !== undefined ? customEvent.detail : getActiveTaskId());
    };

    window.addEventListener('tempo_tasks_updated', handleTasksUpdate);
    window.addEventListener('tempo_active_task_updated', handleActiveTaskUpdate);
    window.addEventListener('storage', handleTasksUpdate);

    return () => {
      window.removeEventListener('tempo_tasks_updated', handleTasksUpdate);
      window.removeEventListener('tempo_active_task_updated', handleActiveTaskUpdate);
      window.removeEventListener('storage', handleTasksUpdate);
    };
  }, [refreshTasks]);

  const toggleTask = useCallback((id: string) => {
    const updated = toggleTaskStorage(id);
    setTasks(getAllTasks());
    return updated;
  }, []);

  const createTask = useCallback((input: CreateTaskInput) => {
    const created = createTaskStorage(input);
    setTasks(getAllTasks());
    return created;
  }, []);

  const updateTask = useCallback(
    (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => {
      const updated = updateTaskStorage(id, updates);
      setTasks(getAllTasks());
      return updated;
    },
    []
  );

  const archiveTask = useCallback((id: string) => {
    archiveTaskStorage(id);
    setTasks(getAllTasks());
  }, []);

  const deleteTask = useCallback((id: string) => {
    deleteTaskStorage(id);
    setTasks(getAllTasks());
  }, []);

  const startFocusOnTask = useCallback((task: Task) => {
    setActiveTaskId(task.id);
    setActiveTaskIdState(task.id);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('tempo_start_focus_task', {
          detail: { task },
        })
      );
    }
  }, []);

  return {
    tasks,
    activeTasks: tasks.filter((t) => t.status !== 'archived'),
    activeTaskId,
    toggleTask,
    createTask,
    updateTask,
    archiveTask,
    deleteTask,
    startFocusOnTask,
    refreshTasks,
  };
}
