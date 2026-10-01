import { useState, useEffect, useCallback } from 'react';
import { AppSettings, getSettings, saveSettings, resetSettings } from '../utils/settingsStorage';

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => getSettings());

  useEffect(() => {
    const handleUpdate = () => {
      setSettings(getSettings());
    };

    window.addEventListener('tempo_settings_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('tempo_settings_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const update = useCallback((updates: Partial<AppSettings>) => {
    const updated = saveSettings(updates);
    setSettings(updated);
  }, []);

  const reset = useCallback(() => {
    const defaultSettings = resetSettings();
    setSettings(defaultSettings);
  }, []);

  return {
    settings,
    update,
    reset,
  };
}
