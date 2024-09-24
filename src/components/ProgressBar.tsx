interface ProgressBarProps {
  progress: number; // 0 to 1
}

export function ProgressBar({ progress }: ProgressBarProps) {
  return (
    <div className="progress-bar">
      <div className="progress-bar-inner" style={{ width: `${progress * 100}%` }} />
    </div>
  );
}
