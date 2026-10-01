import { FocusSession } from '../types';
import { getAllSessions } from './sessionStorage';
import { getAllProjects } from './projectStorage';

export interface SubjectBreakdownItem {
  subject: string;
  totalSeconds: number;
  formatted: string;
  percentage: number;
  sessionCount: number;
}

export interface ProjectBreakdownItem {
  projectId: string;
  projectName: string;
  totalSeconds: number;
  formatted: string;
  percentage: number;
  sessionCount: number;
}

export interface DayFocusDataCalculated {
  day: string;
  hours: number;
  seconds: number;
  isToday: boolean;
  dateStr: string;
}

export interface FocusScoreBreakdown {
  consistencyScore: number;       // 0 to 100 (Weight: 30%)
  completionRateScore: number;    // 0 to 100 (Weight: 25%)
  planningAccuracyScore: number;  // 0 to 100 (Weight: 20%)
  deepWorkScore: number;          // 0 to 100 (Weight: 15%)
  focusTargetScore: number;       // 0 to 100 (Weight: 10%)
  finalFocusScore: number;        // 0 to 100
}

export interface WeeklyMetrics {
  weeklyFocusSeconds: number;
  weeklyFocusFormatted: string;
  dailyData: DayFocusDataCalculated[];
  maxHours: number;
  consistencyDays: number;
  deepWorkPercent: number;
  completionRate: number;
  planningAccuracy: number;
  focusTargetProgress: number;
  focusScore: number;
  scoreBreakdown: FocusScoreBreakdown;
}

export interface FocusProfileMetrics {
  peakFocusWindow: string;
  avgSessionFormatted: string;
  bestSessionFormatted: string;
  planningAccuracyFormatted: string;
}

export interface CoachInsights {
  hasEnoughData: boolean;
  peakWindow: string;
  mainInsight: string;
  supportingText: string;
}

/**
 * Format total seconds into human-readable duration (e.g., '2h 15m', '45m', or '0m')
 */
