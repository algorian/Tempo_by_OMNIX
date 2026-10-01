import React, { useState, useEffect, useCallback } from 'react';
import { ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { FocusSession, AICoachResult } from '../types';
import { getGroundedAICoachInsight, buildFocusCoachContext } from '../services/aiCoachService';

interface AIFocusCoachProps {
  activeSession?: FocusSession | null;
  onActionClick?: (action: string) => void;
}

export const AIFocusCoach: React.FC<AIFocusCoachProps> = ({
  activeSession,
  onActionClick,
}) => {
  const [coachResult, setCoachResult] = useState<AICoachResult>(() => {
    const initialContext = buildFocusCoachContext(activeSession);
    const hasEnoughData = initialContext.week.sessionCount >= 3;
    return {
      status: hasEnoughData ? 'loading' : 'no-data',
      context: initialContext,
      insight: hasEnoughData
        ? null
        : {
            title: 'Telemetry Initializing',
            message: 'Complete a few focus sessions to reveal your patterns.',
            action: 'Start a session',
          },
    };
  });

  const refreshInsight = useCallback(async () => {
    try {
      const result = await getGroundedAICoachInsight(activeSession);
      setCoachResult(result);
    } catch {
      setCoachResult((prev) => ({
        ...prev,
        status: 'error',
        errorMessage: 'Unable to evaluate coach telemetry',
      }));
    }
  }, [activeSession]);

  useEffect(() => {
    refreshInsight();

    const handleUpdate = () => {
      refreshInsight();
    };

    window.addEventListener('tempo_sessions_updated', handleUpdate);
    window.addEventListener('tempo_tasks_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('tempo_sessions_updated', handleUpdate);
      window.removeEventListener('tempo_tasks_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [refreshInsight]);

  const { status, insight } = coachResult;

  // Visual status indicator dot
  const getStatusColor = () => {
    switch (status) {
      case 'available':
        return 'bg-[#60A5FA]'; // Active AI model insight
      case 'loading':
        return 'bg-[#8A8A90] animate-pulse';
      case 'error':
      case 'unavailable':
      case 'no-data':
      default:
        return 'bg-[#5F6066]';
    }
  };

  return (
    <div
      id="ai-focus-coach-card"
      className="flex flex-col justify-between rounded-xl border border-[#202024] bg-[#0B0B0D] tempo-card-surface p-5 shadow-xs transition-all hover:border-[#26262C]"
    >
      <div className="flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#202024]/60">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-[#8A8A90]" />
            <span
              id="coach-header-label"
              className="font-mono text-[10px] font-semibold tracking-[0.2em] text-[#8A8A90] uppercase"
            >
              AI FOCUS COACH
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {status === 'loading' && (
              <Loader2 className="h-3 w-3 animate-spin text-[#8A8A90]" />
            )}
            <span
              id="coach-status-indicator"
              className={`h-1.5 w-1.5 rounded-full ${getStatusColor()}`}
              title={`Status: ${status}`}
            />
          </div>
        </div>

        {/* Content based on status */}
        <div className="mt-1 flex flex-col gap-1.5">
          {status === 'loading' ? (
            <>
              <div className="h-5 w-3/4 rounded bg-[#202024]/60 animate-pulse" />
              <div className="h-3.5 w-full rounded bg-[#202024]/40 animate-pulse mt-1" />
            </>
          ) : status === 'available' && insight ? (
            <>
              <h3
                id="coach-main-insight"
                className="text-base sm:text-lg font-medium tracking-tight text-[#F5F5F7] leading-snug"
              >
                {insight.title}
              </h3>
              <p
                id="coach-supporting-text"
                className="text-xs text-[#8A8A90] leading-relaxed"
              >
                {insight.message}
              </p>
            </>
          ) : status === 'no-data' ? (
            <>
              <h3
                id="coach-main-insight"
                className="text-base sm:text-lg font-medium tracking-tight text-[#F5F5F7] leading-snug"
              >
                Telemetry Initializing
              </h3>
              <p
                id="coach-supporting-text"
                className="text-xs text-[#8A8A90] leading-relaxed"
              >
                Complete a few focus sessions to reveal your patterns.
              </p>
            </>
          ) : (
            <>
              <h3
                id="coach-main-insight"
                className="text-base sm:text-lg font-medium tracking-tight text-[#F5F5F7] leading-snug"
              >
                Telemetry Ready
              </h3>
              <p
                id="coach-supporting-text"
                className="text-xs text-[#8A8A90] leading-relaxed"
              >
                Your focus analytics are working normally. AI interpretation is temporarily unavailable.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Action button */}
      <div className="mt-6 pt-3 border-t border-[#202024]/40">
        <button
          id="coach-view-analysis-btn"
          type="button"
          onClick={() => {
            if (insight?.action && onActionClick) {
              onActionClick(insight.action);
            }
          }}
          className="group inline-flex items-center gap-1.5 text-xs font-medium text-[#F5F5F7] hover:text-[#FFFFFF] transition-colors"
        >
          <span>
            {insight?.action ||
              (status === 'available'
                ? 'View analysis'
                : status === 'no-data'
                ? 'Start a session'
                : 'Session telemetry')}
          </span>
          <ArrowRight className="h-3.5 w-3.5 text-[#8A8A90] transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-[#F5F5F7]" />
        </button>
      </div>
    </div>
  );
};
