import { Task, Project, FocusSession } from '../types';
import { AppSettings, getSettings, SETTINGS_STORAGE_KEY } from './settingsStorage';
import { getAllTasks, TASKS_STORAGE_KEY, ACTIVE_TASK_KEY, setActiveTaskId } from './taskStorage';
import { getAllProjects, PROJECTS_STORAGE_KEY } from './projectStorage';
import { getAllSessions, SESSIONS_STORAGE_KEY, ACTIVE_SESSION_STORAGE_KEY, saveActiveSessionRuntime } from './sessionStorage';

export interface TempoBackup {
  schemaVersion: 1;
  exportedAt: string;
  app: 'TEMPO';
  tasks: Task[];
  projects: Project[];
  focusSessions: FocusSession[];
  settings: AppSettings;
}

export interface BackupValidationResult {
  valid: boolean;
  error?: string;
  data?: TempoBackup;
  summary?: {
    tasksCount: number;
    projectsCount: number;
    sessionsCount: number;
  };
}

/**
 * Creates a complete JSON representation of all user-owned TEMPO data.
 * Excludes transient runtime snapshots, recovery buffers, or browser internals.
 */
export function exportTempoData(): TempoBackup {
  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    app: 'TEMPO',
    tasks: getAllTasks(),
    projects: getAllProjects(),
    focusSessions: getAllSessions(),
    settings: getSettings(),
  };
}

/**
 * Triggers a browser download of the exported TEMPO workspace backup.
 */
export function downloadTempoBackup(): void {
  const data = exportTempoData();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `tempo-backup-${dateStr}.json`;

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Safely parses and validates a candidate TEMPO backup object.
 * Rejects malformed JSON, unsupported schema versions, or missing collections.
 */
export function validateTempoBackup(raw: unknown): BackupValidationResult {
  if (!raw || typeof raw !== 'object') {
    return { valid: false, error: 'Backup file is empty or not a valid JSON object.' };
  }

  const obj = raw as Record<string, unknown>;

  if (obj.app !== 'TEMPO') {
    return { valid: false, error: 'Invalid backup file: Missing or incorrect "TEMPO" app identifier.' };
  }

  if (obj.schemaVersion !== 1) {
    return {
      valid: false,
      error: `Unsupported backup schema version: ${obj.schemaVersion || 'unknown'}. Expected version 1.`,
    };
  }

  if (!Array.isArray(obj.tasks)) {
    return { valid: false, error: 'Malformed backup: "tasks" collection is missing or not an array.' };
  }

  if (!Array.isArray(obj.projects)) {
    return { valid: false, error: 'Malformed backup: "projects" collection is missing or not an array.' };
  }

  if (!Array.isArray(obj.focusSessions)) {
    return { valid: false, error: 'Malformed backup: "focusSessions" collection is missing or not an array.' };
  }

  if (!obj.settings || typeof obj.settings !== 'object') {
    return { valid: false, error: 'Malformed backup: "settings" configuration is missing.' };
  }

  // Validate tasks items
  const validTasks = obj.tasks.every(
    (t: unknown) =>
      t &&
      typeof t === 'object' &&
      typeof (t as Record<string, unknown>).id === 'string' &&
      typeof (t as Record<string, unknown>).title === 'string'
  );
  if (!validTasks) {
    return { valid: false, error: 'Malformed backup: One or more tasks are missing required fields (id, title).' };
  }

  // Validate projects items
  const validProjects = obj.projects.every(
    (p: unknown) =>
      p &&
      typeof p === 'object' &&
      typeof (p as Record<string, unknown>).id === 'string' &&
      typeof (p as Record<string, unknown>).name === 'string'
  );
  if (!validProjects) {
    return { valid: false, error: 'Malformed backup: One or more projects are missing required fields (id, name).' };
  }

  // Validate sessions items
  const validSessions = obj.focusSessions.every(
    (s: unknown) =>
      s &&
      typeof s === 'object' &&
      typeof (s as Record<string, unknown>).id === 'string' &&
      typeof (s as Record<string, unknown>).startedAt === 'number'
  );
  if (!validSessions) {
    return {
      valid: false,
      error: 'Malformed backup: One or more focus sessions are missing required fields (id, startedAt).',
    };
  }

  return {
    valid: true,
    data: obj as unknown as TempoBackup,
    summary: {
      tasksCount: obj.tasks.length,
      projectsCount: obj.projects.length,
      sessionsCount: obj.focusSessions.length,
    },
  };
}

interface StorageEntrySnapshot {
  key: string;
  existed: boolean;
  previousValue: string | null;
}

/**
 * Restores a validated TEMPO backup cleanly and atomically into localStorage.
 * Captures a full snapshot before mutating storage and performs a defensive rollback if any write fails.
 * Clears transient runtime recovery snapshots and active task tracking on success.
 * Returns true if successful, false otherwise.
 */
export function importTempoData(backup: TempoBackup): boolean {
  if (typeof window === 'undefined') return false;

  const targetKeys = [
    TASKS_STORAGE_KEY,
    PROJECTS_STORAGE_KEY,
    SESSIONS_STORAGE_KEY,
    SETTINGS_STORAGE_KEY,
    ACTIVE_SESSION_STORAGE_KEY,
    ACTIVE_TASK_KEY,
  ];

  // A. Capture snapshot of all keys before modifying any storage
  const snapshot: StorageEntrySnapshot[] = targetKeys.map((key) => {
    try {
      const val = localStorage.getItem(key);
      return {
        key,
        existed: val !== null,
        previousValue: val,
      };
    } catch {
      return {
        key,
        existed: false,
        previousValue: null,
      };
    }
  });

  // B. Perform writes inside try/catch
  try {
    // 1. Replace tasks
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(backup.tasks));

    // 2. Replace projects
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(backup.projects));

    // 3. Replace sessions
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(backup.focusSessions));

    // 4. Replace settings
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(backup.settings));

    // 5. Clear transient runtime recovery state
    saveActiveSessionRuntime(null);

    // 6. Clear active task state
    setActiveTaskId(null);

    // E. Only dispatch events after ALL writes have successfully completed
    window.dispatchEvent(new CustomEvent('tempo_tasks_updated'));
    window.dispatchEvent(new CustomEvent('tempo_projects_updated'));
    window.dispatchEvent(new CustomEvent('tempo_sessions_updated'));
    window.dispatchEvent(new CustomEvent('tempo_settings_updated', { detail: backup.settings }));

    return true;
  } catch (err) {
    console.error('Failed to import TEMPO backup, rolling back storage changes', err);

    // C. Defensive Rollback: restore every modified key from the snapshot
    for (const entry of snapshot) {
      try {
        if (entry.existed && entry.previousValue !== null) {
          localStorage.setItem(entry.key, entry.previousValue);
        } else {
          localStorage.removeItem(entry.key);
        }
      } catch (rollbackErr) {
        console.error(`Rollback error for key ${entry.key}`, rollbackErr);
      }
    }

    return false;
  }
}
