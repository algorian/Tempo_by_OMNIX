import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  TimerMode,
  TimerStatus,
  FocusSession,
  SessionConfig,
  FocusCompletionReason,
  Task,
} from '../types';
import {
  saveSession,
  saveActiveSessionRuntime,
  getActiveSessionRuntime,
  ActiveSessionRuntime,
} from '../utils/sessionStorage';
import {
  getActiveTaskId,
  setActiveTaskId,
  getTaskById,
} from '../utils/taskStorage';
import { getSettings, AppSettings } from '../utils/settingsStorage';
import { playCompletionChime, unlockAudio } from '../utils/audio';

export const MODE_DURATIONS: Record<TimerMode, number> = {
  focus: 50 * 60,       // Fallback 50 minutes = 3000s
  shortBreak: 10 * 60,  // Fallback 10 minutes = 600s
  longBreak: 20 * 60,   // Fallback 20 minutes = 1200s
};

export function getModeDuration(mode: TimerMode, settings: AppSettings = getSettings()): number {
  switch (mode) {
    case 'focus':
      return (settings.focusDurationMinutes || 50) * 60;
    case 'shortBreak':
      return (settings.shortBreakDurationMinutes || 10) * 60;
    case 'longBreak':
      return (settings.longBreakDurationMinutes || 20) * 60;
  }
}

export interface InterruptedSessionState {
  session: FocusSession;
  elapsedSeconds: number;
  remainingSeconds: number;
  isElapsedPastPlanned: boolean;
  totalPaused: number;
}

export interface UseTimerOptions {
  onSessionComplete?: (session: FocusSession) => void;
}

