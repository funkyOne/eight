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
          className={`segment-indicator ${index === currentIndex ? "active" : ""}`}
          style={{ backgroundColor: segment.type === "w" ? "#2ecc71" : "#3498db" }}
        />
      ))}
    </div>
  );
}
