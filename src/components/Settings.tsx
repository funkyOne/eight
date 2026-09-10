import { AnnouncementMode } from "../utils/announcements";

export interface SettingsProps {
  voiceMode: AnnouncementMode;
  onVoiceModeChange: (mode: AnnouncementMode) => void;
  onBack: () => void;
}

const Settings = ({ voiceMode, onVoiceModeChange, onBack }: SettingsProps) => {
  return (
    <div className="settings-screen">
      <header className="settings-header">
        <button className="back-button" onClick={onBack} aria-label="Go back">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M15 18L9 12L15 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Back</span>
        </button>
        <h1 className="settings-title">Settings</h1>
        <div className="settings-header-spacer" />
      </header>

      <div className="settings-content">
        <section className="settings-section">
          <h2 className="settings-section-title">Voice</h2>
          <div className="settings-card">
            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">Voice Type</span>
                <span className="setting-description">
                  Choose how exercise names are announced
                </span>
              </div>
            </div>
            <div className="setting-options">
              <button
                className={`setting-option ${voiceMode === "mp3" ? "setting-option--active" : ""}`}
                onClick={() => onVoiceModeChange("mp3")}
                aria-pressed={voiceMode === "mp3"}
              >
                <span className="option-icon">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M10 2C10.5523 2 11 2.44772 11 3V17C11 17.5523 10.5523 18 10 18C9.44772 18 9 17.5523 9 17V3C9 2.44772 9.44772 2 10 2Z"
                      fill="currentColor"
                    />
                    <path
                      d="M6 6C6.55228 6 7 6.44772 7 7V13C7 13.5523 6.55228 14 6 14C5.44772 14 5 13.5523 5 13V7C5 6.44772 5.44772 6 6 6Z"
                      fill="currentColor"
                    />
                    <path
                      d="M14 6C14.5523 6 15 6.44772 15 7V13C15 13.5523 14.5523 14 14 14C13.4477 14 13 13.5523 13 13V7C13 6.44772 13.4477 6 14 6Z"
                      fill="currentColor"
                    />
                    <path
                      d="M2 9C2.55228 9 3 9.44772 3 10C3 10.5523 2.55228 11 2 11C1.44772 11 1 10.5523 1 10C1 9.44772 1.44772 9 2 9Z"
                      fill="currentColor"
                    />
                    <path
                      d="M18 9C18.5523 9 19 9.44772 19 10C19 10.5523 18.5523 11 18 11C17.4477 11 17 10.5523 17 10C17 9.44772 17.4477 9 18 9Z"
                      fill="currentColor"
                    />
                  </svg>
                </span>
                <span className="option-text">
                  <span className="option-title">Pre-recorded</span>
                  <span className="option-subtitle">Natural voice recordings</span>
                </span>
                {voiceMode === "mp3" && (
                  <span className="option-check">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        fill="currentColor"
                      />
                    </svg>
                  </span>
                )}
              </button>
              <button
                className={`setting-option ${voiceMode === "tts" ? "setting-option--active" : ""}`}
                onClick={() => onVoiceModeChange("tts")}
                aria-pressed={voiceMode === "tts"}
              >
                <span className="option-icon">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217z"
                      fill="currentColor"
                    />
                    <path
                      d="M14.657 5.343a1 1 0 011.414 0A7.972 7.972 0 0118 10a7.972 7.972 0 01-1.929 4.657 1 1 0 11-1.414-1.414A5.972 5.972 0 0016 10a5.972 5.972 0 00-1.343-3.243 1 1 0 010-1.414z"
                      fill="currentColor"
                    />
                    <path
                      d="M12.536 7.464a1 1 0 011.414 0A3.98 3.98 0 0115 10a3.98 3.98 0 01-1.05 2.536 1 1 0 11-1.414-1.414A1.98 1.98 0 0013 10a1.98 1.98 0 00-.464-1.122 1 1 0 010-1.414z"
                      fill="currentColor"
                    />
                  </svg>
                </span>
                <span className="option-text">
                  <span className="option-title">Text-to-Speech</span>
                  <span className="option-subtitle">System synthesized voice</span>
                </span>
                {voiceMode === "tts" && (
                  <span className="option-check">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        fill="currentColor"
                      />
                    </svg>
                  </span>
                )}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;
