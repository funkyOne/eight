export function PauseOverlay() {
  return (
    <div className="pause-overlay">
      <div className="pause-content">
        <div className="pause-icon">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="18" y="16" width="8" height="32" rx="2" fill="currentColor" />
            <rect x="38" y="16" width="8" height="32" rx="2" fill="currentColor" />
          </svg>
        </div>
        <span className="pause-label">Paused</span>
        <span className="pause-hint">Tap to resume</span>
      </div>
    </div>
  );
}
