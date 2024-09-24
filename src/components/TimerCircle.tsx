import { useEffect, useState } from "preact/hooks";

interface TimerCircleProps {
  elapsed: number;
  totalDuration: number;
}

export function TimerCircle({ elapsed, totalDuration }: TimerCircleProps) {
  const [offset, setOffset] = useState(0);
  const radius = 95; // Slightly smaller to accommodate thicker stroke
  const circleCircumference = 2 * Math.PI * radius;

  useEffect(() => {
    const progress = 1 - elapsed / totalDuration;
    setOffset(circleCircumference * progress);
  }, [elapsed, totalDuration]);

  const remainingSeconds = totalDuration - elapsed;

  return (
    <div className="timer-circle">
      <svg viewBox="0 0 220 220" width="220" height="220">
        <circle cx="110" cy="110" r={radius} fill="none" stroke="var(--tertiary-color)" strokeWidth="20" />
        <circle
          cx="110"
          cy="110"
          r={radius}
          fill="none"
          stroke="var(--primary-color)"
          strokeWidth="20"
          strokeDasharray={circleCircumference}
          strokeDashoffset={offset}
          transform="rotate(-90 110 110)"
        />
      </svg>
      <div className="timer-text">
        <span className="seconds">{remainingSeconds}</span>
        <span className="label">seconds</span>
      </div>
    </div>
  );
}
