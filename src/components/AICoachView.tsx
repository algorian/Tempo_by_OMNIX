import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Sparkles,
  Play,
  ShieldCheck,
  TrendingUp,
  Clock,
  Target,
  Layers,
  Loader2,
  RefreshCw,
  Info,
} from 'lucide-react';
import { FocusSession, AICoachResult } from '../types';
import { getGroundedAICoachInsight, buildFocusCoachContext } from '../services/aiCoachService';

interface AICoachViewProps {
  activeSession?: FocusSession | null;
  onSelectToday: () => void;
}

export const AICoachView: React.FC<AICoachViewProps> = ({
  activeSession,
  onSelectToday,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
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
            message: 'Complete at least 3 focus sessions to observe statistically valid patterns.',
            action: 'Start a session',
          },
    };
  });

  const refreshInsight = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const result = await getGroundedAICoachInsight(activeSession);
      setCoachResult(result);
    } catch {
      setCoachResult((prev) => ({
        ...prev,
        status: 'unavailable',
        errorCode: 'AI_UNKNOWN_ERROR',
        errorMessage: 'AI interpretation is temporarily unavailable.',
      }));
    } finally {
      setIsRefreshing(false);
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

  const { status, insight, context } = coachResult;

  return (
    <div id="ai-coach-view-container" className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#202024]/70">
        <div>
          <div className="flex items-center gap-3">
            <button
              id="coach-back-to-today-btn"
              type="button"
              onClick={onSelectToday}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#202024] bg-[#111113] px-2.5 py-1 text-xs text-[#8A8A90] hover:text-[#F5F5F7] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Focus</span>
            </button>
            <div className="flex items-center gap-1.5 text-xs text-[#5F6066] font-mono uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5 text-[#8A8A90]" />
              <span>Telemetry Interpretation Layer</span>
            </div>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-light tracking-tight text-[#F5F5F7]">
            AI Focus Coach
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refreshInsight}
            disabled={isRefreshing || status === 'loading'}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#202024] bg-[#111113] px-3 py-1.5 text-xs font-medium text-[#8A8A90] hover:text-[#F5F5F7] hover:bg-[#161619] transition-colors disabled:opacity-50"
            title="Refresh AI interpretation"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={onSelectToday}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#202024] bg-[#111113] px-3.5 py-1.5 text-xs font-medium text-[#F5F5F7] hover:bg-[#161619] transition-colors"
          >
            <Play className="h-3.5 w-3.5" />
            <span>Launch Focus</span>
          </button>
        </div>
      </div>

      {/* Grounded Insight Card */}
      <div
        id="coach-primary-insight-card"
        className="flex flex-col justify-between rounded-xl border border-[#202024] bg-[#0B0B0D] tempo-card-surface p-6 sm:p-7 shadow-xs"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#202024]/60">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#8A8A90]" />
              <span className="font-mono text-xs font-semibold tracking-wider text-[#F5F5F7] uppercase">
                Observation State
              </span>
            </div>
            <div className="flex items-center gap-2">
              {status === 'loading' && <Loader2 className="h-3.5 w-3.5 animate-spin text-[#8A8A90]" />}
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono uppercase ${
                  status === 'available'
                    ? 'bg-[#1E293B] text-[#93C5FD] border border-[#3B82F6]/30'
                    : status === 'no-data'
                    ? 'bg-[#18181B] text-[#A1A1AA] border border-[#27272A]'
                    : status === 'loading'
                    ? 'bg-[#18181B] text-[#8A8A90]'
                    : 'bg-[#18181B] text-[#8A8A90] border border-[#27272A]'
                }`}
              >
                {status === 'available'
                  ? 'Grounded Insight'
                  : status === 'no-data'
                  ? 'Gathering Telemetry'
                  : status === 'loading'
                  ? 'Evaluating'
                  : 'Telemetry Mode'}
              </span>
            </div>
          </div>

          {status === 'loading' ? (
            <div className="py-8 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-[#8A8A90]" />
              <p className="text-xs text-[#8A8A90] font-mono">Evaluating deterministic telemetry...</p>
            </div>
          ) : status === 'no-data' ? (
            <div className="py-4 flex flex-col gap-3">
              <h3 className="text-lg sm:text-xl font-medium tracking-tight text-[#F5F5F7]">
                Telemetry Initializing
              </h3>
              <p className="text-sm text-[#8A8A90] max-w-xl leading-relaxed">
                TEMPO requires at least 3 completed focus sessions to observe statistically meaningful work patterns without guesswork. You have completed{' '}
                <span className="text-[#F5F5F7] font-mono">{context.week.sessionCount}</span> of 3 sessions this week.
              </p>
              <div className="mt-2">
                <button
                  type="button"
                  onClick={onSelectToday}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#2E2E35] bg-[#F5F5F7] px-4 py-2 text-xs font-medium text-[#050505] hover:bg-white transition-colors"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Start a Focus Session</span>
                </button>
              </div>
            </div>
          ) : status === 'available' && insight ? (
            <div className="py-2 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-[#93C5FD]">
                  AI Synthesis
                </span>
                {coachResult.modelUsed && (
                  <span className="text-[10px] font-mono text-[#5F6066]">
                    ({coachResult.modelUsed})
                  </span>
                )}
              </div>
              <h3 className="text-xl sm:text-2xl font-normal tracking-tight text-[#F5F5F7] leading-snug">
                {insight.title}
              </h3>
              <p className="text-sm text-[#A1A1AA] max-w-2xl leading-relaxed">
                {insight.message}
              </p>
              {insight.action && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={onSelectToday}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#202024] bg-[#141418] px-4 py-2 text-xs font-medium text-[#F5F5F7] hover:bg-[#1C1C22] transition-colors"
                  >
                    <span>{insight.action}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Restrained, non-blocking fallback state */
            <div className="py-4 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#8A8A90]">
                <ShieldCheck className="h-4 w-4 text-[#8A8A90]" />
                <span>Telemetry Ready</span>
              </div>
              <h3 className="text-lg sm:text-xl font-medium tracking-tight text-[#F5F5F7]">
                AI Coach unavailable
              </h3>
              <p className="text-sm text-[#8A8A90] max-w-xl leading-relaxed">
                Your focus analytics are still working normally. AI interpretation requires Gemini availability.
              </p>

              {/* Developer Diagnostics Disclosure */}
              {coachResult.errorCode && (
                <div className="mt-2 pt-3 border-t border-[#202024]/40">
                  <button
                    type="button"
                    onClick={() => setShowDiagnostics((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#5F6066] hover:text-[#8A8A90] transition-colors"
                  >
                    <Info className="h-3 w-3" />
                    <span>{showDiagnostics ? 'Hide Diagnostics' : 'Developer Diagnostics'}</span>
                  </button>

                  {showDiagnostics && (
                    <div className="mt-2 rounded-lg border border-[#202024] bg-[#111113] p-3 text-xs font-mono text-[#8A8A90] flex flex-col gap-1">
                      <div>
                        <span className="text-[#5F6066]">Classification:</span>{' '}
                        <span className="text-[#F5F5F7]">{coachResult.errorCode}</span>
                      </div>
                      {coachResult.diagnosticDetails && (
                        <div>
                          <span className="text-[#5F6066]">Diagnostic:</span>{' '}
                          <span className="text-[#A1A1AA] break-all">{coachResult.diagnosticDetails}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Deterministic Telemetry Feed (What AI Observes) */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#202024]/60">
          <span className="font-mono text-xs uppercase tracking-wider text-[#8A8A90]">
            Deterministic Telemetry Input
          </span>
          <span className="font-mono text-[11px] text-[#5F6066]">Source of Truth</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="flex flex-col gap-1 rounded-xl border border-[#202024] bg-[#0B0B0D] tempo-card-surface p-4 transition-all duration-200 hover:border-[#282830]">
            <div className="flex items-center gap-1.5 text-[#5F6066]">
              <Target className="h-3.5 w-3.5" />
              <span className="text-[10px] font-mono uppercase tracking-wider">Focus Score</span>
            </div>
            <p className="text-xl font-mono font-medium text-[#F5F5F7]">
              {context.week.focusScore}
            </p>
            <span className="text-[10px] text-[#5F6066]">0–100 calculated</span>
          </div>

          <div className="flex flex-col gap-1 rounded-xl border border-[#202024] bg-[#0B0B0D] tempo-card-surface p-4 transition-all duration-200 hover:border-[#282830]">
            <div className="flex items-center gap-1.5 text-[#5F6066]">
              <Clock className="h-3.5 w-3.5" />
              <span className="text-[10px] font-mono uppercase tracking-wider">Sessions</span>
            </div>
            <p className="text-xl font-mono font-medium text-[#F5F5F7]">
              {context.week.sessionCount}
            </p>
            <span className="text-[10px] text-[#5F6066]">This week</span>
          </div>

          <div className="flex flex-col gap-1 rounded-xl border border-[#202024] bg-[#0B0B0D] tempo-card-surface p-4 transition-all duration-200 hover:border-[#282830]">
            <div className="flex items-center gap-1.5 text-[#5F6066]">
              <TrendingUp className="h-3.5 w-3.5" />
              <span className="text-[10px] font-mono uppercase tracking-wider">Completion</span>
            </div>
            <p className="text-xl font-mono font-medium text-[#F5F5F7]">
              {context.week.completionRate}%
            </p>
            <span className="text-[10px] text-[#5F6066]">Full sessions</span>
          </div>

          <div className="flex flex-col gap-1 rounded-xl border border-[#202024] bg-[#0B0B0D] tempo-card-surface p-4 transition-all duration-200 hover:border-[#282830]">
            <div className="flex items-center gap-1.5 text-[#5F6066]">
              <Layers className="h-3.5 w-3.5" />
              <span className="text-[10px] font-mono uppercase tracking-wider">Deep Work</span>
            </div>
            <p className="text-xl font-mono font-medium text-[#F5F5F7]">
              {context.week.deepWorkPercentage}%
            </p>
            <span className="text-[10px] text-[#5F6066]">Ratio of focus</span>
          </div>

          <div className="flex flex-col gap-1 rounded-xl border border-[#202024] bg-[#0B0B0D] tempo-card-surface p-4 transition-all duration-200 hover:border-[#282830]">
            <div className="flex items-center gap-1.5 text-[#5F6066]">
              <Clock className="h-3.5 w-3.5" />
              <span className="text-[10px] font-mono uppercase tracking-wider">Peak Hour</span>
            </div>
            <p className="text-xl font-mono font-medium text-[#F5F5F7]">
              {context.week.peakFocusHour !== null ? `${context.week.peakFocusHour}:00` : '—'}
            </p>
            <span className="text-[10px] text-[#5F6066]">Highest output</span>
          </div>

          <div className="flex flex-col gap-1 rounded-xl border border-[#202024] bg-[#0B0B0D] tempo-card-surface p-4 transition-all duration-200 hover:border-[#282830]">
            <div className="flex items-center gap-1.5 text-[#5F6066]">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span className="text-[10px] font-mono uppercase tracking-wider">Consistency</span>
            </div>
            <p className="text-xl font-mono font-medium text-[#F5F5F7]">
              {context.week.consistency}%
            </p>
            <span className="text-[10px] text-[#5F6066]">Cadence regularity</span>
          </div>
        </div>
      </section>

      {/* AI Coach System Design Principles */}
      <div className="rounded-xl border border-[#202024] bg-[#0B0B0D] tempo-card-surface p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-2 pb-3 border-b border-[#202024]/60 mb-3">
          <ShieldCheck className="h-4 w-4 text-[#8A8A90]" />
          <span className="font-mono text-xs font-semibold tracking-wider text-[#F5F5F7] uppercase">
            Architectural Guarantees
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[#8A8A90] leading-relaxed">
          <div>
            <p className="font-medium text-[#F5F5F7] mb-1">1. Interpretation Layer Only</p>
            <p className="text-[11px] text-[#5F6066]">
              AI never calculates or alters your focus time, session counts, or scores. All metrics remain strictly deterministic.
            </p>
          </div>
          <div>
            <p className="font-medium text-[#F5F5F7] mb-1">2. Zero Hallucination Policy</p>
            <p className="text-[11px] text-[#5F6066]">
              If insufficient data exists (&lt;3 sessions), the coach remains silent rather than fabricating generic motivational advice.
            </p>
          </div>
          <div>
            <p className="font-medium text-[#F5F5F7] mb-1">3. Silent During Focus</p>
            <p className="text-[11px] text-[#5F6066]">
              During active focus sessions, the coach never interrupts. Focus Mode is an inviolable distraction-free sanctuary.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
