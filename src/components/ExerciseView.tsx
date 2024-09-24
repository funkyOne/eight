import { Exercise, ExerciseSegment } from "../types";
import { TimerCircle } from "./TimerCircle";
import { SegmentIndicators } from "./SegmentIndicators";

export interface ExerciseViewProps {
  exercise: Exercise;
  timeline: ExerciseSegment[];
  currentSegmentIndex: number;
  elapsed: number;
  totalDuration: number;
}

export function ExerciseView({ exercise, timeline, currentSegmentIndex, elapsed, totalDuration }: ExerciseViewProps) {
  return (
    <div className="exercise-view">
      <h2 className="exercise-name">{exercise.name}</h2>
      <TimerCircle elapsed={elapsed} totalDuration={totalDuration} />
      <SegmentIndicators segments={timeline} currentIndex={currentSegmentIndex} />
    </div>
  );
}
