import { useEffect, useState } from "preact/hooks";

interface TimerCircleProps {
  elapsed: number;
  totalDuration: number;
}

export function TimerCircle({ elapsed, totalDuration }: TimerCircleProps) {
  const [offset, setOffset] = useState(0);
  const radius = 110; // Adjusted for 240x240 viewBox with 6px stroke
  const circleCircumference = 2 * Math.PI * radius;

  useEffect(() => {
    const progress = 1 - elapsed / totalDuration;
    setOffset(circleCircumference * progress);
  }, [elapsed, totalDuration]);

  const remainingSeconds = totalDuration - elapsed;

  return (
    <div className="timer-circle">
      <svg viewBox="0 0 240 240" width="240" height="240">
        <circle cx="120" cy="120" r={radius} fill="none" stroke="var(--color-tertiaryFill)" strokeWidth="6" />
        <circle
          cx="120"
          cy="120"
          r={radius}
          fill="none"
          stroke="var(--timer-color)"
          strokeWidth="6"
          strokeDasharray={circleCircumference}
          strokeDashoffset={offset}
          transform="rotate(-90 120 120)"
        />
      </svg>
      <div className="timer-text">
        <span className="seconds">{remainingSeconds}</span>
        <span className="label">seconds</span>
      </div>
    </div>
  );
}
