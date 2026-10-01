import React, { useRef, useState } from 'react';
import {
  ArrowLeft,
  Sliders,
  Volume2,
  VolumeX,
  Palette,
  Activity,
  Maximize2,
  Sparkles,
  RotateCcw,
  Download,
  Upload,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { unlockAudio, playPreviewChime } from '../utils/audio';
import {
  downloadTempoBackup,
  validateTempoBackup,
  importTempoData,
  TempoBackup,
} from '../utils/dataBackup';

interface SettingsViewProps {
  onSelectToday: () => void;
}

const FOCUS_DURATION_OPTIONS = [
  { value: 25, label: '25 min' },
  { value: 45, label: '45 min' },
  { value: 50, label: '50 min' },
  { value: 60, label: '60 min' },
];

const SHORT_BREAK_OPTIONS = [
  { value: 5, label: '5 min' },
  { value: 10, label: '10 min' },
  { value: 15, label: '15 min' },
];

const LONG_BREAK_OPTIONS = [
  { value: 15, label: '15 min' },
  { value: 20, label: '20 min' },
  { value: 30, label: '30 min' },
];

export const SettingsView: React.FC<SettingsViewProps> = ({ onSelectToday }) => {
  const { settings, update, reset } = useSettings();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importCandidate, setImportCandidate] = useState<TempoBackup | null>(null);
  const [importSummary, setImportSummary] = useState<{
    tasksCount: number;
    projectsCount: number;
    sessionsCount: number;
  } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = () => {
    downloadTempoBackup();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setImportError(null);
    setImportSuccessMessage(null);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const validation = validateTempoBackup(parsed);

        if (!validation.valid || !validation.data) {
          setImportError(validation.error || 'Invalid backup structure.');
          return;
        }

        setImportCandidate(validation.data);
        setImportSummary(validation.summary || null);
        setIsConfirmModalOpen(true);
      } catch {
        setImportError('Failed to parse file. The backup file is corrupted or not valid JSON.');
      }
    };

    reader.onerror = () => {
      setImportError('An error occurred while reading the backup file.');
    };

    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (!importCandidate) return;
    setIsImporting(true);

    const success = importTempoData(importCandidate);
    if (success) {
      // 1. Immediately close the confirmation modal
      setIsConfirmModalOpen(false);
      // 2. Clear/reset any import candidate state
      setImportCandidate(null);
      setImportSummary(null);
      setIsImporting(false);
      setImportError(null);
      // 3. Set an appropriate temporary success state/message
      setImportSuccessMessage('Backup restored successfully. Reloading TEMPO…');
      // 4. Schedule the existing reload
      setTimeout(() => {
        window.location.reload();
      }, 150);
    } else {
      setIsImporting(false);
      setIsConfirmModalOpen(false);
      setImportCandidate(null);
      setImportSummary(null);
      setImportError('Failed to restore backup to local storage. Check browser storage quota.');
    }
  };

  return (
    <div id="settings-view-container" className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#202024]/70">
        <div>
          <div className="flex items-center gap-3">
            <button
              id="settings-back-to-today-btn"
              type="button"
              onClick={onSelectToday}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#202024] bg-[#111113] px-2.5 py-1 text-xs text-[#8A8A90] hover:text-[#F5F5F7] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Focus</span>
            </button>
            <div className="flex items-center gap-1.5 text-xs text-[#5F6066] font-mono uppercase tracking-wider">
              <Sliders className="h-3.5 w-3.5 text-[#8A8A90]" />
              <span>System Preferences</span>
            </div>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-light tracking-tight text-[#F5F5F7]">
            Settings
          </h1>
        </div>

        <button
          id="settings-reset-defaults-btn"
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#202024] bg-[#111113] px-3.5 py-1.5 text-xs text-[#8A8A90] hover:border-[#2E2E35] hover:text-[#F5F5F7] transition-colors"
          title="Reset all settings to default values"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset Defaults</span>
        </button>
      </div>

      {/* Settings Grid / Stack */}
      <div className="flex flex-col gap-5 max-w-3xl">
        {/* 1. FOCUS CADENCE */}
        <section
          id="settings-section-focus"
          className="flex flex-col gap-4 rounded-xl border border-[#202024] bg-[#0B0B0D] tempo-card-surface p-5 sm:p-6 shadow-xs"
        >
          <div className="flex items-center gap-2 pb-2 border-b border-[#202024]/60">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8A8A90]">
              FOCUS CADENCE
            </span>
          </div>

          <div className="flex flex-col gap-4">
            {/* Focus Duration */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-[#F5F5F7]">Default Focus Duration</p>
                <p className="text-[11px] text-[#5F6066]">Base interval length for deep work sessions.</p>
              </div>
              <div className="flex items-center gap-1.5 bg-[#111113] p-1 rounded-lg border border-[#202024]">
                {FOCUS_DURATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => update({ focusDurationMinutes: opt.value })}
                    className={`px-2.5 py-1 text-xs rounded-md font-mono transition-colors ${
                      settings.focusDurationMinutes === opt.value
                        ? 'bg-[#202024] text-[#F5F5F7] font-medium'
                        : 'text-[#8A8A90] hover:text-[#F5F5F7]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Short Break */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-[#202024]/40">
              <div>
                <p className="text-xs font-medium text-[#F5F5F7]">Short Break Duration</p>
                <p className="text-[11px] text-[#5F6066]">Rest interval between consecutive sessions.</p>
              </div>
              <div className="flex items-center gap-1.5 bg-[#111113] p-1 rounded-lg border border-[#202024]">
                {SHORT_BREAK_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => update({ shortBreakDurationMinutes: opt.value })}
                    className={`px-2.5 py-1 text-xs rounded-md font-mono transition-colors ${
                      settings.shortBreakDurationMinutes === opt.value
                        ? 'bg-[#202024] text-[#F5F5F7] font-medium'
                        : 'text-[#8A8A90] hover:text-[#F5F5F7]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Long Break */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-[#202024]/40">
              <div>
                <p className="text-xs font-medium text-[#F5F5F7]">Long Break Duration</p>
                <p className="text-[11px] text-[#5F6066]">Extended recovery interval after 4 focus blocks.</p>
              </div>
              <div className="flex items-center gap-1.5 bg-[#111113] p-1 rounded-lg border border-[#202024]">
                {LONG_BREAK_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => update({ longBreakDurationMinutes: opt.value })}
                    className={`px-2.5 py-1 text-xs rounded-md font-mono transition-colors ${
                      settings.longBreakDurationMinutes === opt.value
                        ? 'bg-[#202024] text-[#F5F5F7] font-medium'
                        : 'text-[#8A8A90] hover:text-[#F5F5F7]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-[#202024]/30">
              <p className="text-[10px] text-[#5F6066] font-mono">
                Duration changes apply to new sessions. Running sessions remain stable.
              </p>
            </div>
          </div>
        </section>

        {/* 2. SOUND & FEEDBACK */}
        <section
          id="settings-section-sound"
          className="flex flex-col gap-4 rounded-xl border border-[#202024] bg-[#0B0B0D] tempo-card-surface p-5 sm:p-6 shadow-xs"
        >
          <div className="flex items-center gap-2 pb-2 border-b border-[#202024]/60">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8A8A90]">
              SOUND & FEEDBACK
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings.soundEnabled ? (
                <Volume2 className="h-4 w-4 text-[#60A5FA]" />
              ) : (
                <VolumeX className="h-4 w-4 text-[#5F6066]" />
              )}
              <div>
                <p className="text-xs font-medium text-[#F5F5F7]">Auditory Chime</p>
                <p className="text-[11px] text-[#5F6066]">Subtle acoustic chime upon session completion.</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {settings.soundEnabled && (
                <button
                  id="settings-test-chime-btn"
                  type="button"
                  onClick={() => {
                    unlockAudio();
                    playPreviewChime();
                  }}
                  className="rounded-md border border-[#202024] bg-[#141418] px-2.5 py-1 text-[11px] font-mono text-[#8A8A90] hover:text-[#F5F5F7] hover:border-[#2E2E35] transition-colors"
                  title="Test completion chime"
                >
                  Test
                </button>
              )}

              <button
                id="settings-toggle-sound"
                type="button"
                onClick={() => {
                  const next = !settings.soundEnabled;
                  update({ soundEnabled: next });
                  unlockAudio();
                  if (next) {
                    playPreviewChime();
                  }
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.soundEnabled ? 'bg-[#3B82F6]' : 'bg-[#202024]'
                }`}
                role="switch"
                aria-checked={settings.soundEnabled}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* 3. APPEARANCE & MOTION */}
        <section
          id="settings-section-appearance"
          className="flex flex-col gap-4 rounded-xl border border-[#202024] bg-[#0B0B0D] tempo-card-surface p-5 sm:p-6 shadow-xs"
        >
          <div className="flex items-center gap-2 pb-2 border-b border-[#202024]/60">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8A8A90]">
              APPEARANCE & MOTION
            </span>
          </div>

          <div className="flex flex-col gap-4">
            {/* Theme */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Palette className="h-4 w-4 text-[#8A8A90]" />
                <div>
                  <p className="text-xs font-medium text-[#F5F5F7]">Obsidian Dark Canvas</p>
                  <p className="text-[11px] text-[#5F6066]">Pure OLED-safe deep neutral surfaces.</p>
                </div>
              </div>
              <span className="font-mono text-xs text-[#5F6066] uppercase bg-[#111113] border border-[#202024] px-2.5 py-1 rounded-md">
                Active Default
              </span>
            </div>

            {/* Reduced Motion */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-[#202024]/40">
              <div className="flex items-center gap-3">
                <Activity className="h-4 w-4 text-[#8A8A90]" />
                <div>
                  <p className="text-xs font-medium text-[#F5F5F7]">Animation & Motion</p>
                  <p className="text-[11px] text-[#5F6066]">Motion behavior for Orbit Clock and UI transitions.</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-[#111113] p-1 rounded-lg border border-[#202024]">
                {(['system', 'reduced', 'normal'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => update({ reducedMotion: m })}
                    className={`px-2.5 py-1 text-xs rounded-md capitalize transition-colors ${
                      settings.reducedMotion === m
                        ? 'bg-[#202024] text-[#F5F5F7] font-medium'
                        : 'text-[#8A8A90] hover:text-[#F5F5F7]'
                    }`}
                  >
                    {m === 'system' ? 'System' : m === 'reduced' ? 'Reduced' : 'Full'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 4. FOCUS MODE */}
        <section
          id="settings-section-focus-mode"
          className="flex flex-col gap-4 rounded-xl border border-[#202024] bg-[#0B0B0D] tempo-card-surface p-5 sm:p-6 shadow-xs"
        >
          <div className="flex items-center gap-2 pb-2 border-b border-[#202024]/60">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8A8A90]">
              DISTRACTION-FREE FOCUS MODE
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Maximize2 className="h-4 w-4 text-[#8A8A90]" />
              <div>
                <p className="text-xs font-medium text-[#F5F5F7]">Auto-Fullscreen Prompt</p>
                <p className="text-[11px] text-[#5F6066]">
                  Request browser fullscreen automatically upon entering Focus Mode.
                </p>
              </div>
            </div>

            <button
              id="settings-toggle-fullscreen"
              type="button"
              onClick={() => update({ focusModeFullscreen: !settings.focusModeFullscreen })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.focusModeFullscreen ? 'bg-[#3B82F6]' : 'bg-[#202024]'
              }`}
              role="switch"
              aria-checked={settings.focusModeFullscreen}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.focusModeFullscreen ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </section>

        {/* 5. AI COACH & TELEMETRY */}
        <section
          id="settings-section-ai"
          className="flex flex-col gap-4 rounded-xl border border-[#202024] bg-[#0B0B0D] tempo-card-surface p-5 sm:p-6 shadow-xs"
        >
          <div className="flex items-center gap-2 pb-2 border-b border-[#202024]/60">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8A8A90]">
              AI FOCUS COACH & TELEMETRY
            </span>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="h-4 w-4 text-[#8A8A90]" />
                <div>
                  <p className="text-xs font-medium text-[#F5F5F7]">Grounded Telemetry Observation</p>
                  <p className="text-[11px] text-[#5F6066]">
                    Allow AI coach to review weekly cadence (strictly requires ≥3 sessions).
                  </p>
                </div>
              </div>

              <button
                id="settings-toggle-ai-coach"
                type="button"
                onClick={() => update({ aiCoachEnabled: !settings.aiCoachEnabled })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.aiCoachEnabled ? 'bg-[#3B82F6]' : 'bg-[#202024]'
                }`}
                role="switch"
                aria-checked={settings.aiCoachEnabled}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.aiCoachEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="rounded-lg border border-[#202024]/80 bg-[#111113] p-3 text-[11px] text-[#8A8A90] leading-relaxed">
              <span className="text-[#F5F5F7] font-medium">Architecture Note:</span> TEMPO's Focus Score and analytics are strictly deterministic. The AI Coach provides non-intrusive interpretations of real telemetry only, never altering or inventing your productivity metrics.
            </div>
          </div>
        </section>

        {/* 6. DATA BACKUP & PORTABILITY */}
        <section
          id="settings-section-backup"
          className="flex flex-col gap-4 rounded-xl border border-[#202024] bg-[#0B0B0D] tempo-card-surface p-5 sm:p-6 shadow-xs"
        >
          <div className="flex items-center gap-2 pb-2 border-b border-[#202024]/60">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8A8A90]">
              DATA BACKUP & PORTABILITY
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-[#F5F5F7]">Local Workspace Archive</p>
              <p className="text-[11px] text-[#5F6066] mt-0.5 max-w-md">
                Export your tasks, projects, and focus logs as a JSON backup, or restore a previously exported archive.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                id="settings-export-data-btn"
                type="button"
                onClick={handleExport}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#202024] bg-[#141417] px-3.5 py-1.5 text-xs font-medium text-[#F5F5F7] hover:bg-[#1C1C22] hover:border-[#2E2E35] transition-colors"
              >
                <Download className="h-3.5 w-3.5 text-[#8A8A90]" />
                <span>Export Data</span>
              </button>

              <button
                id="settings-import-data-btn"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#202024] bg-[#141417] px-3.5 py-1.5 text-xs font-medium text-[#F5F5F7] hover:bg-[#1C1C22] hover:border-[#2E2E35] transition-colors"
              >
                <Upload className="h-3.5 w-3.5 text-[#8A8A90]" />
                <span>Import Data</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelected}
                className="hidden"
              />
            </div>
          </div>

          {importSuccessMessage && (
            <div
              id="settings-import-success"
              className="flex items-start gap-2.5 rounded-lg border border-[#1E3A5F]/70 bg-[#0C1929] p-3 text-xs text-[#93C5FD]"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[#60A5FA] mt-0.5" />
              <div>
                <p className="font-medium text-[#BFDBFE]">Restore Completed</p>
                <p className="text-[11px] text-[#93C5FD] mt-0.5">{importSuccessMessage}</p>
              </div>
            </div>
          )}

          {importError && (
            <div
              id="settings-import-error"
              className="flex items-start justify-between gap-2.5 rounded-lg border border-[#7F1D1D]/60 bg-[#1A0A0A] p-3 text-xs text-[#FCA5A5]"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-[#EF4444] mt-0.5" />
                <div>
                  <p className="font-medium text-[#FCA5A5]">Import Rejected</p>
                  <p className="text-[11px] text-[#F87171] mt-0.5">{importError}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setImportError(null)}
                className="text-[#FCA5A5] hover:text-white text-xs px-1"
                aria-label="Dismiss import error"
              >
                ✕
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Import Confirmation Dialog */}
      {isConfirmModalOpen && importCandidate && (
        <div
          id="backup-confirm-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="backup-confirm-title"
        >
          <div
            id="backup-confirm-modal-content"
            className="w-full max-w-md rounded-xl border border-[#202024] bg-[#0E0E11] p-6 shadow-2xl text-left"
          >
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#202024]/70">
              <Upload className="h-4 w-4 text-[#93C5FD]" />
              <h3 id="backup-confirm-title" className="text-sm font-medium text-[#F5F5F7]">
                Restore TEMPO Workspace
              </h3>
            </div>

            <p className="mt-3 text-xs text-[#8A8A90] leading-relaxed">
              This will replace your current TEMPO workspace with the data from this backup:
            </p>

            {/* Summary Badges */}
            <div className="mt-3 grid grid-cols-3 gap-2 py-2">
              <div className="rounded-lg border border-[#202024] bg-[#141417] p-2.5 text-center">
                <span className="block font-mono text-[10px] uppercase text-[#5F6066]">Tasks</span>
                <span className="font-mono text-base font-light text-[#F5F5F7] mt-0.5">
                  {importSummary?.tasksCount ?? 0}
                </span>
              </div>
              <div className="rounded-lg border border-[#202024] bg-[#141417] p-2.5 text-center">
                <span className="block font-mono text-[10px] uppercase text-[#5F6066]">Projects</span>
                <span className="font-mono text-base font-light text-[#F5F5F7] mt-0.5">
                  {importSummary?.projectsCount ?? 0}
                </span>
              </div>
              <div className="rounded-lg border border-[#202024] bg-[#141417] p-2.5 text-center">
                <span className="block font-mono text-[10px] uppercase text-[#5F6066]">Sessions</span>
                <span className="font-mono text-base font-light text-[#F5F5F7] mt-0.5">
                  {importSummary?.sessionsCount ?? 0}
                </span>
              </div>
            </div>

            <div className="mt-2 rounded-lg border border-[#3E2310] bg-[#1A120A] p-2.5 text-[11px] text-[#FDBA74] leading-relaxed">
              <span className="font-medium text-[#FED7AA]">Warning:</span> Existing tasks, projects, and focus logs will be replaced. Any active timer session will be reset cleanly.
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                id="backup-cancel-import-btn"
                type="button"
                onClick={() => {
                  setIsConfirmModalOpen(false);
                  setImportCandidate(null);
                  setImportSummary(null);
                }}
                disabled={isImporting}
                className="h-9 px-3.5 rounded-lg border border-[#202024] bg-[#141417] text-xs font-medium text-[#8A8A90] hover:text-[#F5F5F7] hover:border-[#2E2E35] transition-colors"
              >
                Cancel
              </button>

              <button
                id="backup-confirm-import-btn"
                type="button"
                onClick={handleConfirmImport}
                disabled={isImporting}
                className="h-9 px-4 rounded-lg border border-[#2B3E66] bg-[#1A263D] text-xs font-medium text-[#93C5FD] hover:bg-[#223352] hover:border-[#3B5488] transition-colors"
              >
                {isImporting ? 'Restoring...' : 'Replace & Restore'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
