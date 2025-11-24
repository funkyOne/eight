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
          <ProgressBar progress={progress} />
          <ExerciseView {...exercise} onPause={handlePause} isPaused={isPaused} />
          <ControlButtons onStop={handleStop} onNext={handleNext} />
        </>
      ) : (
        <div className="start-screen" onClick={handleStart}>
          <div className="start-content">
            <h1>Eye Exercise</h1>
            <p className="start-hint">Tap anywhere to start</p>
          </div>
          <div className="start-visual">
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="60" cy="60" r="60" fill="var(--primary-color)" />
              <path
                d="M52.5 38.5L84.5 56.5C87.5 58.2 87.5 62.5 84.5 64.2L52.5 82.2C49.5 83.9 45.8 81.7 45.8 78.3V42.4C45.8 39 49.5 36.8 52.5 38.5Z"
                fill="white"
              />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppView;
