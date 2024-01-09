// src/components/SegmentView.tsx

import { FunctionComponent } from "preact";
import { ExerciseSegment } from "../types";

interface SegmentViewProps {
  current: number;
  index: number;
  segment: ExerciseSegment;
}

const SegmentView = ({ current, index, segment }: SegmentViewProps) => {
  const isActive = index === current;
  const segmentIcon = segment.type === "e" ? "🟢" : "⚪";

  return <span className={`segment ${isActive ? "active" : ""}`}>{segmentIcon}</span>;
};

export default SegmentView;
