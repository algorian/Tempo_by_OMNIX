import { FocusSession } from '../types';

export const SESSIONS_STORAGE_KEY = 'tempo_focus_sessions';
export const ACTIVE_SESSION_STORAGE_KEY = 'tempo_active_session_runtime';

export interface ActiveSessionRuntime {
  session: FocusSession;
  accumulatedElapsed: number; // seconds spent running before current startTimestamp
  startTimestamp: number | null; // epoch ms when current running tick began
  pauseStartTimestamp: number | null; // epoch ms when pause began
  pausedDuration: number; // accumulated pause time in seconds
  lastUpdated: number; // epoch ms
}

/**
 * Retrieve all real persisted user sessions from localStorage.
 * Fabricated demo sessions are strictly excluded from real productivity metrics.
 */
export function getAllSessions(): FocusSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    // Filter out any legacy baseline/mock/corrupted sessions to ensure data integrity
    const realSessions = parsed.filter(
      (s: FocusSession) =>
        s &&
        typeof s === 'object' &&
        typeof s.id === 'string' &&
        !s.id.startsWith('session-baseline-') &&
        !s.id.startsWith('demo-') &&
        !s.id.startsWith('mock-') &&
        !s.id.startsWith('seed-') &&
        !s.id.startsWith('sample-') &&
        !s.id.startsWith('fake-') &&
        typeof s.startedAt === 'number' &&
        !isNaN(s.startedAt)
    );
    // If legacy sessions were found and cleaned, rewrite clean data
    if (realSessions.length !== parsed.length) {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(realSessions));
    }
    return realSessions;
  } catch {
    return [];
  }
}

/**
 * Save a session record to permanent history
 */
export function saveSession(session: FocusSession): void {
  try {
    const current = getAllSessions();
    const existingIndex = current.findIndex((s) => s.id === session.id);
    let updated: FocusSession[];

    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = session;
    } else {
      updated = [session, ...current];
    }

    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tempo_sessions_updated'));
    }
  } catch (err) {
    console.error('Failed to save session to localStorage', err);
  }
}

/**
 * Check if a timestamp occurred today in local time
 */
export function isToday(timestamp: number): boolean {
  const d = new Date(timestamp);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

/**
 * Check if a timestamp occurred in the current calendar week (starting Monday)
 */
export function isThisWeek(timestamp: number): boolean {
  const date = new Date(timestamp);
  const now = new Date();
  const dayOfWeek = (now.getDay() + 6) % 7; // Monday = 0
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday.getTime() + 7 * 86400000);

  return date >= monday && date < sunday;
}

/**
 * Get sessions completed/started today
 */
export function getTodaySessions(): FocusSession[] {
  const all = getAllSessions();
  return all.filter((s) => isToday(s.startedAt));
}

/**
 * Get sessions for the current week
 */
export function getThisWeekSessions(): FocusSession[] {
  const all = getAllSessions();
  return all.filter((s) => isThisWeek(s.startedAt));
}

/**
 * Compute Today Focus Metrics from stored session data.
 * IMPORTANT: Breaks do NOT count towards Focus Time or Focus Sessions.
 */
export function calculateTodayFocusMetrics(): {
  focusTimeString: string;
  sessionCount: number;
  totalFocusSeconds: number;
} {
  const todaySessions = getTodaySessions();

  // Only focus sessions that were completed or finished early count
  const validFocusSessions = todaySessions.filter(
    (s) =>
      s.mode === 'focus' &&
      (s.status === 'completed' || s.completionReason === 'completed' || s.completionReason === 'finishedEarly')
  );

  const totalFocusSeconds = validFocusSessions.reduce(
    (acc, s) => acc + (s.actualDuration || 0),
    0
  );

  const hours = Math.floor(totalFocusSeconds / 3600);
  const minutes = Math.floor((totalFocusSeconds % 3600) / 60);

  const focusTimeString =
    hours > 0
      ? `${hours}h ${minutes > 0 ? `${minutes}m` : '0m'}`
      : `${minutes}m`;

  return {
    focusTimeString,
    sessionCount: validFocusSessions.length,
    totalFocusSeconds,
  };
}

/**
 * Save active session runtime state for crash / page refresh recovery
 */
export function saveActiveSessionRuntime(runtime: ActiveSessionRuntime | null): void {
  try {
    if (!runtime) {
      localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
    } else {
      localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, JSON.stringify(runtime));
    }
  } catch (err) {
    console.warn('Failed to save active session runtime', err);
  }
}

/**
 * Retrieve active session runtime state for recovery
 */
export function getActiveSessionRuntime(): ActiveSessionRuntime | null {
  try {
    const raw = localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.session && typeof parsed.accumulatedElapsed === 'number') {
      const sid = parsed.session.id || '';
      if (
        sid.startsWith('demo-') ||
        sid.startsWith('mock-') ||
        sid.startsWith('seed-') ||
        sid.startsWith('sample-') ||
        sid.startsWith('fake-') ||
        sid.startsWith('session-baseline-')
      ) {
        localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
        return null;
      }
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}
