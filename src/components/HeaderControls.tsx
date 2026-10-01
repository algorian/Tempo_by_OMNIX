import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  SlidersHorizontal,
  Maximize2,
  Clock,
  X,
  RotateCcw,
  Terminal,
} from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { useTimer } from '../hooks/useTimer';
import { unlockAudio, playPreviewChime } from '../utils/audio';
import { SessionHistoryModal } from './SessionHistoryModal';
import { TimerMode } from '../types';

interface HeaderControlsProps {
  timer: ReturnType<typeof useTimer>;
  onEnterFocusMode?: () => void;
}

export const HeaderControls: React.FC<HeaderControlsProps> = ({
  timer,
  onEnterFocusMode,
}) => {
  const { settings, update: updateSettings } = useSettings();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const { mode, switchMode, reset, setDevTestDuration } = timer;
  const isMuted = !settings.soundEnabled;

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSettingsOpen) {
        setIsSettingsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSettingsOpen]);

  return (
    <div id="tempo-header-controls" className="flex items-center gap-1.5 sm:gap-2">
      {/* Sound control */}
      <button
        id="timer-control-sound"
        type="button"
        onClick={() => {
          const next = !settings.soundEnabled;
          updateSettings({ soundEnabled: next });
          unlockAudio();
          if (next) {
            playPreviewChime();
          }
        }}
        className="flex h-8 items-center gap-1.5 rounded-md border border-[#202024]/80 bg-[#0E0E11]/80 px-2.5 text-xs font-medium text-[#8A8A90] transition-all hover:border-[#2E2E35] hover:bg-[#141418] hover:text-[#F5F5F7]"
        title={isMuted ? 'Unmute audio' : 'Mute audio'}
        aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
      >
        {isMuted ? (
          <VolumeX className="h-3.5 w-3.5" />
        ) : (
          <Volume2 className="h-3.5 w-3.5" />
        )}
        <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Sound'}</span>
      </button>

      {/* Session preferences control */}
      <div className="relative">
        <button
          id="timer-control-session-settings"
          type="button"
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          className={`flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-all ${
            isSettingsOpen
              ? 'border-[#2E2E35] bg-[#17171A] text-[#F5F5F7]'
              : 'border-[#202024] bg-[#111113] text-[#8A8A90] hover:border-[#2E2E35] hover:bg-[#16161A] hover:text-[#F5F5F7]'
          }`}
          title="Preferences"
          aria-label="Preferences"
          aria-expanded={isSettingsOpen}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Preferences</span>
        </button>

        {/* Session Settings Popover */}
        {isSettingsOpen && (
          <div
            id="session-settings-popover"
            className="absolute right-0 top-10 z-50 w-64 rounded-xl border border-[#24242B] bg-[#0E0E12]/95 backdrop-blur-md p-4 shadow-[0_16px_40px_rgba(0,0,0,0.85)] text-xs select-none"
          >
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#202024]">
              <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-[#8A8A90]">
                Session Modes
              </span>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="text-[#8A8A90] hover:text-[#F5F5F7]"
                aria-label="Close settings"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              {(['focus', 'shortBreak', 'longBreak'] as TimerMode[]).map((m) => {
                const durationLabel =
                  m === 'focus'
                    ? `${settings.focusDurationMinutes}m`
                    : m === 'shortBreak'
                    ? `${settings.shortBreakDurationMinutes}m`
                    : `${settings.longBreakDurationMinutes}m`;

                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      switchMode(m);
                      setIsSettingsOpen(false);
                    }}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-md transition-colors ${
                      mode === m
                        ? 'bg-[#202024] text-[#F5F5F7] font-medium'
                        : 'text-[#8A8A90] hover:bg-[#18181C] hover:text-[#F5F5F7]'
                    }`}
                  >
                    <span className="capitalize font-medium">
                      {m === 'focus'
                        ? 'Focus'
                        : m === 'shortBreak'
                        ? 'Short Break'
                        : 'Long Break'}
                    </span>
                    <span className="font-mono text-[10px] text-[#5F6066]">
                      {durationLabel}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Session History Access */}
            <div className="mt-3 pt-3 border-t border-[#202024] flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsSettingsOpen(false);
                  setIsHistoryOpen(true);
                }}
                className="flex w-full items-center justify-between px-2.5 py-1.5 rounded-md text-[11px] font-medium text-[#8A8A90] hover:bg-[#18181C] hover:text-[#F5F5F7] transition-colors"
              >
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3 w-3 text-[#8A8A90]" />
                  <span>Session History</span>
                </span>
                <span className="font-mono text-[10px] text-[#5F6066]">View</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  reset();
                  setIsSettingsOpen(false);
                }}
                className="flex w-full items-center justify-between px-2.5 py-1.5 rounded-md text-[11px] font-medium text-[#8A8A90] hover:bg-[#18181C] hover:text-[#F5F5F7] transition-colors"
              >
                <span className="inline-flex items-center gap-1.5">
                  <RotateCcw className="h-3 w-3" />
                  <span>Reset session</span>
                </span>
              </button>
            </div>

            {/* Development Test Mode */}
            <div className="mt-3 pt-3 border-t border-[#202024]/70">
              <div className="flex items-center gap-1.5 mb-2 text-[#5F6066]">
                <Terminal className="h-3 w-3" />
                <span className="font-mono text-[9px] uppercase tracking-wider">
                  Dev Testing
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setDevTestDuration(15);
                    setIsSettingsOpen(false);
                  }}
                  className="px-2 py-1 rounded border border-[#202024] bg-[#0E0E11] font-mono text-[10px] text-[#8A8A90] hover:border-[#2E2E35] hover:text-[#F5F5F7] transition-colors"
                  title="Run a 15-second test session"
                >
                  15s Test
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDevTestDuration(30);
                    setIsSettingsOpen(false);
                  }}
                  className="px-2 py-1 rounded border border-[#202024] bg-[#0E0E11] font-mono text-[10px] text-[#8A8A90] hover:border-[#2E2E35] hover:text-[#F5F5F7] transition-colors"
                  title="Run a 30-second test session"
                >
                  30s Test
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enter Focus Mode */}
      {onEnterFocusMode && (
        <button
          id="timer-control-enter-focus-mode"
          type="button"
          onClick={onEnterFocusMode}
          className="flex h-8 items-center gap-1.5 rounded-md border border-[#202024] bg-[#111113] px-2.5 text-xs font-medium text-[#8A8A90] transition-colors hover:border-[#60A5FA]/40 hover:text-[#F5F5F7]"
          title="Enter Distraction-Free Focus Mode"
          aria-label="Enter Focus Mode"
        >
          <Maximize2 className="h-3.5 w-3.5 text-[#60A5FA]" />
          <span className="font-medium text-[#F5F5F7]">Focus Mode</span>
        </button>
      )}

      {/* Session History Modal */}
      <SessionHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
    </div>
  );
};
