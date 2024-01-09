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
  type: "e" | "r"; // 'e' for exercise, 'r' for rest
  startTime: number;
  duration: number;
  endTime: number;
}

export interface AppState {
  index: number; // Current exercise index
  timeline: ExerciseSegment[];
  duration: number; // Total duration of the current exercise
  currentSegment: number; // Current segment index within the exercise
  startTime: number; // Start time of the current exercise
  secondsElapsedInSegment: number; // Elapsed time since the start of the current segment
}
