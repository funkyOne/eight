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

  return (
    <div className="exercise-view" onClick={handleClick}>
      <h2 className="exercise-name">{exercise.name}</h2>
      <TimerCircle elapsed={elapsed} totalDuration={totalDuration} />
      <SegmentIndicators segments={timeline} currentIndex={currentSegmentIndex} />
      {isPaused && <PauseOverlay />}
    </div>
  );
}
