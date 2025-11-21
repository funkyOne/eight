import { ExerciseView, ExerciseViewProps } from "./ExerciseView";
import { ControlButtons } from "./ControlButtons";
import { ProgressBar } from "./ProgressBar";

export interface AppViewProps {
  exercise: ExerciseViewProps;

  handleStop: () => void;
  handleStart: () => void;
  handleNext: () => void;
  handlePause: () => void;
  progress: number;
  isPaused: boolean;
}

const AppView = ({ exercise, handleStop, handleStart, handleNext, handlePause, progress, isPaused }: AppViewProps) => {
  return (
    <div className="app">
      {exercise ? (
        <>
          <ExerciseView {...exercise} onPause={handlePause} isPaused={isPaused} />
          <ControlButtons onStop={handleStop} onNext={handleNext} />
          <ProgressBar progress={progress} />
        </>
      ) : (
        <>
          <header className="app-header">
            <h1>Eye Exercise</h1>
          </header>
          <div className="start-button-container">
            <button className="start-button" onClick={handleStart}>
              Start Workout
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AppView;
