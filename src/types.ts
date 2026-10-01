export type NavSection =
  | 'today'
  | 'timer'
  | 'tasks'
  | 'projects'
  | 'analytics'
  | 'goals'
  | 'coach'
  | 'settings';

export type ProjectStatus = 'active' | 'completed' | 'archived';

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  createdAt: number;
  updatedAt: number;
}

export type TaskStatus = 'todo' | 'inProgress' | 'completed' | 'archived';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string | null;
  subject: string;
  category?: string;
  estimatedMinutes: number;
  completedAt: number | null;
  createdAt: number;
  updatedAt: number;
  // Convenience properties for backwards compatibility with existing UI
  completed: boolean;
  duration?: string;
}

export interface MetricItem {
  label: string;
  value: string;
  detail?: string;
}

export interface DayFocusData {
  day: string;
  hours: number;
  isToday?: boolean;
  isPeak?: boolean;
}

export type TimerMode = 'focus' | 'shortBreak' | 'longBreak';
export type TimerStatus = 'focus' | 'paused' | 'completed';

export type FocusSessionMode = 'focus' | 'shortBreak' | 'longBreak';
export type FocusSessionStatus = 'running' | 'paused' | 'completed' | 'cancelled';
export type FocusCompletionReason = 'completed' | 'finishedEarly' | 'cancelled';

export interface FocusSession {
  id: string;
  mode: FocusSessionMode;
  status: FocusSessionStatus;
  taskId: string | null;
  projectId: string | null;
  subject: string;
  category: string;
  tag: string;
  plannedDuration: number;    // in seconds
  actualDuration: number;     // in seconds of active focused time
  startedAt: number;          // epoch ms
  pausedDuration: number;     // in seconds
  completedAt: number | null; // epoch ms
  completionReason: FocusCompletionReason | null;
}

export interface SessionConfig {
  id: string;
  subject: string;
  category: string;
  tag: string;
  durationMinutes: number;
  mode: TimerMode;
  taskId?: string | null;
  projectId?: string | null;
}

export interface FocusCoachContext {
  today: {
    focusSeconds: number;
    sessionCount: number;
    completedTaskCount: number;
  };
  week: {
    focusSeconds: number;
    sessionCount: number;
    consistency: number;
    completionRate: number;
    planningAccuracy: number;
    deepWorkPercentage: number;
    focusScore: number;
    peakFocusHour: number | null;
  };
  current: {
    taskId: string | null;
    taskTitle: string | null;
    projectId: string | null;
    subject: string | null;
  };
}

export interface FocusCoachInsight {
  title: string;
  message: string;
  action: string | null;
}

export type AICoachStatus = 'loading' | 'available' | 'no-data' | 'error' | 'unavailable';

export type AIErrorCode =
  | 'AI_CONFIG_MISSING'
  | 'AI_AUTH_ERROR'
  | 'AI_PERMISSION_ERROR'
  | 'AI_MODEL_UNAVAILABLE'
  | 'AI_RATE_LIMITED'
  | 'AI_NETWORK_ERROR'
  | 'AI_REQUEST_ERROR'
  | 'AI_RESPONSE_ERROR'
  | 'AI_UNKNOWN_ERROR';

export interface AICoachResult {
  status: AICoachStatus;
  context: FocusCoachContext;
  insight: FocusCoachInsight | null;
  errorMessage?: string;
  errorCode?: AIErrorCode;
  diagnosticDetails?: string;
  modelUsed?: string;
}
