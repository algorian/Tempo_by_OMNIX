import React, { useState, useEffect } from 'react';
import { getFocusProfileMetrics, FocusProfileMetrics } from '../utils/focusMetrics';

export const FocusProfile: React.FC = () => {
  const [profile, setProfile] = useState<FocusProfileMetrics>(() => getFocusProfileMetrics());

  useEffect(() => {
    const handleUpdate = () => {
      setProfile(getFocusProfileMetrics());
    };

    window.addEventListener('tempo_sessions_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('tempo_sessions_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const stats = [
    { id: 'peak-focus', label: 'Peak Focus', value: profile.peakFocusWindow },
    { id: 'avg-session', label: 'Average Session', value: profile.avgSessionFormatted },
    { id: 'best-session', label: 'Best Session', value: profile.bestSessionFormatted },
    { id: 'planning-accuracy', label: 'Planning Accuracy', value: profile.planningAccuracyFormatted },
  ];

  return (
    <section
      id="tempo-focus-profile"
      className="w-full rounded-xl border border-[#202024] bg-[#0B0B0D] tempo-card-surface p-6 shadow-xs transition-all hover:border-[#26262C]"
    >
      <div className="mb-4 flex items-center justify-between border-b border-[#202024]/60 pb-3">
        <span
          id="focus-profile-heading"
          className="font-mono text-[10px] font-semibold tracking-[0.2em] text-[#5F6066] uppercase"
        >
          FOCUS PROFILE
        </span>
        <span className="font-mono text-[11px] text-[#8A8A90]">
          {profile.avgSessionFormatted === '—'
            ? 'Complete a few sessions to build your profile.'
            : 'Adaptive Pattern'}
        </span>
      </div>

      <div className="grid grid-cols-2 divide-y divide-[#202024] sm:grid-cols-4 sm:divide-y-0 sm:divide-x divide-[#202024]">
        {stats.map((stat, idx) => (
          <div
            key={stat.id}
            id={`profile-stat-${stat.id}`}
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
            <span className="text-xs text-[#8A8A90] font-normal">
              {stat.label}
            </span>
            <span className="font-mono text-xl sm:text-2xl font-light tracking-tight text-[#F5F5F7] tabular-nums">
              {stat.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};
