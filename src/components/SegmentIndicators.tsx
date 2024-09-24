import { ExerciseSegment } from "../types";

interface SegmentIndicatorsProps {
  segments: ExerciseSegment[];
  currentIndex: number;
}

export function SegmentIndicators({ segments, currentIndex }: SegmentIndicatorsProps) {
  return (
    <div className="segment-indicators">
      {segments.map((segment, index) => (
        <div
          key={index}
          className={`segment-indicator ${index === currentIndex ? "active" : ""} segment-indicator--${segment.type}`}
        />
      ))}
    </div>
  );
}
