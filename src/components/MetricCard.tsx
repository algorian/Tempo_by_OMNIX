import React, { useState, useEffect } from 'react';
import { getTodayFocusMetrics, getWeeklyFocusMetrics } from '../utils/focusMetrics';
import { getAllTasks } from '../utils/taskStorage';
import { isToday } from '../utils/sessionStorage';

interface MetricData {
  id: string;
  label: string;
  value: string;
  unit?: string;
}

export const MetricCard: React.FC = () => {
  const [metricsData, setMetricsData] = useState(() => {
    const today = getTodayFocusMetrics();
    const weekly = getWeeklyFocusMetrics();
    const tasks = getAllTasks();
    const completedTasksToday = tasks.filter(
      (t) => (t.status === 'completed' || t.completed) && (t.completedAt ? isToday(t.completedAt) : true)
    ).length;

    return {
      focusTimeString: today.focusTimeString,
      sessionCount: today.sessionCount,
      tasksCompleted: completedTasksToday,
      focusScore: weekly.focusScore,
    };
  });

  useEffect(() => {
    const handleUpdate = () => {
      const today = getTodayFocusMetrics();
      const weekly = getWeeklyFocusMetrics();
      const tasks = getAllTasks();
      const completedTasksToday = tasks.filter(
        (t) => (t.status === 'completed' || t.completed) && (t.completedAt ? isToday(t.completedAt) : true)
      ).length;

      setMetricsData({
        focusTimeString: today.focusTimeString,
        sessionCount: today.sessionCount,
        tasksCompleted: completedTasksToday,
        focusScore: weekly.focusScore,
      });
    };

    window.addEventListener('tempo_sessions_updated', handleUpdate);
    window.addEventListener('tempo_tasks_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('tempo_sessions_updated', handleUpdate);
      window.removeEventListener('tempo_tasks_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const metrics: MetricData[] = [
    { id: 'focus-time', label: 'FOCUS TIME', value: metricsData.focusTimeString },
    { id: 'sessions', label: 'SESSIONS', value: String(metricsData.sessionCount) },
    { id: 'tasks', label: 'TASKS', value: String(metricsData.tasksCompleted) },
    { id: 'focus-score', label: 'FOCUS SCORE', value: String(metricsData.focusScore) },
  ];

  return (
    <section
      id="tempo-metrics-card"
      className="w-full rounded-xl border border-[#202024] bg-[#0B0B0D] tempo-card-surface py-5 px-6 transition-all duration-300 shadow-xs hover:border-[#26262C]"
    >
      <div className="grid grid-cols-2 divide-y divide-[#202024] sm:grid-cols-4 sm:divide-y-0 sm:divide-x divide-[#202024]">
        {metrics.map((metric, idx) => (
          <div
            key={metric.id}
            id={`metric-item-${metric.id}`}
            className={`flex flex-col gap-1.5 ${
              idx === 0
                ? 'pb-4 sm:pb-0 sm:pr-6'
                : idx === 1
                ? 'pb-4 pl-4 sm:pb-0 sm:px-6'
                : idx === 2
                ? 'pt-4 sm:pt-0 sm:px-6'
                : 'pt-4 pl-4 sm:pt-0 sm:pl-6'
            }`}
          >
            <span
              id={`metric-label-${metric.id}`}
              className="font-mono text-[10px] font-medium tracking-[0.2em] text-[#5F6066] uppercase"
            >
              {metric.label}
            </span>
            <div className="flex items-baseline gap-1">
              <span
                id={`metric-value-${metric.id}`}
                className="font-mono text-2xl font-light tracking-tight text-[#F5F5F7] sm:text-3xl tabular-nums"
              >
                {metric.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
