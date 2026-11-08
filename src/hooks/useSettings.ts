import { useState, useEffect } from 'react';
import type { UserSettings } from '@/types/database';

const SETTINGS_KEY = 'kioxiyo_user_settings';

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'system',
  isSwipeReversed: false,
  authorName: '',
};

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // fallback
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  }, [settings]);

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return {
    settings,
    updateSetting,
    updateSettings,
    setIsSwipeReversed: (reversed: boolean) => updateSetting('isSwipeReversed', reversed),
    setAuthorName: (name: string) => updateSetting('authorName', name),
  };
}
