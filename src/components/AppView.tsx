import { ExerciseView, ExerciseViewProps } from "./ExerciseView";
import { ControlButtons } from "./ControlButtons";
import { AppState, Exercise, ExerciseSegment, Plan } from "../types";

export interface AppViewProps {
  exercise: ExerciseViewProps;

  handleStop: () => void;
  handleStart: () => void;
  handleNext: () => void;
}

const AppView = ({ exercise, handleStop, handleStart, handleNext }: AppViewProps) => {
  return (
    <div className="app">
      <ControlButtons onStop={handleStop} onStart={handleStart} onNext={handleNext} isPlaying={exercise !== null} />
      {exercise && <ExerciseView {...exercise} />}
    </div>
  );
};

export default AppView;
