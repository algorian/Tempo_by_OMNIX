import { useState, useEffect } from 'react';
import { getSettings } from '../utils/settingsStorage';

export function useReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(() => {
    if (typeof window === 'undefined') return false;
    const settings = getSettings();
    if (settings.reducedMotion === 'reduced') return true;
    if (settings.reducedMotion === 'normal') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const checkMotionPreference = () => {
      const settings = getSettings();
      if (settings.reducedMotion === 'reduced') {
        setPrefersReduced(true);
        return;
      }
      if (settings.reducedMotion === 'normal') {
        setPrefersReduced(false);
        return;
      }
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReduced(mediaQuery.matches);
    };

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMediaChange = () => checkMotionPreference();
    const handleSettingsChange = () => checkMotionPreference();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange);
    }
    window.addEventListener('tempo_settings_updated', handleSettingsChange);
    window.addEventListener('storage', handleSettingsChange);

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaChange);
      }
      window.removeEventListener('tempo_settings_updated', handleSettingsChange);
      window.removeEventListener('storage', handleSettingsChange);
    };
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (prefersReduced) {
        document.documentElement.setAttribute('data-reduced-motion', 'true');
      } else {
        document.documentElement.removeAttribute('data-reduced-motion');
      }
    }
  }, [prefersReduced]);

  return prefersReduced;
}
