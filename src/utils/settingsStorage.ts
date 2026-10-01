export interface AppSettings {
  focusDurationMinutes: number;
  shortBreakDurationMinutes: number;
  longBreakDurationMinutes: number;
  soundEnabled: boolean;
  reducedMotion: 'system' | 'reduced' | 'normal';
  focusModeFullscreen: boolean;
  aiCoachEnabled: boolean;
}

export const SETTINGS_STORAGE_KEY = 'tempo_settings';

export const DEFAULT_SETTINGS: AppSettings = {
  focusDurationMinutes: 50,
  shortBreakDurationMinutes: 10,
  longBreakDurationMinutes: 20,
  soundEnabled: true,
  reducedMotion: 'system',
  focusModeFullscreen: false,
  aiCoachEnabled: true,
};

export function getSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;

    return {
      focusDurationMinutes:
        typeof parsed.focusDurationMinutes === 'number' && parsed.focusDurationMinutes > 0
          ? parsed.focusDurationMinutes
          : DEFAULT_SETTINGS.focusDurationMinutes,
      shortBreakDurationMinutes:
        typeof parsed.shortBreakDurationMinutes === 'number' && parsed.shortBreakDurationMinutes > 0
          ? parsed.shortBreakDurationMinutes
          : DEFAULT_SETTINGS.shortBreakDurationMinutes,
      longBreakDurationMinutes:
        typeof parsed.longBreakDurationMinutes === 'number' && parsed.longBreakDurationMinutes > 0
          ? parsed.longBreakDurationMinutes
          : DEFAULT_SETTINGS.longBreakDurationMinutes,
      soundEnabled:
        typeof parsed.soundEnabled === 'boolean'
          ? parsed.soundEnabled
          : DEFAULT_SETTINGS.soundEnabled,
      reducedMotion:
        parsed.reducedMotion === 'reduced' || parsed.reducedMotion === 'normal'
          ? parsed.reducedMotion
          : 'system',
      focusModeFullscreen:
        typeof parsed.focusModeFullscreen === 'boolean'
          ? parsed.focusModeFullscreen
          : DEFAULT_SETTINGS.focusModeFullscreen,
      aiCoachEnabled:
        typeof parsed.aiCoachEnabled === 'boolean'
          ? parsed.aiCoachEnabled
          : DEFAULT_SETTINGS.aiCoachEnabled,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(updates: Partial<AppSettings>): AppSettings {
  const current = getSettings();
  const next: AppSettings = {
    ...current,
    ...updates,
  };

  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tempo_settings_updated', { detail: next }));
    }
  } catch (err) {
    console.warn('Unable to persist tempo settings to localStorage', err);
  }

  return next;
}

export function resetSettings(): AppSettings {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tempo_settings_updated', { detail: DEFAULT_SETTINGS }));
    }
  } catch (err) {
    console.warn('Unable to reset tempo settings', err);
  }
  return DEFAULT_SETTINGS;
}
