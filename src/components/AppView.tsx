import { ExerciseView, ExerciseViewProps } from "./ExerciseView";
import { ControlButtons } from "./ControlButtons";
import { ProgressBar } from "./ProgressBar";

export interface AppViewProps {
  exercise: ExerciseViewProps;

  handleStop: () => void;
  handleStart: () => void;
  handleNext: () => void;
  progress: number;
}

const AppView = ({ exercise, handleStop, handleStart, handleNext, progress }: AppViewProps) => {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Eye Exercises</h1>
      </header>
      {exercise ? (
        <>
          <ExerciseView {...exercise} />
          <ControlButtons onStop={handleStop} onNext={handleNext} />
          <ProgressBar progress={progress} />
        </>
      ) : (
        <button className="start-button" onClick={handleStart}>
          START
        </button>
      )}
    </div>
  );
};

export default AppView;