export function useTimer(options: UseTimerOptions = {}) {
  const { onSessionComplete } = options;

  // Modals & UI states
  const [isFinishEarlyModalOpen, setIsFinishEarlyModalOpen] = useState(false);
  const [completedSessionForModal, setCompletedSessionForModal] = useState<FocusSession | null>(null);
  const [taskChangePending, setTaskChangePending] = useState<{
    targetTask: Task | null;
    wasRunning: boolean;
  } | null>(null);

  // Settings ref to track active user preferences without causing unnecessary re-renders
  const settingsRef = useRef<AppSettings>(getSettings());

  // Track whether audio chime has already played for the current session completion
  const hasPlayedChimeRef = useRef<string | null>(null);

  // Check for interrupted session snapshot on initial mount
  const [interruptedSession, setInterruptedSession] = useState<InterruptedSessionState | null>(() => {
    try {
      const saved = getActiveSessionRuntime();
      if (
        saved &&
        saved.session &&
        typeof saved.accumulatedElapsed === 'number' &&
        typeof saved.session.plannedDuration === 'number' &&
        saved.session.plannedDuration > 0 &&
        !saved.session.completedAt
      ) {
        const now = Date.now();
        let totalElapsed = saved.accumulatedElapsed;
        let totalPaused = saved.pausedDuration || 0;

        if (saved.startTimestamp !== null) {
          totalElapsed += Math.max(0, (now - saved.startTimestamp) / 1000);
        } else if (saved.pauseStartTimestamp !== null) {
          totalPaused += Math.max(0, (now - saved.pauseStartTimestamp) / 1000);
        }

        const isElapsedPastPlanned = totalElapsed >= saved.session.plannedDuration;
        const remaining = Math.max(0, Math.ceil(saved.session.plannedDuration - totalElapsed));

        return {
          session: saved.session,
          elapsedSeconds: totalElapsed,
          remainingSeconds: remaining,
          isElapsedPastPlanned,
          totalPaused,
        };
      }
      // If corrupted or invalid, safely clear
      if (saved) {
        saveActiveSessionRuntime(null);
      }
      return null;
    } catch {
      saveActiveSessionRuntime(null);
      return null;
    }
  });

  // Initialize from settings
  const [initialData] = useState(() => {
    const settings = getSettings();
    const plannedDuration = getModeDuration('focus', settings);
    const now = Date.now();

    const activeTaskId = getActiveTaskId();
    const activeTask = activeTaskId ? getTaskById(activeTaskId) : null;

    const defaultSession: FocusSession = {
      id: `session-${now}`,
      mode: 'focus',
      status: 'paused',
      taskId: activeTask ? activeTask.id : null,
      projectId: activeTask ? activeTask.projectId : null,
      subject: activeTask ? `${activeTask.subject} — ${activeTask.title}` : 'Focus Session',
      category: activeTask ? activeTask.subject : 'General',
      tag: 'DEEP WORK',
      plannedDuration,
      actualDuration: 0,
      startedAt: now,
      pausedDuration: 0,
      completedAt: null,
      completionReason: null,
    };

    return {
      session: defaultSession,
      status: 'paused' as TimerStatus,
      accumulatedElapsed: 0,
      startTimestamp: null,
      pauseStartTimestamp: null,
      pausedDuration: 0,
      remainingSeconds: plannedDuration,
    };
  });

  const [session, setSession] = useState<FocusSession>(initialData.session);
  const [status, setStatus] = useState<TimerStatus>(initialData.status);
  const [displaySeconds, setDisplaySeconds] = useState<number>(initialData.remainingSeconds);

  // Runtime tracking refs (timestamp source of truth)
  const accumulatedRef = useRef<number>(initialData.accumulatedElapsed);
  const startTimestampRef = useRef<number | null>(initialData.startTimestamp);
  const pauseStartTimestampRef = useRef<number | null>(initialData.pauseStartTimestamp);
  const pausedDurationRef = useRef<number>(initialData.pausedDuration);
  const statusRef = useRef<TimerStatus>(initialData.status);
  const sessionRef = useRef<FocusSession>(initialData.session);

  // Keep statusRef and sessionRef in sync with state
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  // Listen to Settings updates
  useEffect(() => {
    const handleSettingsUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<AppSettings>;
      const newSettings = customEvent.detail || getSettings();
      settingsRef.current = newSettings;

      // Only update unstarted, fresh session defaults.
      // Do NOT alter a session that is currently running or has accumulated focus time.
      if (statusRef.current !== 'focus' && accumulatedRef.current === 0) {
        setSession((prev) => {
          if (prev.mode === 'focus') {
            const newDuration = getModeDuration('focus', newSettings);
            setDisplaySeconds(newDuration);
            return { ...prev, plannedDuration: newDuration };
          } else if (prev.mode === 'shortBreak') {
            const newDuration = getModeDuration('shortBreak', newSettings);
            setDisplaySeconds(newDuration);
            return { ...prev, plannedDuration: newDuration };
          } else if (prev.mode === 'longBreak') {
            const newDuration = getModeDuration('longBreak', newSettings);
            setDisplaySeconds(newDuration);
            return { ...prev, plannedDuration: newDuration };
          }
          return prev;
        });
      }
    };

    window.addEventListener('tempo_settings_updated', handleSettingsUpdate);
    return () => {
      window.removeEventListener('tempo_settings_updated', handleSettingsUpdate);
    };
  }, []);

  // Authoritative session progress: clamped strictly between 0 and 1
  const progress = useMemo(() => {
    if (status === 'completed') return 1;
    if (!session.plannedDuration || session.plannedDuration <= 0) return 0;
    const elapsed = Math.max(0, session.plannedDuration - displaySeconds);
    const ratio = elapsed / session.plannedDuration;
    if (isNaN(ratio) || !isFinite(ratio)) return 0;
    return Math.max(0, Math.min(1, ratio));
  }, [status, session.plannedDuration, displaySeconds]);

  // Millisecond-precision exact progress query for smooth continuous visual interpolation
  const getExactProgress = useCallback(() => {
    if (status === 'completed') return 1;
    if (!session.plannedDuration || session.plannedDuration <= 0) return 0;
    if (status === 'paused') {
      const elapsed = accumulatedRef.current;
      return Math.max(0, Math.min(1, elapsed / session.plannedDuration));
    }
    if (startTimestampRef.current === null) {
      const elapsed = session.plannedDuration - displaySeconds;
      return Math.max(0, Math.min(1, elapsed / session.plannedDuration));
    }
    const now = Date.now();
    const currentInterval = (now - startTimestampRef.current) / 1000;
    const elapsed = accumulatedRef.current + currentInterval;
    return Math.max(0, Math.min(1, elapsed / session.plannedDuration));
  }, [status, session.plannedDuration, displaySeconds]);

  // Sync active runtime state to localStorage for refresh recovery
  const syncRuntimeToStorage = useCallback(() => {
    if (status === 'completed') {
      saveActiveSessionRuntime(null);
      return;
    }

    // Only save if session is running or has accumulated time
    if (status === 'focus' || accumulatedRef.current > 0) {
      const runtime: ActiveSessionRuntime = {
        session,
        accumulatedElapsed: accumulatedRef.current,
        startTimestamp: startTimestampRef.current,
        pauseStartTimestamp: pauseStartTimestampRef.current,
        pausedDuration: pausedDurationRef.current,
        lastUpdated: Date.now(),
      };
      saveActiveSessionRuntime(runtime);
    }
  }, [session, status]);

  // Periodic persistence and beforeunload handler
  useEffect(() => {
    syncRuntimeToStorage();
    const interval = setInterval(syncRuntimeToStorage, 3000);

    const handleBeforeUnload = () => {
      if (status === 'focus' && startTimestampRef.current !== null) {
        const now = Date.now();
        accumulatedRef.current += (now - startTimestampRef.current) / 1000;
        startTimestampRef.current = now;
      }
      syncRuntimeToStorage();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [status, syncRuntimeToStorage]);

  // Tick update function
  const updateTick = useCallback(() => {
    if (status !== 'focus' || startTimestampRef.current === null) {
      return;
    }

    const now = Date.now();
    const currentIntervalSeconds = (now - startTimestampRef.current) / 1000;
    const currentTotalElapsed = accumulatedRef.current + currentIntervalSeconds;

    if (currentTotalElapsed >= session.plannedDuration) {
      // Reached 00:00 -> Completed
      accumulatedRef.current = session.plannedDuration;
      startTimestampRef.current = null;
      setDisplaySeconds(0);
      setStatus('completed');

      // Acoustic completion chime: triggered exactly once per session completion
      if (hasPlayedChimeRef.current !== session.id) {
        hasPlayedChimeRef.current = session.id;
        if (settingsRef.current.soundEnabled) {
          playCompletionChime();
        }
      }

      const completedSession: FocusSession = {
        ...session,
        status: 'completed',
        completionReason: 'completed',
        actualDuration: session.plannedDuration,
        completedAt: now,
        pausedDuration: Math.round(pausedDurationRef.current),
      };

      setSession(completedSession);
      saveSession(completedSession);
      saveActiveSessionRuntime(null);
      setActiveTaskId(null);
      setCompletedSessionForModal(completedSession);

      if (onSessionComplete) {
        onSessionComplete(completedSession);
      }
    } else {
      const remaining = Math.max(0, Math.ceil(session.plannedDuration - currentTotalElapsed));
      setDisplaySeconds(remaining);
    }
  }, [session, status, onSessionComplete]);

  // RequestAnimationFrame loop + tab visibility fallback
  useEffect(() => {
    if (status !== 'focus') return;

    let animId: number;
    let isRunning = true;

    const loop = () => {
      if (!isRunning) return;
      updateTick();
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    const fallbackInterval = setInterval(() => {
      updateTick();
    }, 1000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateTick();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isRunning = false;
      cancelAnimationFrame(animId);
      clearInterval(fallbackInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [status, updateTick]);

  // Pause session
  const pause = useCallback(() => {
    unlockAudio();
    if (status === 'focus' && startTimestampRef.current !== null) {
      const now = Date.now();
      accumulatedRef.current += (now - startTimestampRef.current) / 1000;
      startTimestampRef.current = null;
      pauseStartTimestampRef.current = now;

      setStatus('paused');
      setSession((prev) => ({ ...prev, status: 'paused' }));
    }
  }, [status]);

  // Resume session
  const resume = useCallback(() => {
    unlockAudio();
    if (status === 'paused' || status === 'completed') {
      const now = Date.now();
      if (pauseStartTimestampRef.current !== null) {
        pausedDurationRef.current += (now - pauseStartTimestampRef.current) / 1000;
        pauseStartTimestampRef.current = null;
      }
      startTimestampRef.current = now;

      setStatus('focus');
      setSession((prev) => ({
        ...prev,
        status: 'running',
        pausedDuration: Math.round(pausedDurationRef.current),
      }));
    }
  }, [status]);

  // Trigger Finish: If countdown hasn't reached 0, confirm Finish Early
  const requestFinish = useCallback(() => {
    unlockAudio();
    if (status === 'completed') return;

    if (displaySeconds > 0) {
      if (status === 'focus') {
        pause();
      }
      setIsFinishEarlyModalOpen(true);
    } else {
      updateTick();
    }
  }, [displaySeconds, status, pause, updateTick]);

  // User confirms "Finish session early"
  const confirmFinishEarly = useCallback(() => {
    unlockAudio();
    setIsFinishEarlyModalOpen(false);
    const now = Date.now();
    const actualFocused = Math.max(1, Math.round(accumulatedRef.current));

    startTimestampRef.current = null;
    pauseStartTimestampRef.current = null;
    setDisplaySeconds(0);
    setStatus('completed');

    if (hasPlayedChimeRef.current !== session.id) {
      hasPlayedChimeRef.current = session.id;
      if (settingsRef.current.soundEnabled) {
        playCompletionChime();
      }
    }

    const finishedSession: FocusSession = {
      ...session,
      status: 'completed',
      completionReason: 'finishedEarly',
      actualDuration: actualFocused,
      completedAt: now,
      pausedDuration: Math.round(pausedDurationRef.current),
    };

    setSession(finishedSession);
    saveSession(finishedSession);
    saveActiveSessionRuntime(null);
    setActiveTaskId(null);
    setCompletedSessionForModal(finishedSession);

    if (onSessionComplete) {
      onSessionComplete(finishedSession);
    }
  }, [session, onSessionComplete]);

  // User chooses "Continue" in finish early dialog
  const cancelFinishEarly = useCallback(() => {
    setIsFinishEarlyModalOpen(false);
    resume();
  }, [resume]);

  // Start focus directly from a task
  const startFocusWithTask = useCallback(
    (task: Task, customSeconds?: number) => {
      const now = Date.now();
      const settings = settingsRef.current;
      const duration =
        customSeconds ??
        (task.estimatedMinutes
          ? task.estimatedMinutes * 60
          : getModeDuration('focus', settings));

      hasPlayedChimeRef.current = null;
      accumulatedRef.current = 0;
      startTimestampRef.current = now;
      pauseStartTimestampRef.current = null;
      pausedDurationRef.current = 0;

      const newSession: FocusSession = {
        id: `session-${now}`,
        mode: 'focus',
        status: 'running',
        taskId: task.id,
        projectId: task.projectId || null,
        subject: `${task.subject} — ${task.title}`,
        category: task.subject,
        tag: 'DEEP WORK',
        plannedDuration: duration,
        actualDuration: 0,
        startedAt: now,
        pausedDuration: 0,
        completedAt: null,
        completionReason: null,
      };

      setSession(newSession);
      setDisplaySeconds(duration);
      setStatus('focus');
      setActiveTaskId(task.id);

      saveActiveSessionRuntime({
        session: newSession,
        accumulatedElapsed: 0,
        startTimestamp: now,
        pauseStartTimestamp: null,
        pausedDuration: 0,
        lastUpdated: now,
      });
    },
    []
  );

  // Select/associate a task: if a focus session is active, prompt confirmation before changing
  const selectTask = useCallback(
    (targetTask: Task | null) => {
      const currentTaskId = sessionRef.current.taskId ?? null;
      const targetTaskId = targetTask?.id ?? null;
      if (currentTaskId === targetTaskId) return;

      const isSessionActive =
        statusRef.current === 'focus' ||
        (statusRef.current === 'paused' && accumulatedRef.current > 0);

      if (!isSessionActive) {
        // Idle/unstarted: change immediately without confirmation
        if (!targetTask) {
          setSession((prev) => ({
            ...prev,
            taskId: null,
            projectId: null,
            subject: 'Focus Session',
            category: 'General',
          }));
          setActiveTaskId(null);
        } else {
          const planned =
            sessionRef.current.mode === 'focus' && targetTask.estimatedMinutes
              ? targetTask.estimatedMinutes * 60
              : sessionRef.current.plannedDuration;
          setSession((prev) => ({
            ...prev,
            taskId: targetTask.id,
            projectId: targetTask.projectId || null,
            subject: `${targetTask.subject} — ${targetTask.title}`,
            category: targetTask.subject,
            plannedDuration: planned,
          }));
          setDisplaySeconds(planned);
          setActiveTaskId(targetTask.id);
        }
        return;
      }

      // Active session: pause running timer and show confirmation dialog
      const wasRunning = statusRef.current === 'focus';
      if (wasRunning) {
        pause();
      }
      setTaskChangePending({
        targetTask,
        wasRunning,
      });
    },
    [pause]
  );

  // Confirm task switch: finishes current session cleanly and starts new session
  const confirmTaskChangeStartNew = useCallback(() => {
    if (!taskChangePending) return;
    const targetTask = taskChangePending.targetTask;
    setTaskChangePending(null);

    // 1. Finish current session using existing completion semantics
    const now = Date.now();
    const actualFocused = Math.max(1, Math.round(accumulatedRef.current));
    const currentSession = sessionRef.current;

    const finishedSession: FocusSession = {
      ...currentSession,
      status: 'completed',
      completionReason: 'finishedEarly',
      actualDuration: actualFocused,
      completedAt: now,
      pausedDuration: Math.round(pausedDurationRef.current),
    };

    saveSession(finishedSession);
    saveActiveSessionRuntime(null);

    // 2. Start new session cleanly for targetTask
    const settings = settingsRef.current;
    const duration = targetTask
      ? targetTask.estimatedMinutes
        ? targetTask.estimatedMinutes * 60
        : getModeDuration('focus', settings)
      : getModeDuration('focus', settings);

    hasPlayedChimeRef.current = null;
    accumulatedRef.current = 0;
    startTimestampRef.current = now;
    pauseStartTimestampRef.current = null;
    pausedDurationRef.current = 0;

    const newSession: FocusSession = {
      id: `session-${now}`,
      mode: 'focus',
      status: 'running',
      taskId: targetTask ? targetTask.id : null,
      projectId: targetTask ? targetTask.projectId || null : null,
      subject: targetTask ? `${targetTask.subject} — ${targetTask.title}` : 'Focus Session',
      category: targetTask ? targetTask.subject : 'General',
      tag: 'DEEP WORK',
      plannedDuration: duration,
      actualDuration: 0,
      startedAt: now,
      pausedDuration: 0,
      completedAt: null,
      completionReason: null,
    };

    setSession(newSession);
    setDisplaySeconds(duration);
    setStatus('focus');
    setActiveTaskId(targetTask ? targetTask.id : null);

    saveActiveSessionRuntime({
      session: newSession,
      accumulatedElapsed: 0,
      startTimestamp: now,
      pauseStartTimestamp: null,
      pausedDuration: 0,
      lastUpdated: now,
    });
  }, [taskChangePending]);

  // Keep current session running on existing task
  const keepCurrentSession = useCallback(() => {
    const wasRunning = taskChangePending?.wasRunning;
    setTaskChangePending(null);
    if (wasRunning) {
      resume();
    }
  }, [taskChangePending, resume]);

  // Cancel task change dialog
  const cancelTaskChange = useCallback(() => {
    const wasRunning = taskChangePending?.wasRunning;
    setTaskChangePending(null);
    if (wasRunning) {
      resume();
    }
  }, [taskChangePending, resume]);

  // Listen for external task focus triggers (e.g. [Start Focus] from task items)
  useEffect(() => {
    const handleStartFocusEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ task: Task; duration?: number }>;
      if (customEvent.detail?.task) {
        const targetTask = customEvent.detail.task;
        const currentTaskId = sessionRef.current.taskId ?? null;
        if (currentTaskId === targetTask.id) return;

        const isSessionActive =
          statusRef.current === 'focus' ||
          (statusRef.current === 'paused' && accumulatedRef.current > 0);

        if (isSessionActive) {
          const wasRunning = statusRef.current === 'focus';
          if (wasRunning) {
            pause();
          }
          setTaskChangePending({
            targetTask,
            wasRunning,
          });
        } else {
          startFocusWithTask(targetTask, customEvent.detail.duration);
        }
      }
    };

    window.addEventListener('tempo_start_focus_task', handleStartFocusEvent);
    return () => {
      window.removeEventListener('tempo_start_focus_task', handleStartFocusEvent);
    };
  }, [pause, startFocusWithTask]);

  // Reset or start a new session
  const reset = useCallback(
    (customDuration?: number, customMode?: TimerMode) => {
      const newMode = customMode ?? session.mode;
      const duration = customDuration ?? getModeDuration(newMode, settingsRef.current);
      const now = Date.now();

      hasPlayedChimeRef.current = null;
      accumulatedRef.current = 0;
      startTimestampRef.current = null;
      pauseStartTimestampRef.current = null;
      pausedDurationRef.current = 0;
      setActiveTaskId(null);

      const newSession: FocusSession = {
        id: `session-${now}`,
        mode: newMode,
        status: 'paused',
        taskId: newMode === 'focus' ? session.taskId : null,
        projectId: session.projectId,
        subject:
          newMode === 'focus'
            ? session.subject
            : newMode === 'shortBreak'
            ? 'Short Break — Recharge'
            : 'Long Break — Decompress',
        category: newMode === 'focus' ? session.category : 'Break',
        tag: newMode === 'focus' ? 'DEEP WORK' : 'RECHARGE',
        plannedDuration: duration,
        actualDuration: 0,
        startedAt: now,
        pausedDuration: 0,
        completedAt: null,
        completionReason: null,
      };

      setSession(newSession);
      setDisplaySeconds(duration);
      setStatus('paused');
      saveActiveSessionRuntime(null);
    },
    [session]
  );

  // Switch mode
  const switchMode = useCallback(
    (newMode: TimerMode, customDuration?: number) => {
      const duration = customDuration ?? getModeDuration(newMode, settingsRef.current);
      const now = Date.now();

      hasPlayedChimeRef.current = null;
      accumulatedRef.current = 0;
      startTimestampRef.current = null;
      pauseStartTimestampRef.current = null;
      pausedDurationRef.current = 0;

      const newSession: FocusSession = {
        id: `session-${now}`,
        mode: newMode,
        status: 'paused',
        taskId: newMode === 'focus' ? session.taskId : null,
        projectId: newMode === 'focus' ? session.projectId : null,
        subject:
          newMode === 'focus'
            ? session.subject || 'Focus Session'
            : newMode === 'shortBreak'
            ? 'Short Break — Recharge'
            : 'Long Break — Rest',
        category: newMode === 'focus' ? session.category || 'General' : 'Break',
        tag: newMode === 'focus' ? 'DEEP WORK' : 'RECHARGE',
        plannedDuration: duration,
        actualDuration: 0,
        startedAt: now,
        pausedDuration: 0,
        completedAt: null,
        completionReason: null,
      };

      setSession(newSession);
      setDisplaySeconds(duration);
      setStatus('paused');
      saveActiveSessionRuntime(null);
    },
    [session]
  );

  // Development test mode session setter (e.g. 15s or 30s)
  const setDevTestDuration = useCallback(
    (seconds: number) => {
      const now = Date.now();
      hasPlayedChimeRef.current = null;
      accumulatedRef.current = 0;
      startTimestampRef.current = now;
      pauseStartTimestampRef.current = null;
      pausedDurationRef.current = 0;

      const devSession: FocusSession = {
        id: `session-dev-${now}`,
        mode: 'focus',
        status: 'running',
        taskId: session.taskId || null,
        projectId: session.projectId || null,
        subject: session.taskId ? session.subject : 'Focus Session (Test)',
        category: session.category || 'General',
        tag: 'DEV TEST',
        plannedDuration: seconds,
        actualDuration: 0,
        startedAt: now,
        pausedDuration: 0,
        completedAt: null,
        completionReason: null,
      };

      setSession(devSession);
      setDisplaySeconds(seconds);
      setStatus('focus');
    },
    []
  );

  // Session Recovery: Resume interrupted session
  const resumeInterruptedSession = useCallback(() => {
    if (!interruptedSession) return;
    const { session: recoveredSession, elapsedSeconds, remainingSeconds, isElapsedPastPlanned, totalPaused } = interruptedSession;

    setInterruptedSession(null);

    if (isElapsedPastPlanned) {
      // Reached zero while page was closed
      const now = Date.now();
      const finishedSession: FocusSession = {
        ...recoveredSession,
        status: 'completed',
        completionReason: 'completed',
        actualDuration: recoveredSession.plannedDuration,
        completedAt: now,
        pausedDuration: Math.round(totalPaused),
      };

      if (hasPlayedChimeRef.current !== finishedSession.id) {
        hasPlayedChimeRef.current = finishedSession.id;
        if (settingsRef.current.soundEnabled) {
          playCompletionChime();
        }
      }

      setSession(finishedSession);
      saveSession(finishedSession);
      saveActiveSessionRuntime(null);
      setActiveTaskId(null);
      setCompletedSessionForModal(finishedSession);
      setDisplaySeconds(0);
      setStatus('completed');

      if (onSessionComplete) {
        onSessionComplete(finishedSession);
      }
    } else {
      // Resume active session
      const now = Date.now();
      accumulatedRef.current = elapsedSeconds;
      pausedDurationRef.current = totalPaused;
      startTimestampRef.current = now;
      pauseStartTimestampRef.current = null;

      const activeSession: FocusSession = {
        ...recoveredSession,
        status: 'running',
        pausedDuration: Math.round(totalPaused),
      };

      setSession(activeSession);
      setDisplaySeconds(remainingSeconds);
      setStatus('focus');
      if (recoveredSession.taskId) {
        setActiveTaskId(recoveredSession.taskId);
      }

      saveActiveSessionRuntime({
        session: activeSession,
        accumulatedElapsed: elapsedSeconds,
        startTimestamp: now,
        pauseStartTimestamp: null,
        pausedDuration: totalPaused,
        lastUpdated: now,
      });
    }
  }, [interruptedSession, onSessionComplete]);

  // Session Recovery: End interrupted session early and log actual elapsed time
  const endInterruptedSession = useCallback(() => {
    if (!interruptedSession) return;
    const { session: recoveredSession, elapsedSeconds, totalPaused } = interruptedSession;

    const actualFocused = Math.max(1, Math.min(recoveredSession.plannedDuration, Math.round(elapsedSeconds)));
    const isCompleted = actualFocused >= recoveredSession.plannedDuration;
    const now = Date.now();

    const finishedSession: FocusSession = {
      ...recoveredSession,
      status: 'completed',
      completionReason: isCompleted ? 'completed' : 'finishedEarly',
      actualDuration: actualFocused,
      completedAt: now,
      pausedDuration: Math.round(totalPaused),
    };

    saveSession(finishedSession);
    saveActiveSessionRuntime(null);
    setActiveTaskId(null);
    setInterruptedSession(null);

    // Reset to fresh default session
    reset();

    if (onSessionComplete) {
      onSessionComplete(finishedSession);
    }
  }, [interruptedSession, reset, onSessionComplete]);

  // Session Recovery: Dismiss snapshot without saving fake data
  const dismissInterruptedSession = useCallback(() => {
    saveActiveSessionRuntime(null);
    setInterruptedSession(null);
    reset();
  }, [reset]);

  // Close completed modal
  const dismissCompletedModal = useCallback(() => {
    setCompletedSessionForModal(null);
  }, []);

  // Formatted string (mm:ss)
  const minutes = Math.floor(displaySeconds / 60);
  const seconds = displaySeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // SessionConfig projection for existing OrbitClock / header
  const sessionConfig: SessionConfig = {
    id: session.id,
    subject: session.subject,
    category: session.category,
    tag: session.tag,
    durationMinutes: Math.round(session.plannedDuration / 60),
    mode: session.mode,
    taskId: session.taskId,
    projectId: session.projectId,
  };

  return {
    mode: session.mode,
    status,
    session,
    sessionConfig,
    totalSeconds: session.plannedDuration,
    remainingSeconds: displaySeconds,
    formattedTime,
    progress,
    getExactProgress,
    pause,
    resume,
    finish: requestFinish,
    reset,
    switchMode,
    setDevTestDuration,
    startFocusWithTask,
    selectTask,
    // Session Recovery
    interruptedSession,
    resumeInterruptedSession,
    endInterruptedSession,
    dismissInterruptedSession,
    // Modals
    isFinishEarlyModalOpen,
    confirmFinishEarly,
    cancelFinishEarly,
    completedSessionForModal,
    dismissCompletedModal,
    // Task Change Confirmation Modal
    isTaskChangeModalOpen: Boolean(taskChangePending),
    currentAttachedTaskTitle:
      (session.taskId ? getTaskById(session.taskId)?.title : null) || session.subject || 'Independent Session',
    targetTaskTitle: taskChangePending?.targetTask ? taskChangePending.targetTask.title : 'Independent Session',
    confirmTaskChangeStartNew,
    keepCurrentSession,
    cancelTaskChange,
  };
}

