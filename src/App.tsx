import { useState } from "preact/hooks";

import ExerciseView from "./components/ExerciseView";
import ControlButtons from "./components/ControlButtons";
import { Plan, AppState, Exercise, ExerciseSegment } from "./types";
import { speak, preloadSound } from "./utils/speechSynthesis";

// Mock data for demonstration
const plan: Plan = {
  name: "Eye exercises",
  exercises: [
    // { name: "Blink often", duration: 60, repetitions: 1 },
    { name: "Blink often", duration: 5, repetitions: 1 },
    { name: "Blinking slow", duration: 3, rest: 3, repetitions: 10 },
    { name: "Head Movement clockwise", duration: 15, repetitions: 1 },
    { name: "Head Movement counterclockwise", duration: 15, repetitions: 1 },
    { name: "Head Movement side to side", duration: 15, repetitions: 1 },
    { name: "Head Movement up and down", duration: 15, repetitions: 1 },
    { name: "Eye Movement - left and right", duration: 30, repetitions: 1 },
    { name: "Eye Movement - up and down", duration: 30, repetitions: 1 },
    { name: "Eye Movement - 8", duration: 30, repetitions: 1 },
    { name: "Eye Movement - random direction", duration: 30, repetitions: 1 },
    { name: "Squeezing Eyes Shut", duration: 3, rest: 3, repetitions: 10 },
    { name: "Eyes Shut Movements", duration: 60, repetitions: 1 },
    { name: "Change Focus", duration: 10, rest: 10, repetitions: 3 },
    { name: "Temple Massage", duration: 10, rest: 5, repetitions: 4 },
    { name: "Eyes Palming", duration: 60, repetitions: 1 }
  ]
};

const genExerciseSegments = (exercise: Exercise): ExerciseSegment[] => {
  let segments: ExerciseSegment[] = [];
  let startTime = 0;

  for (let i = 0; i < exercise.repetitions; i++) {
    // Add exercise segment
    segments.push({
      type: "e", // 'e' for exercise
      startTime: startTime,
      endTime: startTime + exercise.duration * 1000,
      duration: exercise.duration
    });
    startTime += exercise.duration * 1000;

    // If there is a rest period, add it
    if (exercise.rest) {
      segments.push({
        type: "r", // 'r' for rest
        startTime: startTime,
        endTime: startTime + exercise.rest * 1000,
        duration: exercise.rest
      });
      startTime += exercise.rest * 1000;
    }
  }

  return segments;
};

const App = () => {
  const [state, setState] = useState<AppState | null>(null);
  const [currentTimer, setCurrentTimer] = useState<number | null>(null);

  const selectExercise = (index: number) => {
    const exercise = plan.exercises[index];
    const timeline = genExerciseSegments(exercise);
    const newState: AppState = {
      index,
      timeline,
      duration: exercise.duration,
      currentSegment: 0,
      startTime: Date.now(),
      secondsElapsedInSegment: 0
    };
    setState(newState);
    speak(exercise.name);
    startTimer();
  };

  const startTimer = () => {
    stopTimer(); // Ensure any existing timer is stopped before starting a new one
    const timerId = window.setInterval(() => {
      setState(currentState => {
        if (!currentState) return null;

        const { timeline, currentSegment: current, index, startTime } = currentState;
        const segment = timeline[current];

        const elapsed = Math.floor((Date.now() - startTime) / 1000);

        if (Date.now() < startTime + segment.endTime) {
          // No change in segment or exercise
          return {...currentState, secondsElapsedInSegment: elapsed};
        }

        // Check if the current segment's time is up
        let newCurrent = current + 1;

        // Check if there are more segments in the current exercise
        if (newCurrent < timeline.length) {
          return { ...currentState, currentSegment: newCurrent, secondsElapsedInSegment: 0 };
        } else {
          // Move to the next exercise
          let newIndex = index + 1;
          if (newIndex < plan.exercises.length) {
            selectExercise(newIndex);
          } else {
            // End of the plan
            stopTimer();
            return null;
          }
        }
      });
    }, 1000); // Check every second
    setCurrentTimer(timerId);
  };

  const stopTimer = () => {
    if (currentTimer) {
      clearInterval(currentTimer);
      setCurrentTimer(null);
    }
  };

  const handleStop = () => {
    stopTimer();
    setState(null);
  };

  const handlePause = () => {
    stopTimer();
  };

  const handleResume = () => {
    startTimer();
  };

  const handleStart = () => {
    selectExercise(0);
  };

  const handleNext = () => {
    if (state && state.index < plan.exercises.length - 1) {
      selectExercise(state.index + 1);
    }
  };

  return (
    <div className="app">
      <ControlButtons
        onStop={handleStop}
        onPause={handlePause}
        onResume={handleResume}
        onStart={handleStart}
        onNext={handleNext}
      />
      {state && (
        <ExerciseView
          exercise={plan.exercises[state.index]}
          timeline={state.timeline}
          currentSegmentIndex={state.currentSegment}
          elapsed={state.secondsElapsedInSegment}
        />
      )}
    </div>
  );
};

export default App;
