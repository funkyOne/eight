import { useState, useEffect } from "preact/hooks";
import { AnnouncementMode, setAnnouncementMode, getAnnouncementMode } from "../utils/announcements";

const STORAGE_KEY = "eye-exercise-settings";

interface Settings {
  voiceMode: AnnouncementMode;
}

const defaultSettings: Settings = {
  voiceMode: "mp3",
};

function loadSettings(): Settings {
  if (typeof window === "undefined") return defaultSettings;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<Settings>;
      return { ...defaultSettings, ...parsed };
    }
  } catch (e) {
    console.warn("Failed to load settings from localStorage:", e);
  }
  return defaultSettings;
}

function saveSettings(settings: Settings): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn("Failed to save settings to localStorage:", e);
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(loadSettings);

  // Sync announcement mode with settings on mount and when it changes
  useEffect(() => {
    setAnnouncementMode(settings.voiceMode);
  }, [settings.voiceMode]);

  const updateVoiceMode = (mode: AnnouncementMode) => {
    const newSettings = { ...settings, voiceMode: mode };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  return {
    voiceMode: settings.voiceMode,
    updateVoiceMode,
  };
}

/**
 * Initialize settings on app startup (call once at app level)
 */
export function initializeSettings(): void {
  if (typeof window === "undefined") return;

  const settings = loadSettings();
  setAnnouncementMode(settings.voiceMode);
}
