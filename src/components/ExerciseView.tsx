import { Exercise, ExerciseSegment } from "../types";
import { TimerCircle } from "./TimerCircle";
import { SegmentIndicators } from "./SegmentIndicators";
import { PauseOverlay } from "./PauseOverlay";

export interface ExerciseViewProps {
  exercise: Exercise;
  timeline: ExerciseSegment[];
  currentSegmentIndex: number;
  elapsed: number;
  totalDuration: number;
  onPause?: () => void;
  isPaused?: boolean;
}

export function ExerciseView({
  exercise,
  timeline,
  currentSegmentIndex,
  elapsed,
  totalDuration,
  onPause,
  isPaused,
}: ExerciseViewProps) {
  const handleClick = () => {
    if (onPause) {
      onPause();
    }
  };

  // Split exercise name at colon for better display
  const splitName = (name: string) => {
    const colonIndex = name.indexOf(':');
    if (colonIndex !== -1) {
      const firstPart = name.substring(0, colonIndex).trim();
      const secondPart = name.substring(colonIndex + 1).trim();
      return { firstPart, secondPart };
    }
    return { firstPart: name, secondPart: null };
  };

  const { firstPart, secondPart } = splitName(exercise.name);

  return (
    <div className="exercise-view" onClick={handleClick}>
      <div className="exercise-name">
        {secondPart ? (
          <>
            <div className="exercise-category">{firstPart}</div>
            <div className="exercise-specific">{secondPart}</div>
          </>
        ) : (
          <>
            <div className="exercise-category exercise-category--placeholder">‎</div>
            <div className="exercise-specific">{firstPart}</div>
          </>
        )}
      </div>
      <TimerCircle elapsed={elapsed} totalDuration={totalDuration} />
      <SegmentIndicators segments={timeline} currentIndex={currentSegmentIndex} />
      {isPaused && <PauseOverlay />}
    </div>
  );
}
