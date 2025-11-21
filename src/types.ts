export interface Exercise {
  name: string;
  duration: number;
  repetitions: number;
  rest?: number; // Optional since some exercises may not have a rest period
}

export interface Plan {
  name: string;
  exercises: Exercise[];
}

export interface ExerciseSegment {
  type: "w" | "r"; // 'e' for exercise, 'r' for rest
  startOffset: number;
  duration: number;
  endOffset: number;
}

export interface AppState {
  index: number; // Current exercise index
  segmentIndex: number; // Current segment index within the exercise
  timeline: ExerciseSegment[];
  startedAt: number; // Start time of the current exercise
  secondsElapsedInSegment: number; // Elapsed time since the start of the current segment
  isPaused: boolean; // Whether the exercise is currently paused
  pausedAt?: number; // Timestamp when the exercise was paused
}
