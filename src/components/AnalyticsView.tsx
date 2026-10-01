import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  ArrowLeft,
  BookOpen,
  FolderKanban,
  Sparkles,
  Play,
} from 'lucide-react';
import { MetricCard } from './MetricCard';
import { WeeklyAnalytics } from './WeeklyAnalytics';
import { FocusProfile } from './FocusProfile';
import { AIFocusCoach } from './AIFocusCoach';
import {
  getSubjectBreakdown,
  getProjectBreakdown,
  SubjectBreakdownItem,
  ProjectBreakdownItem,
  isValidFocusSession,
} from '../utils/focusMetrics';
import { getAllSessions } from '../utils/sessionStorage';

interface AnalyticsViewProps {
  onSelectToday: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ onSelectToday }) => {
  const [subjects, setSubjects] = useState<SubjectBreakdownItem[]>(() => getSubjectBreakdown());
  const [projects, setProjects] = useState<ProjectBreakdownItem[]>(() => getProjectBreakdown());
  const [hasSessions, setHasSessions] = useState(() => {
    return getAllSessions().filter(isValidFocusSession).length > 0;
  });

  useEffect(() => {
    const handleUpdate = () => {
      setSubjects(getSubjectBreakdown());
      setProjects(getProjectBreakdown());
      setHasSessions(getAllSessions().filter(isValidFocusSession).length > 0);
    };

    window.addEventListener('tempo_sessions_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('tempo_sessions_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return (
    <div id="analytics-view-container" className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#202024]/70">
        <div>
          <div className="flex items-center gap-3">
            <button
              id="analytics-back-to-today-btn"
              type="button"
              onClick={onSelectToday}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#202024] bg-[#111113] px-2.5 py-1 text-xs text-[#8A8A90] hover:text-[#F5F5F7] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Today</span>
            </button>
            <div className="flex items-center gap-1.5 text-xs text-[#5F6066] font-mono uppercase tracking-wider">
              <BarChart3 className="h-3.5 w-3.5 text-[#8A8A90]" />
              <span>Cadence & Telemetry</span>
            </div>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-light tracking-tight text-[#F5F5F7]">
            Analytics
          </h1>
        </div>

        <button
          type="button"
          onClick={onSelectToday}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#202024] bg-[#111113] px-3.5 py-1.5 text-xs font-medium text-[#F5F5F7] hover:bg-[#161619] transition-colors"
        >
          <Play className="h-3.5 w-3.5" />
          <span>Launch Timer</span>
        </button>
      </div>

      {/* Primary Metrics Summary */}
      <MetricCard />

      {/* Main Analytics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <WeeklyAnalytics />
        <AIFocusCoach />
      </div>

      {/* Horizontal Focus Profile */}
      <FocusProfile />

      {/* Deep Work Breakdown: Subject & Project Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Subject Breakdown Card */}
        <div
          id="analytics-subject-breakdown-card"
          className="flex flex-col justify-between rounded-xl border border-[#202024] bg-[#0B0B0D] tempo-card-surface p-5 sm:p-6 shadow-xs"
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#202024]/60 mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-[#8A8A90]" />
                <h2 className="text-xs font-semibold tracking-wider text-[#F5F5F7] uppercase font-mono">
                  Subject Focus Time
                </h2>
              </div>
              <span className="font-mono text-[10px] text-[#5F6066] uppercase">All Time</span>
            </div>

            {subjects.length === 0 || !hasSessions ? (
              <div className="flex h-36 flex-col items-center justify-center text-center text-xs text-[#5F6066]">
                <p className="text-[#8A8A90] font-medium">No focus data yet.</p>
                <p className="mt-1 text-[11px] text-[#5F6066]">
                  Complete a few sessions to view your subject distribution.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {subjects.map((item) => (
                  <div key={item.subject} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#F5F5F7]">{item.subject}</span>
                      <div className="flex items-center gap-2 font-mono text-[11px]">
                        <span className="text-[#8A8A90]">{item.formatted}</span>
                        <span className="text-[#5F6066]">({item.percentage}%)</span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-[#18181C] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#8A8A90]"
                        style={{ width: `${Math.min(100, Math.max(2, item.percentage))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Project Breakdown Card */}
        <div
          id="analytics-project-breakdown-card"
          className="flex flex-col justify-between rounded-xl border border-[#202024] bg-[#0B0B0D] tempo-card-surface p-5 sm:p-6 shadow-xs"
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#202024]/60 mb-4">
              <div className="flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-[#8A8A90]" />
                <h2 className="text-xs font-semibold tracking-wider text-[#F5F5F7] uppercase font-mono">
                  Project Focus Time
                </h2>
              </div>
              <span className="font-mono text-[10px] text-[#5F6066] uppercase">All Time</span>
            </div>

            {projects.length === 0 || !hasSessions ? (
              <div className="flex h-36 flex-col items-center justify-center text-center text-xs text-[#5F6066]">
                <p className="text-[#8A8A90] font-medium">No focus data yet.</p>
                <p className="mt-1 text-[11px] text-[#5F6066]">
                  Complete a few sessions to view your project distribution.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {projects.map((item) => (
                  <div key={item.projectId} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#F5F5F7] truncate max-w-[200px]">
                        {item.projectName}
                      </span>
                      <div className="flex items-center gap-2 font-mono text-[11px]">
                        <span className="text-[#8A8A90]">{item.formatted}</span>
                        <span className="text-[#5F6066]">({item.percentage}%)</span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-[#18181C] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#60A5FA]"
                        style={{ width: `${Math.min(100, Math.max(2, item.percentage))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
