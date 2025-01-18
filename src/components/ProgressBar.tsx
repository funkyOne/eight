interface ProgressBarProps {
  progress: number; // 0 to 1
}

export function ProgressBar({ progress }: ProgressBarProps) {
  return (
    <div 
      className="progress-bar" 
      role="progressbar"
      aria-valuenow={progress * 100}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div 
        className="progress-bar-inner"
        style={{ width: `${progress * 100}%` }} 
      />
    </div>
  );
}
