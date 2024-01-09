// src/components/ExerciseView.tsx

import { FunctionComponent } from "preact";
import { Exercise, ExerciseSegment } from "../types";
import SegmentView from "./SegmentView";

interface ExerciseViewProps {
  exercise: Exercise;
  timeline: ExerciseSegment[];
  currentSegmentIndex: number;
  elapsed: number;
}

export function ExerciseView({ exercise, timeline, currentSegmentIndex, elapsed }: ExerciseViewProps) {
  return (
    <div className="exercise-view">
      <div className="exercise-info">
        <div>Exercise: {exercise.name}</div>
        {/*<div>Duration: {exercise.duration}</div>*/}
        {/*<div>Segment: {currentSegmentIndex + 1}/{timeline.length}</div>*/}
      </div>
      <div className="exercise-timer">
        <div className="exercise-timer__elapsed">{elapsed}</div>
      </div>
      <div className="exercise-timeline">
        {timeline.length > 1 && (
          <div className="exercise-timeline">
            {timeline.map((segment, index) => (
              <SegmentView key={index} current={currentSegmentIndex} index={index} segment={segment} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
