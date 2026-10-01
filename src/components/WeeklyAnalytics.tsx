import React, { useState, useEffect } from 'react';
import { getWeeklyFocusMetrics, WeeklyMetrics } from '../utils/focusMetrics';

export const WeeklyAnalytics: React.FC = () => {
  const [metrics, setMetrics] = useState<WeeklyMetrics>(() => getWeeklyFocusMetrics());

  useEffect(() => {
    const handleUpdate = () => {
      setMetrics(getWeeklyFocusMetrics());
    };

    window.addEventListener('tempo_sessions_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('tempo_sessions_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return (
    <div
      id="weekly-analytics-card"
      className="flex flex-col justify-between rounded-xl border border-[#202024] bg-[#0B0B0D] tempo-card-surface p-5 shadow-xs transition-all hover:border-[#26262C]"
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#202024]/60 mb-4">
          <h2
            id="weekly-analytics-title"
            className="text-xs font-semibold tracking-wider text-[#F5F5F7] uppercase"
          >
            Your Week
          </h2>
          <span className="font-mono text-[11px] text-[#5F6066]">Mon — Sun</span>
        </div>

        {/* Minimal 7-day Bar Visualization with Real Session Data */}
        <div
          id="weekly-bar-chart"
          className="flex h-28 items-end justify-between gap-2 px-1 pt-2 pb-1"
        >
          {metrics.dailyData.map((item) => {
            const heightPercent = metrics.maxHours > 0
              ? Math.min(100, Math.max(0, Math.round((item.hours / metrics.maxHours) * 100)))
              : 0;

            return (
              <div
                key={item.day}
                id={`bar-col-${item.day.toLowerCase()}`}
                className="group flex flex-1 flex-col items-center gap-2 h-full justify-end"
              >
                {/* Value on hover */}
                <span className="text-[10px] font-mono text-[#8A8A90] opacity-0 transition-opacity group-hover:opacity-100 tabular-nums">
                  {item.hours > 0 ? `${item.hours}h` : '0h'}
                </span>

                {/* Bar */}
                <div className="relative w-full max-w-[28px] h-full flex items-end">
                  <div
                    style={{ height: `${heightPercent}%`, minHeight: item.hours > 0 ? '4px' : '2px' }}
                    className={`w-full rounded-t-[3px] transition-all duration-300 ${
                      item.isToday
                        ? 'bg-gradient-to-t from-[#CBD5E1] to-[#FFFFFF] shadow-[0_0_12px_rgba(255,255,255,0.22)]'
                        : item.hours > 0
                        ? 'bg-gradient-to-t from-[#26262E] to-[#3E3E48] group-hover:from-[#30303A] group-hover:to-[#4E4E5A]'
                        : 'bg-[#18181C] group-hover:bg-[#222228]'
                    }`}
                  />
                </div>

                {/* Day label */}
                <span
                  className={`font-mono text-[10px] ${
                    item.isToday ? 'text-[#F5F5F7] font-semibold' : 'text-[#5F6066]'
                  }`}
                >
                  {item.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Metrics Row below visualization with Real Calculated Data */}
      <div
        id="weekly-stats-row"
        className="mt-6 grid grid-cols-3 gap-2 border-t border-[#202024]/60 pt-4"
      >
        <div id="stat-weekly-focus" className="flex flex-col">
          <span className="font-mono text-base font-normal tracking-tight text-[#F5F5F7] tabular-nums">
            {metrics.weeklyFocusFormatted}
          </span>
          <span className="text-[11px] text-[#8A8A90]">Weekly focus</span>
        </div>

        <div id="stat-deep-work" className="flex flex-col">
          <span className="font-mono text-base font-normal tracking-tight text-[#F5F5F7] tabular-nums">
            {metrics.deepWorkPercent}%
          </span>
          <span className="text-[11px] text-[#8A8A90]">Deep work</span>
        </div>

        <div id="stat-consistency" className="flex flex-col">
          <span className="font-mono text-base font-normal tracking-tight text-[#F5F5F7] tabular-nums">
            {metrics.consistencyDays} {metrics.consistencyDays === 1 ? 'day' : 'days'}
          </span>
          <span className="text-[11px] text-[#8A8A90]">Consistency</span>
        </div>
      </div>
    </div>
  );
};
