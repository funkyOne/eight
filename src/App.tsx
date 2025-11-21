import { useMemo, useState } from "preact/hooks";

import { AppState, Exercise, ExerciseSegment, Plan } from "./types";
import { speak, speakPraise } from "./utils/speech";
import { load, SoundHandle } from "./utils/audio";
import AppView from "./components/AppView";
import { useWakeLock } from "./hooks/useWakeLock";

let restSound: SoundHandle | undefined;
let workSound: SoundHandle | undefined;
let soundEnabled = false;

async function ensureAudio() {
  // only run this on the client
  if (typeof window === "undefined") return;

  if (soundEnabled) return; // already initialised

  const [a, b] = await load([
    "./sounds/220174__gameaudio__spacey-loose.wav",
    "./sounds/220202__gameaudio__teleport-casual.wav",
  ]);

  restSound = a;
  workSound = b;

  soundEnabled = true;
}

const plan: Plan = {
  name: "Eye exercises",
  exercises: [
    { name: "Blink often", duration: 60, repetitions: 1 },
    { name: "Blink slowly", duration: 3, rest: 3, repetitions: 10 },
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
    { name: "Change Focus", duration: 10, rest: 10, repetitions: 5 },
    { name: "Temple Massage", duration: 10, rest: 5, repetitions: 4 },
    { name: "Eyes Palming", duration: 60, repetitions: 1 },
  ],
};

const genExerciseSegments = (exercise: Exercise): ExerciseSegment[] => {
  let segments: ExerciseSegment[] = [];
  let currentOffset = 0;

  for (let i = 0; i < exercise.repetitions; i++) {
    // Add exercise segment
    segments.push({
      type: "w", // "w" for work
      startOffset: currentOffset,
      endOffset: currentOffset + exercise.duration * 1000,
      duration: exercise.duration,
    });
    currentOffset += exercise.duration * 1000;

    // If there is a rest period, add it
    if (exercise.rest) {
      segments.push({
        type: "r", // 'r' for rest
        startOffset: currentOffset,
        endOffset: currentOffset + exercise.rest * 1000,
        duration: exercise.rest,
      });
      currentOffset += exercise.rest * 1000;
    }
  }

  return segments;
};

const App = () => {
  const [state, setState] = useState<AppState | null>(null);
  const [currentTimer, setCurrentTimer] = useState<number | null>(null);

  const { requestWakeLock, releaseWakeLock } = useWakeLock();

  function selectExercise(index: number) {
    const exercise = plan.exercises[index];
    const timeline = genExerciseSegments(exercise);
    const newState: AppState = {
      index,
      segmentIndex: 0,
      timeline,
      startedAt: Date.now(), // Update the start time for the new exercise
      secondsElapsedInSegment: 0,
      isPaused: false,
    };
    speak(exercise.name);
    ensureTimer();
    console.log(newState);
    return newState;
  }

  const ensureTimer = () => {
    if (currentTimer) return; // Timer already started

    const timerId = window.setInterval(() => {
      setState((currentState) => {
        if (!currentState) return null;

        // If paused, don't advance the timer
        if (currentState.isPaused) {
          return currentState;
        }

        const { timeline, segmentIndex, index, startedAt } = currentState;
        const segment = timeline[segmentIndex];

        const elapsed = Math.floor((Date.now() - startedAt) / 1000);

        if (Date.now() < startedAt + segment.endOffset) {
          console.log("No change in segment or exercise");
          // No change in segment or exercise
          return { ...currentState, secondsElapsedInSegment: elapsed };
        }

        // Check if the current segment's time is up
        let nextSegmentIndex = segmentIndex + 1;

        // Check if there are more segments in the current exercise
        if (nextSegmentIndex < timeline.length) {
          if (soundEnabled && timeline[nextSegmentIndex].type === "r") {
            restSound.play();
          } else {
            workSound.play();
          }

          console.log("Next segment");
          return { ...currentState, segmentIndex: nextSegmentIndex, secondsElapsedInSegment: elapsed };
        } else {
          console.log("Next exercise");
          // Move to the next exercise
          let newIndex = index + 1;
          if (newIndex < plan.exercises.length) {
            return selectExercise(newIndex);
          } else {
            // End of the plan
            stopTimer();

            speakPraise();

            return null;
          }
        }
      });
    }, 1000); // Check every second

    setCurrentTimer(timerId);
  };

  const stopTimer = () => {
    if (!currentTimer) return;

    clearInterval(currentTimer);
    setCurrentTimer(null);
  };

  const handleStart = () => {
    void ensureAudio();
    setState(selectExercise(0));
    void requestWakeLock();
  };

  const handleStop = () => {
    stopTimer();
    setState(null);
    releaseWakeLock();
  };

  const handleNext = () => {
    if (!state) return;

    if (state.index < plan.exercises.length - 1) {
      setState(selectExercise(state.index + 1));
    }
  };

  const handlePause = () => {
    setState((currentState) => {
      if (!currentState) return null;

      if (currentState.isPaused) {
        // Resuming: adjust startedAt to account for pause duration
        const pauseDuration = Date.now() - (currentState.pausedAt || Date.now());
        return {
          ...currentState,
          isPaused: false,
          startedAt: currentState.startedAt + pauseDuration,
          pausedAt: undefined,
        };
      } else {
        // Pausing: record when we paused
        return {
          ...currentState,
          isPaused: true,
          pausedAt: Date.now(),
        };
      }
    });
  };

  const exercise = useMemo(() => {
    if (state == null) return null;

    const currentExercise = plan.exercises[state.index];
    const totalDuration = state.timeline.reduce((total, segment) => total + segment.duration, 0);

    return {
      exercise: currentExercise,
      timeline: state.timeline,
      currentSegmentIndex: state.segmentIndex,
      elapsed: state.secondsElapsedInSegment,
      totalDuration,
    };
  }, [state]);

  const progress = useMemo(() => {
    if (state == null) return 0;

    const totalExercises = plan.exercises.length;
    const completedExercises = state.index;
    const currentExerciseProgress =
      state.secondsElapsedInSegment / state.timeline.reduce((total, segment) => total + segment.duration, 0);

    return (completedExercises + currentExerciseProgress) / totalExercises;
  }, [state, plan.exercises.length]);

  return (
    <AppView
      exercise={exercise}
      handleStop={handleStop}
      handleStart={handleStart}
      handleNext={handleNext}
      handlePause={handlePause}
      progress={progress}
      isPaused={state?.isPaused || false}
    />
  );
};

export default App;
