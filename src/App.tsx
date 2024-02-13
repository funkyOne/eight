import { useState } from "preact/hooks";

import { Plan, AppState, Exercise, ExerciseSegment } from "./types";
import { speak } from "./utils/speechSynthesis";
import { load, SoundHandle } from "./utils/audio";
import AppView from "./components/AppView";

let restSound: SoundHandle | undefined;
let workSound: SoundHandle | undefined;
let soundEnabled = false;

// Step 1: Create an array of praise phrases
const praisePhrases = [
  "Good job!",
  "Nice one, pal!",
  "Well done, buddy!",
  "You are the best",
  "All done!",
  "You've made it",
  "Keep up the good work!",
  "You're doing great!",
  "Fantastic work!",
  "Keep it up!",
];

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

// todo only lock when exercise is running and unlock when it's done, also, only lock when app is active
async function initWakeLock() {
  if (typeof window === "undefined") return;

  let wakeLock = null;

  try {
    wakeLock = await navigator.wakeLock.request("screen");
    console.log("Wake Lock is active!");

    document.addEventListener("visibilitychange", async () => {
      if (wakeLock !== null && document.visibilityState === "visible") {
        wakeLock = await navigator.wakeLock.request("screen");
      }
    });
  } catch (err) {
    console.log(`${err.name}, ${err.message}`);
  }
}

void initWakeLock();

// Mock data for demonstration
const plan: Plan = {
  name: "Eye exercises",
  exercises: [
    { name: "Blink often", duration: 60, repetitions: 1 },
    // { name: "Blink often", duration: 5, repetitions: 1 },
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

function speakPraise() {
  const randomPhrase = praisePhrases[Math.floor(Math.random() * praisePhrases.length)];
  speak(randomPhrase);
}

const App = () => {
  const [state, setState] = useState<AppState | null>(null);
  const [currentTimer, setCurrentTimer] = useState<number | null>(null);

  function selectExercise(index: number) {
    const exercise = plan.exercises[index];
    const timeline = genExerciseSegments(exercise);
    const newState: AppState = {
      index,
      segmentIndex: 0,
      timeline,
      startedAt: Date.now(), // Update the start time for the new exercise
      secondsElapsedInSegment: 0,
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

  const handleStop = () => {
    stopTimer();
    setState(null);
  };

  // const handlePause = () => {
  //   stopTimer();
  // };
  //
  // const handleResume = () => {
  //   ensureTimer();
  // };

  const handleStart = () => {
    void ensureAudio();
    setState(selectExercise(0));
  };

  const handleNext = () => {
    if (!state) return;

    if (state.index < plan.exercises.length - 1) {
      setState(selectExercise(state.index + 1));
    }
  };

  if (state === null) return "Loading...";

  const props = {
    exercise: plan.exercises[state.index],
    timeline: state.timeline,
    currentSegmentIndex: state.segmentIndex,
    elapsed: state.secondsElapsedInSegment,
  };

  return (
    <AppView
      exercise={props}
      state={state}
      plan={plan}
      handleStop={handleStop}
      handleStart={handleStart}
      handleNext={handleNext}
    />
  );
};

export default App;
