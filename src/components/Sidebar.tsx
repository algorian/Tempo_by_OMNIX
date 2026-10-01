import React, { useState, useEffect } from 'react';
import {
  Timer,
  CheckSquare,
  FolderKanban,
  BarChart3,
  Sparkles,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  X
} from 'lucide-react';
import { NavSection } from '../types';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface SidebarProps {
  activeNav: NavSection;
  onSelectNav: (section: NavSection) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface NavItemConfig {
  id: NavSection;
  label: string;
  icon: React.ElementType;
}

const STORAGE_KEY = 'tempo_sidebar_collapsed';

const NAV_ITEMS: NavItemConfig[] = [
  { id: 'today', label: 'Focus', icon: Timer },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'coach', label: 'AI Coach', icon: Sparkles },
];

function getInitialCollapsed(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      return saved === 'true';
    }
    // Default collapsed state as requested: compact narrow rail
    return true;
  } catch {
    return true;
  }
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeNav,
  onSelectNav,
  isOpen,
  onClose,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(getInitialCollapsed);
  const prefersReducedMotion = useReducedMotion();

  // Toggle collapsed state and persist in localStorage
  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // Ignore storage write errors gracefully
      }
      return next;
    });
  };

  // Keyboard shortcut support:
  // - Escape: closes mobile menu if open
  // - '[': toggles sidebar collapse/expand on desktop (when not inside inputs)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') {
        onClose();
        return;
      }

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

      if (e.key === '[' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        toggleCollapsed();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Determine whether sidebar is in compact mode (desktop collapsed only, not mobile drawer)
  const isCompact = isCollapsed && !isOpen;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          id="sidebar-backdrop"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-xs lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="tempo-sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[#1B1B20] bg-gradient-to-b from-[#08080B] via-[#060608] to-[#050507] flex-shrink-0 lg:static ${
          prefersReducedMotion
            ? 'transition-none'
            : 'transition-[width,padding,transform] duration-200 ease-in-out'
        } ${
          isOpen
            ? 'translate-x-0 w-72 p-6'
            : '-translate-x-full lg:translate-x-0'
        } ${
          isCollapsed
            ? 'lg:w-[68px] lg:px-3 lg:py-5'
            : 'lg:w-[236px] lg:p-5'
        }`}
        aria-label="Application Sidebar"
      >
        <div className="flex flex-col">
          {/* Top Brand & Tagline + Collapse Control */}
          <div
            id="sidebar-brand-header"
            className={`mb-6 flex flex-col ${isCompact ? 'items-center' : ''}`}
          >
            <div
              className={`flex items-center w-full ${
                isCompact
                  ? 'flex-col gap-2.5 justify-center'
                  : 'justify-between'
              }`}
            >
              {/* Brand Logo & Name */}
              <button
                type="button"
                onClick={() => {
                  onSelectNav('today');
                  if (isOpen) onClose();
                }}
                className={`flex items-center gap-2.5 rounded-md text-left transition-opacity hover:opacity-90 outline-none focus-visible:ring-1 focus-visible:ring-[#8A8A90] ${
                  isCompact ? 'p-1' : ''
                }`}
                aria-label="TEMPO - Go to Focus Dashboard"
              >
                <div
                  id="tempo-logo-mark"
                  className="h-2 w-2 rounded-full bg-[#F5F5F7] shadow-[0_0_8px_rgba(245,245,247,0.3)] flex-shrink-0"
                />
                {!isCompact && (
                  <span
                    id="tempo-brand-name"
                    className="font-mono text-sm font-semibold tracking-[0.25em] text-[#F5F5F7]"
                  >
                    TEMPO
                  </span>
                )}
              </button>

              <div className="flex items-center gap-1">
                {/* Desktop Collapse / Expand Toggle Control */}
                <button
                  id="sidebar-collapse-toggle"
                  type="button"
                  onClick={toggleCollapsed}
                  className={`hidden lg:flex relative group h-7 w-7 items-center justify-center rounded-md border border-transparent text-[#8A8A90] hover:border-[#26262E] hover:bg-[#141418] hover:text-[#F5F5F7] transition-all outline-none focus-visible:ring-1 focus-visible:ring-[#8A8A90] ${
                    isCompact ? 'mt-1' : ''
                  }`}
                  aria-label={isCollapsed ? 'Expand sidebar ([)' : 'Collapse sidebar ([)'}
                  aria-expanded={!isCollapsed}
                  title={isCollapsed ? 'Expand sidebar ([)' : 'Collapse sidebar ([)'}
                >
                  {isCollapsed ? (
                    <PanelLeftOpen className="h-4 w-4" />
                  ) : (
                    <PanelLeftClose className="h-4 w-4" />
                  )}

                  {/* Accessible tooltip for collapsed toggle button */}
                  {isCompact && (
                    <div
                      role="tooltip"
                      className="pointer-events-none absolute left-full ml-3 z-50 hidden rounded-md border border-[#26262E] bg-[#111114] px-2.5 py-1 text-xs font-medium text-[#F5F5F7] shadow-[0_4px_16px_rgba(0,0,0,0.8)] group-hover:flex group-focus-visible:flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <span>Expand sidebar</span>
                      <kbd className="font-mono text-[9px] text-[#5F6066]">[</kbd>
                    </div>
                  )}
                </button>

                {/* Mobile Close Button */}
                <button
                  id="sidebar-close-toggle"
                  type="button"
                  onClick={onClose}
                  className="rounded p-1 text-[#8A8A90] hover:text-[#F5F5F7] lg:hidden"
                  aria-label="Close navigation"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Tagline (Expanded only) */}
            {!isCompact && (
              <p
                id="sidebar-tagline"
                className="mt-3 text-xs leading-relaxed text-[#8A8A90] max-w-[195px]"
              >
                A focus system that learns how you work.
              </p>
            )}
          </div>

          {/* Navigation Links */}
          <nav
            id="sidebar-navigation"
            className={`flex flex-col ${isCompact ? 'items-center gap-1.5' : 'gap-1'}`}
          >
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id || (item.id === 'today' && activeNav === 'timer');

              if (isCompact) {
                // COLLAPSED RAIL ITEM
                return (
                  <button
                    key={item.id}
                    id={`nav-item-${item.id}`}
                    type="button"
                    onClick={() => {
                      onSelectNav(item.id);
                      if (isOpen) onClose();
                    }}
                    aria-label={item.label}
                    aria-current={isActive ? 'page' : undefined}
                    className={`group relative flex h-10 w-10 items-center justify-center rounded-lg text-xs tracking-wide transition-all outline-none focus-visible:ring-1 focus-visible:ring-[#8A8A90] ${
                      isActive
                        ? 'border border-[#26262E] bg-gradient-to-b from-[#18181E] to-[#121215] text-[#F5F5F7] shadow-[0_1px_4px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.04)]'
                        : 'border border-transparent text-[#8A8A90] hover:bg-[#0E0E12] hover:text-[#F5F5F7]'
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 transition-colors ${
                        isActive ? 'text-[#F5F5F7]' : 'text-[#5F6066] group-hover:text-[#8A8A90]'
                      }`}
                      strokeWidth={1.75}
                    />

                    {/* Small active-state indicator inside collapsed button */}
                    {isActive && (
                      <div
                        className="absolute left-1 top-1/2 -translate-y-1/2 h-3.5 w-0.5 rounded-full bg-[#F5F5F7] shadow-[0_0_4px_rgba(245,245,247,0.4)]"
                        aria-hidden="true"
                      />
                    )}

                    {/* Hover & Focus Tooltip */}
                    <div
                      role="tooltip"
                      className="pointer-events-none absolute left-full ml-3 z-50 hidden rounded-md border border-[#26262E] bg-[#111114] px-2.5 py-1 text-xs font-medium text-[#F5F5F7] shadow-[0_4px_16px_rgba(0,0,0,0.8)] group-hover:flex group-focus-visible:flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <span>{item.label}</span>
                    </div>
                  </button>
                );
              }

              // EXPANDED / MOBILE ITEM
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  type="button"
                  onClick={() => {
                    onSelectNav(item.id);
                    if (isOpen) onClose();
                  }}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                  className={`group flex items-center justify-between rounded-lg px-3 py-2 text-xs tracking-wide transition-all outline-none focus-visible:ring-1 focus-visible:ring-[#8A8A90] ${
                    isActive
                      ? 'border border-[#26262E] bg-gradient-to-b from-[#18181E] to-[#121215] text-[#F5F5F7] shadow-[0_1px_4px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.04)]'
                      : 'border border-transparent text-[#8A8A90] hover:bg-[#0E0E12] hover:text-[#F5F5F7]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`h-4 w-4 transition-colors ${
                        isActive ? 'text-[#F5F5F7]' : 'text-[#5F6066] group-hover:text-[#8A8A90]'
                      }`}
                      strokeWidth={1.75}
                    />
                    <span className="font-medium truncate">{item.label}</span>
                  </div>
                  {isActive && (
                    <div
                      className="h-1 w-1 rounded-full bg-[#F5F5F7] shadow-[0_0_6px_rgba(245,245,247,0.4)]"
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Settings Section: Bottom-anchored within navigation area, visually separated */}
          <div
            id="sidebar-settings-section"
            className={`mt-3 pt-3 border-t border-[#1C1C22] ${
              isCompact ? 'flex justify-center w-full' : 'w-full'
            }`}
          >
            {isCompact ? (
              // COLLAPSED SETTINGS ITEM
              <button
                id="nav-item-settings"
                type="button"
                onClick={() => {
                  onSelectNav('settings');
                  if (isOpen) onClose();
                }}
                aria-label="Settings"
                aria-current={activeNav === 'settings' ? 'page' : undefined}
                className={`group relative flex h-10 w-10 items-center justify-center rounded-lg text-xs tracking-wide transition-all outline-none focus-visible:ring-1 focus-visible:ring-[#8A8A90] ${
                  activeNav === 'settings'
                    ? 'border border-[#26262E] bg-gradient-to-b from-[#18181E] to-[#121215] text-[#F5F5F7] shadow-[0_1px_4px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.04)]'
                    : 'border border-transparent text-[#8A8A90] hover:bg-[#0E0E12] hover:text-[#F5F5F7]'
                }`}
              >
                <Settings
                  className={`h-4 w-4 transition-colors ${
                    activeNav === 'settings'
                      ? 'text-[#F5F5F7]'
                      : 'text-[#5F6066] group-hover:text-[#8A8A90]'
                  }`}
                  strokeWidth={1.75}
                />

                {/* Small active-state indicator */}
                {activeNav === 'settings' && (
                  <div
                    className="absolute left-1 top-1/2 -translate-y-1/2 h-3.5 w-0.5 rounded-full bg-[#F5F5F7] shadow-[0_0_4px_rgba(245,245,247,0.4)]"
                    aria-hidden="true"
                  />
                )}

                {/* Hover & Focus Tooltip */}
                <div
                  role="tooltip"
                  className="pointer-events-none absolute left-full ml-3 z-50 hidden rounded-md border border-[#26262E] bg-[#111114] px-2.5 py-1 text-xs font-medium text-[#F5F5F7] shadow-[0_4px_16px_rgba(0,0,0,0.8)] group-hover:flex group-focus-visible:flex items-center gap-1.5 whitespace-nowrap"
                >
                  <span>Settings</span>
                  <span className="font-mono text-[10px] text-[#5F6066]">⌘,</span>
                </div>
              </button>
            ) : (
              // EXPANDED / MOBILE SETTINGS ITEM
              <button
                id="nav-item-settings"
                type="button"
                onClick={() => {
                  onSelectNav('settings');
                  if (isOpen) onClose();
                }}
                aria-label="Settings"
                aria-current={activeNav === 'settings' ? 'page' : undefined}
                className={`group flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs tracking-wide transition-all outline-none focus-visible:ring-1 focus-visible:ring-[#8A8A90] ${
                  activeNav === 'settings'
                    ? 'border border-[#26262E] bg-gradient-to-b from-[#18181E] to-[#121215] text-[#F5F5F7] shadow-[0_1px_4px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.04)]'
                    : 'border border-transparent text-[#8A8A90] hover:bg-[#0E0E12] hover:text-[#F5F5F7]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Settings
                    className={`h-4 w-4 transition-colors ${
                      activeNav === 'settings'
                        ? 'text-[#F5F5F7]'
                        : 'text-[#5F6066] group-hover:text-[#8A8A90]'
                    }`}
                    strokeWidth={1.75}
                  />
                  <span className="font-medium truncate">Settings</span>
                </div>
                <span className="text-[10px] font-mono text-[#5F6066]">⌘,</span>
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

