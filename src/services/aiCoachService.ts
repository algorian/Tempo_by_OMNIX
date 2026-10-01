import {
  FocusCoachContext,
  FocusCoachInsight,
  AICoachResult,
  FocusSession,
  AIErrorCode,
} from '../types';
import {
  getTodayFocusMetrics,
  getWeeklyFocusMetrics,
  calculatePeakFocusHour,
  isValidFocusSession,
} from '../utils/focusMetrics';
import { getAllSessions } from '../utils/sessionStorage';
import { getTodayCompletedTasksCount, getTaskById } from '../utils/taskStorage';

/**
 * Builds the structured FocusCoachContext purely from existing deterministic analytics.
 * No formulas are duplicated, no statistics are invented, no focus scores are recalculated.
 */
export function buildFocusCoachContext(activeSession?: FocusSession | null): FocusCoachContext {
  const allSessions = getAllSessions();
  const validSessions = allSessions.filter(isValidFocusSession);

  // Deterministic Today Metrics
  const todayMetrics = getTodayFocusMetrics(allSessions);
  const completedTaskCount = getTodayCompletedTasksCount();

  // Deterministic Weekly Metrics & Scores
  const weeklyMetrics = getWeeklyFocusMetrics(allSessions);
  const peak = calculatePeakFocusHour(validSessions);

  let taskTitle: string | null = null;
  if (activeSession?.taskId) {
    const task = getTaskById(activeSession.taskId);
    if (task) {
      taskTitle = task.title;
    }
  }

  return {
    today: {
      focusSeconds: todayMetrics.totalFocusSeconds,
      sessionCount: todayMetrics.sessionCount,
      completedTaskCount,
    },
    week: {
      focusSeconds: weeklyMetrics.weeklyFocusSeconds,
      sessionCount: validSessions.length,
      consistency: weeklyMetrics.scoreBreakdown.consistencyScore,
      completionRate: weeklyMetrics.completionRate,
      planningAccuracy: weeklyMetrics.planningAccuracy,
      deepWorkPercentage: weeklyMetrics.deepWorkPercent,
      focusScore: weeklyMetrics.focusScore, // Reuse exact deterministic Focus Score
      peakFocusHour: peak.hasEnoughData ? peak.peakHours : null,
    },
    current: {
      taskId: activeSession?.taskId || null,
      taskTitle,
      projectId: activeSession?.projectId || null,
      subject: activeSession?.subject || null,
    },
  };
}

/**
 * Generates or evaluates a grounded AI Focus Coach insight via the server-side API proxy.
 *
 * Guarantees:
 * 1. Strict Grounding: Only observations mathematically justified by FocusCoachContext.
 * 2. Deterministic Telemetry Preservation: If AI is unavailable, deterministic metrics and scores remain 100% functional.
 * 3. Typed Error Classification: No generic "Failed to call Gemini API" or raw HTTP codes in the user interface.
 * 4. Resilient multi-tier architecture handled securely on the server.
 */
export async function getGroundedAICoachInsight(
  activeSession?: FocusSession | null
): Promise<AICoachResult> {
  const context = buildFocusCoachContext(activeSession);

  // Insufficient telemetry state (requires at least 3 valid sessions for statistical validity)
  if (context.week.sessionCount < 3) {
    return {
      status: 'no-data',
      context,
      insight: {
        title: 'Telemetry Initializing',
        message: 'Complete at least 3 focus sessions to observe statistically valid patterns.',
        action: 'Start a session',
      },
    };
  }

  try {
    const response = await fetch('/api/coach/insight', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ context }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn('[AI Coach Service] Server returned non-OK status:', response.status, errorText);
      return {
        status: 'unavailable',
        context,
        insight: null,
        errorMessage: 'AI interpretation is temporarily unavailable.',
        errorCode: (response.status === 429
          ? 'AI_RATE_LIMITED'
          : response.status === 503
          ? 'AI_MODEL_UNAVAILABLE'
          : 'AI_UNKNOWN_ERROR') as AIErrorCode,
        diagnosticDetails: `Server HTTP ${response.status}: ${errorText.slice(0, 150)}`,
      };
    }

    const data = await response.json();

    if (data.status === 'available' && data.insight) {
      const boundedInsight: FocusCoachInsight = {
        title: String(data.insight.title).slice(0, 60).trim(),
        message: String(data.insight.message).slice(0, 180).trim(),
        action: data.insight.action ? String(data.insight.action).slice(0, 80).trim() : null,
      };

      return {
        status: 'available',
        context,
        insight: boundedInsight,
        modelUsed: data.modelUsed,
      };
    }

    if (data.status === 'no-data') {
      return {
        status: 'no-data',
        context,
        insight: data.insight || {
          title: 'Telemetry Initializing',
          message: 'Complete at least 3 focus sessions to reveal your patterns.',
          action: 'Start a session',
        },
      };
    }

    // Server-reported error or unavailable state (classified)
    return {
      status: 'unavailable',
      context,
      insight: null,
      errorMessage: data.userMessage || 'AI interpretation requires Gemini availability.',
      errorCode: (data.errorCode || 'AI_UNKNOWN_ERROR') as AIErrorCode,
      diagnosticDetails: data.diagnosticDetails,
    };
  } catch (err: unknown) {
    const diagMsg = err instanceof Error ? err.message : String(err);
    console.warn('[AI Coach Service] Network failure fetching insight:', diagMsg);

    return {
      status: 'unavailable',
      context,
      insight: null,
      errorMessage: 'AI interpretation is temporarily unavailable.',
      errorCode: 'AI_NETWORK_ERROR',
      diagnosticDetails: diagMsg,
    };
  }
}
