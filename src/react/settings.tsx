import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AudioManager } from '../audio/AudioManager.ts';
import { defaultAudio } from '../engine/ConfigManager.ts';
import { prefersReducedMotion, setReducedMotion } from '../theme/ThemeManager.ts';

export interface Settings {
  sound: boolean;
  music: boolean;
  reducedMotion: boolean;
}

const SETTINGS_KEY = 'dond.settings.v1';

function loadSettings(): Settings {
  const base: Settings = { sound: true, music: false, reducedMotion: prefersReducedMotion() };
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return base;
    return { ...base, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    return base;
  }
}

interface SettingsContextValue {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  audio: AudioManager;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const audioRef = useRef<AudioManager | null>(null);
  if (!audioRef.current) audioRef.current = new AudioManager(defaultAudio());
  const audio = audioRef.current;

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((current) => {
      const next = { ...current, ...patch };
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  useEffect(() => {
    audio.setMuted(!settings.sound);
    if (!settings.music) audio.stopMusic();
  }, [audio, settings.sound, settings.music]);

  useEffect(() => {
    setReducedMotion(settings.reducedMotion);
  }, [settings.reducedMotion]);

  // The browser will not make a sound until the user has interacted.
  useEffect(() => {
    const unlock = () => audio.unlock();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [audio]);

  const value = useMemo(() => ({ settings, update, audio }), [settings, update, audio]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used inside <SettingsProvider>');
  return context;
}
