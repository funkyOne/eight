export interface Exercise {
  name: string;
  /**
   * Duration of exercise in seconds
   */
  duration: number;
  onScreenText: string;
  repetitions: number;
  timeBetweenRepetitions?: number;
}

export interface ExercisePlan {
  id: number;
  name: string;
  exercises: Exercise[];
  timeBetweenSec: number;
}