export function formatFocusDuration(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.round(totalSeconds || 0));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes > 0 ? `${minutes}m` : '0m'}`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  if (safeSeconds > 0) {
    return `${safeSeconds}s`;
  }
  return '0m';
}

/**
 * Format minutes into a string e.g. '45 min' or '—'
 */
export function formatMinutesWithFallback(minutes: number | null): string {
  if (minutes === null || isNaN(minutes) || minutes <= 0) {
    return '—';
  }
  return `${minutes} min`;
}

/**
 * Validate that a session record is non-corrupted and valid.
 */
export function isSessionRecordValid(s: any): s is FocusSession {
  if (!s || typeof s !== 'object') return false;
  if (typeof s.id !== 'string' || !s.id.trim()) return false;
  // Exclude any seeded / fake baseline records
  if (
    s.id.startsWith('session-baseline-') ||
    s.id.startsWith('demo-') ||
    s.id.startsWith('mock-') ||
    s.id.startsWith('seed-') ||
    s.id.startsWith('sample-') ||
    s.id.startsWith('fake-')
  ) {
    return false;
  }
  if (typeof s.startedAt !== 'number' || isNaN(s.startedAt) || s.startedAt <= 0) {
    return false;
  }
  return true;
}

/**
 * Check if a session is a valid focus session that completed or finished early with active focus.
 * BREAK SESSIONS AND CANCELLED SESSIONS ARE STRICTLY EXCLUDED.
 */
export function isValidFocusSession(s: any): s is FocusSession {
  if (!isSessionRecordValid(s)) return false;
  if (s.mode !== 'focus') return false;
  if (s.status === 'cancelled' || s.completionReason === 'cancelled') return false;

  // Must have completed normally or finished early
  const isCompleted =
    s.status === 'completed' ||
    s.completionReason === 'completed' ||
    s.completionReason === 'finishedEarly';

  if (!isCompleted) return false;

  const actual = Number(s.actualDuration);
  return typeof actual === 'number' && !isNaN(actual) && actual > 0;
}

/**
 * Check if a session was an attempted focus session that was cancelled.
 */
export function isCancelledFocusSession(s: any): s is FocusSession {
  if (!isSessionRecordValid(s)) return false;
  if (s.mode !== 'focus') return false;
  return s.status === 'cancelled' || s.completionReason === 'cancelled';
}

/**
 * Returns the start of Monday (00:00:00.000 local time) for the week containing the given date.
 * Weekly calculations use Monday -> Sunday strictly.
 */
export function getMondayOfWeek(d: Date = new Date()): Date {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = date.getDay(); // 0 is Sunday, 1 is Monday, ..., 6 is Saturday
  const mondayOffset = (day + 6) % 7; // Monday = 0, Tuesday = 1, ..., Sunday = 6
  date.setDate(date.getDate() - mondayOffset);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Attribution of a session's actual focused duration to a specific time interval [windowStartMs, windowEndMs].
 * Correctly attributes sessions crossing midnight according to their actual timestamps.
 */
export function getSessionFocusSecondsInInterval(
  session: FocusSession,
  windowStartMs: number,
  windowEndMs: number
): number {
  if (!isValidFocusSession(session)) return 0;

  const actualSec = Math.max(0, Number(session.actualDuration) || 0);
  if (actualSec <= 0) return 0;

  const startMs = session.startedAt;
  const endMs = session.completedAt && session.completedAt > startMs
    ? session.completedAt
    : startMs + actualSec * 1000;

  // Check if session span overlaps [windowStartMs, windowEndMs]
  if (endMs <= windowStartMs || startMs >= windowEndMs) {
    return 0;
  }

  const overlapStart = Math.max(startMs, windowStartMs);
  const overlapEnd = Math.min(endMs, windowEndMs);
  const overlapMs = Math.max(0, overlapEnd - overlapStart);

  if (overlapMs <= 0) return 0;

  const totalSpanMs = Math.max(1000, endMs - startMs);
  const proportion = Math.min(1, Math.max(0, overlapMs / totalSpanMs));

  // Attribute proportional actual duration to the window
  const attributed = Math.round(actualSec * proportion);
  return Math.min(actualSec, Math.max(0, attributed));
}

/**
 * Today Focus Metrics:
 * - Today Focus Time
 * - Today Sessions
 */
export function getTodayFocusMetrics(sessionsList?: FocusSession[]): {
  focusTimeString: string;
  sessionCount: number;
  totalFocusSeconds: number;
} {
  const sessions = sessionsList || getAllSessions();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
  const todayEnd = todayStart + 86400000;

  let totalFocusSeconds = 0;
  let sessionCount = 0;

  for (const s of sessions) {
    if (!isValidFocusSession(s)) continue;

    const attributed = getSessionFocusSecondsInInterval(s, todayStart, todayEnd);
    if (attributed > 0) {
      totalFocusSeconds += attributed;
      // Count session as today's session if it started today or has significant focus today
      if (s.startedAt >= todayStart && s.startedAt < todayEnd) {
        sessionCount += 1;
      } else if (sessionCount === 0 && attributed > 0) {
        sessionCount += 1;
      }
    }
  }

  return {
    focusTimeString: formatFocusDuration(totalFocusSeconds),
    sessionCount,
    totalFocusSeconds,
  };
}

/**
 * Calculate Planning Accuracy bounded strictly between 0 and 100.
 * Planning accuracy cannot exceed 100%.
 */
export function calculatePlanningAccuracy(focusSessions: FocusSession[]): number {
  const validSessions = focusSessions.filter(
    (s) => isValidFocusSession(s) && (s.plannedDuration || 0) > 0
  );

  if (validSessions.length === 0) return 0;

  let totalPlanned = 0;
  let totalActualClamped = 0;

  for (const s of validSessions) {
    const planned = Math.max(0, Number(s.plannedDuration) || 0);
    const actual = Math.max(0, Number(s.actualDuration) || 0);

    totalPlanned += planned;
    // Cap each session's credit at planned duration so overshooting doesn't exceed 100%
    totalActualClamped += Math.min(actual, planned);
  }

  if (totalPlanned <= 0) return 0;

  const rawPercent = (totalActualClamped / totalPlanned) * 100;
  return Math.min(100, Math.max(0, Math.round(rawPercent)));
}

/**
 * Calculate Completion Rate bounded strictly between 0 and 100.
 * Cancelled sessions count in denominator.
 */
export function calculateCompletionRate(sessions: FocusSession[]): number {
  const completedFocus = sessions.filter(isValidFocusSession).length;
  const cancelledFocus = sessions.filter(isCancelledFocusSession).length;
  const totalAttempted = completedFocus + cancelledFocus;

  if (totalAttempted <= 0) return 0;

  const rawPercent = (completedFocus / totalAttempted) * 100;
  return Math.min(100, Math.max(0, Math.round(rawPercent)));
}

/**
 * Calculate Deep Work Percentage bounded strictly between 0 and 100.
 * Focus sessions >= 25 minutes (1500s) or explicitly tagged 'DEEP WORK'.
 */
export function calculateDeepWorkPercentage(validFocusSessions: FocusSession[]): number {
  if (validFocusSessions.length === 0) return 0;

  let totalFocusSeconds = 0;
  let deepWorkSeconds = 0;

  for (const s of validFocusSessions) {
    const actual = Math.max(0, Number(s.actualDuration) || 0);
    totalFocusSeconds += actual;

    // Deep work criterion: >= 25 minutes (1500 seconds) or tagged 'DEEP WORK'
    if (actual >= 1500 || s.tag === 'DEEP WORK') {
      deepWorkSeconds += actual;
    }
  }

  if (totalFocusSeconds <= 0) return 0;

  const rawPercent = (deepWorkSeconds / totalFocusSeconds) * 100;
  return Math.min(100, Math.max(0, Math.round(rawPercent)));
}

/**
 * Calculate Focus Score exactly according to the mandated formula:
 * Consistency × 0.30
 * +
 * Completion Rate × 0.25
 * +
 * Planning Accuracy × 0.20
 * +
 * Deep Work Percentage × 0.15
 * +
 * Focus Target Progress × 0.10
 *
 * All score components are bounded between 0 and 100.
 * The final Focus Score is bounded between 0 and 100.
 */
export function calculateFocusScore(components: {
  consistency: number;        // 0 to 100
  completionRate: number;     // 0 to 100
  planningAccuracy: number;   // 0 to 100
  deepWorkPercent: number;    // 0 to 100
  focusTargetProgress: number;// 0 to 100
}): FocusScoreBreakdown {
  const consistencyScore = Math.min(100, Math.max(0, Math.round(components.consistency || 0)));
  const completionRateScore = Math.min(100, Math.max(0, Math.round(components.completionRate || 0)));
  const planningAccuracyScore = Math.min(100, Math.max(0, Math.round(components.planningAccuracy || 0)));
  const deepWorkScore = Math.min(100, Math.max(0, Math.round(components.deepWorkPercent || 0)));
  const focusTargetScore = Math.min(100, Math.max(0, Math.round(components.focusTargetProgress || 0)));

  const rawScore =
    consistencyScore * 0.30 +
    completionRateScore * 0.25 +
    planningAccuracyScore * 0.20 +
    deepWorkScore * 0.15 +
    focusTargetScore * 0.10;

  const finalFocusScore = Math.min(100, Math.max(0, Math.round(rawScore)));

  return {
    consistencyScore,
    completionRateScore,
    planningAccuracyScore,
    deepWorkScore,
    focusTargetScore,
    finalFocusScore,
  };
}

/**
 * Compute comprehensive weekly metrics (Monday -> Sunday) from real sessions.
 */
export function getWeeklyFocusMetrics(sessionsList?: FocusSession[]): WeeklyMetrics {
  const sessions = sessionsList || getAllSessions();
  const validFocusSessions = sessions.filter(isValidFocusSession);

  const now = new Date();
  const monday = getMondayOfWeek(now);
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const dailyData: DayFocusDataCalculated[] = [];
  let weeklyFocusSeconds = 0;
  let activeDaysCount = 0;

  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(monday.getTime() + i * 86400000);
    const dayStartMs = dayDate.getTime();
    const dayEndMs = dayStartMs + 86400000;

    let dayFocusSec = 0;
    for (const s of validFocusSessions) {
      dayFocusSec += getSessionFocusSecondsInInterval(s, dayStartMs, dayEndMs);
    }

    weeklyFocusSeconds += dayFocusSec;
    if (dayFocusSec >= 300) { // at least 5 minutes of focused work
      activeDaysCount += 1;
    } else if (dayFocusSec > 0 && activeDaysCount === 0) {
      activeDaysCount += 1;
    }

    const isToday =
      now.getFullYear() === dayDate.getFullYear() &&
      now.getMonth() === dayDate.getMonth() &&
      now.getDate() === dayDate.getDate();

    const hours = Math.round((dayFocusSec / 3600) * 10) / 10;

    dailyData.push({
      day: dayNames[i],
      hours,
      seconds: dayFocusSec,
      isToday,
      dateStr: dayDate.toISOString().slice(0, 10),
    });
  }

  // Find max daily hours for proportional bar heights (minimum 4.0h ceiling to prevent 0 division)
  const maxRecordedHours = Math.max(...dailyData.map((d) => d.hours));
  const maxHours = Math.max(4.0, Math.ceil(maxRecordedHours));

  // 1. Consistency: Active days this week (out of 7)
  const consistencyScore = Math.min(100, Math.max(0, Math.round((activeDaysCount / 7) * 100)));

  // 2. Completion Rate: Focus sessions in this week
  const weekStartMs = monday.getTime();
  const weekEndMs = weekStartMs + 7 * 86400000;
  const thisWeekSessions = sessions.filter(
    (s) => isSessionRecordValid(s) && s.startedAt >= weekStartMs && s.startedAt < weekEndMs
  );
  const completionRate = calculateCompletionRate(thisWeekSessions.length > 0 ? thisWeekSessions : sessions);

  // 3. Planning Accuracy
  const planningAccuracy = calculatePlanningAccuracy(thisWeekSessions.length > 0 ? thisWeekSessions : validFocusSessions);

  // 4. Deep Work Percentage
  const thisWeekFocusSessions = validFocusSessions.filter(
    (s) => s.startedAt >= weekStartMs && s.startedAt < weekEndMs
  );
  const deepWorkPercent = calculateDeepWorkPercentage(
    thisWeekFocusSessions.length > 0 ? thisWeekFocusSessions : validFocusSessions
  );

  // 5. Focus Target Progress: Daily target = 4 hours (14400s)
  const todayMetrics = getTodayFocusMetrics(sessions);
  const DAILY_TARGET_SECONDS = 4 * 3600;
  const focusTargetProgress = Math.min(
    100,
    Math.max(0, Math.round((todayMetrics.totalFocusSeconds / DAILY_TARGET_SECONDS) * 100))
  );

  // Focus Score
  const scoreBreakdown = calculateFocusScore({
    consistency: consistencyScore,
    completionRate,
    planningAccuracy,
    deepWorkPercent,
    focusTargetProgress,
  });

  return {
    weeklyFocusSeconds,
    weeklyFocusFormatted: formatFocusDuration(weeklyFocusSeconds),
    dailyData,
    maxHours,
    consistencyDays: activeDaysCount,
    deepWorkPercent,
    completionRate,
    planningAccuracy,
    focusTargetProgress,
    focusScore: scoreBreakdown.finalFocusScore,
    scoreBreakdown,
  };
}

/**
 * Peak Focus Hour: Find the 2-hour window with the highest concentration of focus time
 */
export function calculatePeakFocusHour(sessionsList?: FocusSession[]): {
  peakWindow: string;
  hasEnoughData: boolean;
  peakHours: number;
} {
  const sessions = (sessionsList || getAllSessions()).filter(isValidFocusSession);
  if (sessions.length < 3) {
    return {
      peakWindow: '—',
      hasEnoughData: false,
      peakHours: 0,
    };
  }

  // 24 hour buckets (seconds spent in each hour 0..23)
  const hourBuckets = new Array(24).fill(0);

  for (const s of sessions) {
    const d = new Date(s.startedAt);
    const startHour = d.getHours();
    const durationSec = s.actualDuration || 0;

    // Distribute duration into 1-hour slots
    const hoursSpan = Math.max(1, Math.ceil(durationSec / 3600));
    for (let h = 0; h < hoursSpan; h++) {
      const bucketIdx = (startHour + h) % 24;
      hourBuckets[bucketIdx] += Math.min(3600, durationSec / hoursSpan);
    }
  }

  // Find best 2-hour rolling window
  let bestWindowStart = 9;
  let maxSeconds = -1;

  for (let h = 0; h < 23; h++) {
    const sum = hourBuckets[h] + hourBuckets[h + 1];
    if (sum > maxSeconds) {
      maxSeconds = sum;
      bestWindowStart = h;
    }
  }

  if (maxSeconds <= 0) {
    return {
      peakWindow: '—',
      hasEnoughData: false,
      peakHours: 0,
    };
  }

  const startFormatted = String(bestWindowStart).padStart(2, '0') + ':00';
  const endFormatted = String((bestWindowStart + 2) % 24).padStart(2, '0') + ':00';

  return {
    peakWindow: `${startFormatted}–${endFormatted}`,
    hasEnoughData: true,
    peakHours: Math.round((maxSeconds / 3600) * 10) / 10,
  };
}

/**
 * Compute Focus Profile stats from real sessions
 */
export function getFocusProfileMetrics(sessionsList?: FocusSession[]): FocusProfileMetrics {
  const sessions = (sessionsList || getAllSessions()).filter(isValidFocusSession);

  if (sessions.length === 0) {
    return {
      peakFocusWindow: '—',
      avgSessionFormatted: '—',
      bestSessionFormatted: '—',
      planningAccuracyFormatted: '0%',
    };
  }

  // Peak Focus Window
  const peak = calculatePeakFocusHour(sessions);

  // Average Session
  const totalActualSec = sessions.reduce((acc, s) => acc + (s.actualDuration || 0), 0);
  const avgMinutes = Math.round(totalActualSec / sessions.length / 60);

  // Best Session: longest focused session
  const maxActualSec = Math.max(...sessions.map((s) => s.actualDuration || 0));
  const bestMinutes = Math.round(maxActualSec / 60);

  // Planning Accuracy
  const accuracy = calculatePlanningAccuracy(sessions);

  return {
    peakFocusWindow: peak.hasEnoughData ? peak.peakWindow : '—',
    avgSessionFormatted: formatMinutesWithFallback(avgMinutes),
    bestSessionFormatted: formatMinutesWithFallback(bestMinutes),
    planningAccuracyFormatted: `${accuracy}%`,
  };
}

/**
 * AI Focus Coach Insights:
 * Does NOT claim a user pattern unless there are >= 3 real completed focus sessions!
 */
export function getCoachInsights(sessionsList?: FocusSession[]): CoachInsights {
  const sessions = (sessionsList || getAllSessions()).filter(isValidFocusSession);

  if (sessions.length < 3) {
    return {
      hasEnoughData: false,
      peakWindow: '—',
      mainInsight: 'Telemetry Initializing',
      supportingText: 'Complete a few focus sessions to reveal your patterns.',
    };
  }

  const peak = calculatePeakFocusHour(sessions);
  const totalSec = sessions.reduce((acc, s) => acc + (s.actualDuration || 0), 0);
  const peakPortionSec = peak.peakHours * 3600;
  const percent = totalSec > 0 ? Math.min(100, Math.round((peakPortionSec / totalSec) * 100)) : 0;

  return {
    hasEnoughData: true,
    peakWindow: peak.peakWindow,
    mainInsight: `Your strongest focus window is ${peak.peakWindow}.`,
    supportingText: percent > 0
      ? `${percent}% of your recorded focus time is concentrated in this peak window.`
      : `High completion efficiency observed in this focus window.`,
  };
}

/**
 * Get focus time for a specific project.
 * Uses FocusSession.projectId directly (no task title parsing).
 * Excludes break sessions and cancelled sessions.
 * Accurately includes finishedEarly focus duration.
 */
export function getFocusTimeForProject(
  projectId: string,
  sessionsList?: FocusSession[]
): {
  totalSeconds: number;
  formatted: string;
} {
  if (!projectId) return { totalSeconds: 0, formatted: '0m' };

  const sessions = (sessionsList || getAllSessions()).filter(
    (s) => isValidFocusSession(s) && s.projectId === projectId
  );

  const totalSeconds = sessions.reduce(
    (acc, s) => acc + (s.actualDuration || 0),
    0
  );

  return {
    totalSeconds,
    formatted: formatFocusDuration(totalSeconds),
  };
}

/**
 * Get focus time for a specific task.
 * Uses FocusSession.taskId directly (no task title parsing).
 * Excludes break sessions and cancelled sessions.
 * Accurately includes finishedEarly focus duration.
 */
export function getFocusTimeForTask(
  taskId: string,
  sessionsList?: FocusSession[]
): {
  totalSeconds: number;
  formatted: string;
} {
  if (!taskId) return { totalSeconds: 0, formatted: '0m' };

  const sessions = (sessionsList || getAllSessions()).filter(
    (s) => isValidFocusSession(s) && s.taskId === taskId
  );

  const totalSeconds = sessions.reduce(
    (acc, s) => acc + (s.actualDuration || 0),
    0
  );

  return {
    totalSeconds,
    formatted: formatFocusDuration(totalSeconds),
  };
}

/**
 * Get focus time for a specific subject.
 * Uses FocusSession.subject directly (no task title parsing).
 * Excludes break sessions and cancelled sessions.
 * Accurately includes finishedEarly focus duration.
 */
export function getFocusTimeForSubject(
  subject: string,
  sessionsList?: FocusSession[]
): {
  totalSeconds: number;
  formatted: string;
} {
  if (!subject) return { totalSeconds: 0, formatted: '0m' };

  const sessions = (sessionsList || getAllSessions()).filter(
    (s) => isValidFocusSession(s) && s.subject?.toLowerCase().trim() === subject.toLowerCase().trim()
  );

  const totalSeconds = sessions.reduce(
    (acc, s) => acc + (s.actualDuration || 0),
    0
  );

  return {
    totalSeconds,
    formatted: formatFocusDuration(totalSeconds),
  };
}

/**
 * Get comprehensive Subject breakdown across all recorded focus sessions.
 */
export function getSubjectBreakdown(sessionsList?: FocusSession[]): SubjectBreakdownItem[] {
  const sessions = (sessionsList || getAllSessions()).filter(isValidFocusSession);
  const totalFocusSec = sessions.reduce((acc, s) => acc + (s.actualDuration || 0), 0);

  const subjectMap = new Map<string, { seconds: number; count: number }>();

  for (const s of sessions) {
    const subj = s.subject?.trim() || 'General';
    const current = subjectMap.get(subj) || { seconds: 0, count: 0 };
    current.seconds += s.actualDuration || 0;
    current.count += 1;
    subjectMap.set(subj, current);
  }

  const result: SubjectBreakdownItem[] = [];
  subjectMap.forEach((val, subj) => {
    const percentage = totalFocusSec > 0 ? Math.round((val.seconds / totalFocusSec) * 100) : 0;
    result.push({
      subject: subj,
      totalSeconds: val.seconds,
      formatted: formatFocusDuration(val.seconds),
      percentage,
      sessionCount: val.count,
    });
  });

  return result.sort((a, b) => b.totalSeconds - a.totalSeconds);
}

/**
 * Get comprehensive Project breakdown across all recorded focus sessions.
 */
export function getProjectBreakdown(sessionsList?: FocusSession[]): ProjectBreakdownItem[] {
  const sessions = (sessionsList || getAllSessions()).filter(isValidFocusSession);
  const totalFocusSec = sessions.reduce((acc, s) => acc + (s.actualDuration || 0), 0);
  const projects = getAllProjects();

  const projectMap = new Map<string, { name: string; seconds: number; count: number }>();

  // Initialize with known projects
  for (const p of projects) {
    projectMap.set(p.id, { name: p.name, seconds: 0, count: 0 });
  }

  for (const s of sessions) {
    if (s.projectId) {
      const proj = projectMap.get(s.projectId);
      if (proj) {
        proj.seconds += s.actualDuration || 0;
        proj.count += 1;
      } else {
        projectMap.set(s.projectId, {
          name: 'Archived Project',
          seconds: s.actualDuration || 0,
          count: 1,
        });
      }
    } else {
      const general = projectMap.get('no-project') || { name: 'Direct Focus / No Project', seconds: 0, count: 0 };
      general.seconds += s.actualDuration || 0;
      general.count += 1;
      projectMap.set('no-project', general);
    }
  }

  const result: ProjectBreakdownItem[] = [];
  projectMap.forEach((val, pId) => {
    if (val.seconds > 0 || projects.some((p) => p.id === pId)) {
      const percentage = totalFocusSec > 0 ? Math.round((val.seconds / totalFocusSec) * 100) : 0;
      result.push({
        projectId: pId,
        projectName: val.name,
        totalSeconds: val.seconds,
        formatted: formatFocusDuration(val.seconds),
        percentage,
        sessionCount: val.count,
      });
    }
  });

  return result.sort((a, b) => b.totalSeconds - a.totalSeconds);
}
