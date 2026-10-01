import React, { useState } from 'react';
import { NavSection } from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { HeaderControls } from './components/HeaderControls';
import { TimerPanel } from './components/TimerPanel';
import { FocusNote } from './components/FocusNote';
import { ProjectsView } from './components/ProjectsView';
import { TasksView } from './components/TasksView';
import { AnalyticsView } from './components/AnalyticsView';
import { FocusModeView } from './components/FocusModeView';
import { AICoachView } from './components/AICoachView';
import { SettingsView } from './components/SettingsView';
import { SessionRecoveryBanner } from './components/SessionRecoveryBanner';
import { AtmosphericBackground } from './components/AtmosphericBackground';
import { useTimer } from './hooks/useTimer';
import { useReducedMotion } from './hooks/useReducedMotion';
import { ArrowLeft } from 'lucide-react';

export default function App() {
  const [activeNav, setActiveNav] = useState<NavSection>('today');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);

  // Synchronizes motion state across the system
  useReducedMotion();
  const timer = useTimer();

  // Centralized keyboard shortcuts for the primary Focus dashboard
  React.useEffect(() => {
    if (isFocusMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Guard: Never trigger shortcuts when user is focused on interactive form elements
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      // 2. Guard: Do not intercept keys if any modal or dialog is active
      if (
        timer.isFinishEarlyModalOpen ||
        Boolean(timer.completedSessionForModal) ||
        document.querySelector('[role="dialog"], [aria-modal="true"]')
      ) {
        return;
      }

      // 3. Guard: Do not intercept browser native shortcut combos (Cmd/Ctrl/Alt)
      if (e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      // 4. Guard: Only active on the primary Focus/Today dashboard
      if (activeNav !== 'today' && activeNav !== 'timer') {
        return;
      }

      // SPACE: Pause / Resume active session
      if (e.code === 'Space') {
        e.preventDefault();
        if (timer.status === 'paused' || timer.status === 'completed') {
          timer.resume();
        } else if (timer.status === 'focus') {
          timer.pause();
        }
      }

      // F: Enter Focus Mode
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        setIsFocusMode(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFocusMode, activeNav, timer]);

  // Full distraction-free Focus Mode (Screen gets quiet, only essential instrument elements)
  if (isFocusMode) {
    return (
      <FocusModeView
        timer={timer}
        onExit={() => setIsFocusMode(false)}
      />
    );
  }

  const isFocusPage = activeNav === 'today' || activeNav === 'timer';

  return (
    <div
      id="tempo-root"
      className="relative flex min-h-screen w-full bg-[#050505] text-[#F5F5F7] font-sans antialiased selection:bg-[#202024] selection:text-[#F5F5F7]"
    >
      {/* Layered Spatial Atmospheric Environment */}
      <AtmosphericBackground status={timer.status} />

      {/* Refined Left Sidebar */}
      <Sidebar
        activeNav={activeNav}
        onSelectNav={(section) => {
          setActiveNav(section);
          setIsMobileMenuOpen(false);
        }}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div
        id="tempo-main-wrapper"
        className={`relative z-10 flex flex-1 flex-col ${
          isFocusPage
            ? 'h-[100dvh] max-h-[100dvh] overflow-hidden'
            : 'min-h-screen overflow-x-hidden overflow-y-auto'
        }`}
      >
        <div
          id="tempo-content-viewport"
          className={`mx-auto w-full ${
            isFocusPage
              ? 'max-w-4xl lg:max-w-5xl h-full max-h-[100dvh] flex flex-col justify-between px-4 py-3 sm:px-8 sm:py-5 lg:px-10 lg:py-6 overflow-hidden'
              : 'max-w-7xl px-4 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10'
          }`}
        >
          {isFocusPage ? (
            /* Primary Visual Experience: Focused Minimal Non-scrolling Instrument */
            <div
              key="today"
              id="today-page-view"
              className="relative flex flex-col flex-1 h-full min-h-0 justify-between items-center tempo-page-enter overflow-hidden w-full"
            >
              {/* 1. Header (Aligned to same content boundaries) */}
              <div className="w-full shrink-0">
                <Header
                  onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
                  rightContent={
                    <HeaderControls
                      timer={timer}
                      onEnterFocusMode={() => setIsFocusMode(true)}
                    />
                  }
                />
              </div>

              {/* 2. Active Session Recovery Banner (if an interrupted session was detected) */}
              {timer.interruptedSession && (
                <div className="w-full shrink-0 my-1">
                  <SessionRecoveryBanner
                    recovery={timer.interruptedSession}
                    onResume={timer.resumeInterruptedSession}
                    onEnd={timer.endInterruptedSession}
                    onDismiss={timer.dismissInterruptedSession}
                  />
                </div>
              )}

              {/* 3. Focus Timer Panel (Occupies shared content width, centered with generous negative space) */}
              <div className="w-full flex-1 min-h-0 flex items-center justify-center my-auto tempo-stagger-1">
                <TimerPanel
                  timer={timer}
                  onEnterFocusMode={() => setIsFocusMode(true)}
                />
              </div>

              {/* 4. Environmental Focus Quote (In-flow layout, right-aligned to content grid, never absolute) */}
              <footer
                id="tempo-focus-footer"
                className="w-full shrink-0 flex items-center justify-center sm:justify-end pt-2 pb-1 select-none tempo-stagger-2"
              >
                <div className="max-w-sm sm:max-w-md text-center sm:text-right">
                  <FocusNote />
                </div>
              </footer>
            </div>
          ) : activeNav === 'projects' ? (
            /* Functional Projects System */
            <div key="projects" id="projects-page-view" className="flex flex-col gap-6 tempo-page-enter">
              <Header onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />
              <ProjectsView onSelectToday={() => setActiveNav('today')} />
            </div>
          ) : activeNav === 'tasks' ? (
            /* Functional Tasks Inventory View */
            <div key="tasks" id="tasks-page-view" className="flex flex-col gap-6 tempo-page-enter">
              <Header onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />
              <TasksView onSelectToday={() => setActiveNav('today')} />
            </div>
          ) : activeNav === 'analytics' ? (
            /* Functional Full Analytics View */
            <div key="analytics" id="analytics-page-view" className="flex flex-col gap-6 tempo-page-enter">
              <Header onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />
              <AnalyticsView onSelectToday={() => setActiveNav('today')} />
            </div>
          ) : activeNav === 'coach' ? (
            /* Grounded AI Focus Coach Telemetry Review */
            <div key="coach" id="coach-page-view" className="flex flex-col gap-6 tempo-page-enter">
              <Header onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />
              <AICoachView
                activeSession={timer.session}
                onSelectToday={() => setActiveNav('today')}
              />
            </div>
          ) : activeNav === 'settings' ? (
            /* System Settings View */
            <div key="settings" id="settings-page-view" className="flex flex-col gap-6 tempo-page-enter">
              <Header onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />
              <SettingsView onSelectToday={() => setActiveNav('today')} />
            </div>
          ) : (
            /* Fallback view container */
            <div key="fallback" id="secondary-view-container" className="flex flex-col gap-6 tempo-page-enter">
              <Header onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />

              <div
                id={`view-panel-${activeNav}`}
                className="rounded-2xl border border-[#202024] bg-[#0B0B0D] tempo-card-surface p-8 sm:p-12 shadow-xs"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      id="back-to-today-btn"
                      type="button"
                      onClick={() => setActiveNav('today')}
                      className="inline-flex items-center gap-1.5 rounded-md border border-[#202024] bg-[#111113] px-3 py-1.5 text-xs text-[#8A8A90] hover:text-[#F5F5F7] transition-colors"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>Back to Focus</span>
                    </button>
                    <span className="font-mono text-xs uppercase tracking-widest text-[#5F6066]">
                      / {activeNav}
                    </span>
                  </div>

                  <h2 className="font-mono text-2xl sm:text-3xl font-light tracking-tight text-[#F5F5F7] capitalize">
                    {activeNav}
                  </h2>

                  <p className="max-w-xl text-xs sm:text-sm leading-relaxed text-[#8A8A90]">
                    Focus sessions and active goals are anchored to your primary focus dashboard.
                  </p>

                  <div className="mt-6 pt-6 border-t border-[#202024]/60">
                    <button
                      id="open-today-view-cta"
                      type="button"
                      onClick={() => setActiveNav('today')}
                      className="rounded-lg border border-[#202024] bg-[#111113] px-4 py-2 text-xs font-medium text-[#F5F5F7] hover:bg-[#161619] transition-colors"
                    >
                      Return to Focus Dashboard
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
