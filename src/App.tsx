import { useMemo, useState, useEffect, useRef } from "preact/hooks";

import { AppState, Exercise, ExerciseSegment, Plan } from "./types";
import { ExerciseAudio } from "./utils/audio";
import { announceExercise, speakPraise, preloadAnnouncements } from "./utils/announcements";
import AppView from "./components/AppView";
import { useWakeLock } from "./hooks/useWakeLock";
import { useSettings, initializeSettings } from "./hooks/useSettings";

initializeSettings();

const plan: Plan = {
  name: "Eye exercises",
  exercises: [
    { name: "Blink Often", duration: 60, repetitions: 1 },
    { name: "Blink Slowly", duration: 3, rest: 3, repetitions: 10 },
    { name: "Head Movement: Clockwise", duration: 15, repetitions: 1 },
    { name: "Head Movement: Counterclockwise", duration: 15, repetitions: 1 },
    { name: "Head Movement: Side to Side", duration: 15, repetitions: 1 },
    { name: "Head Movement: Up and Down", duration: 15, repetitions: 1 },
    { name: "Eye Movement: Left and Right", duration: 30, repetitions: 1 },
    { name: "Eye Movement: Up and Down", duration: 30, repetitions: 1 },
    { name: "Eye Movement: Figure 8", duration: 30, repetitions: 1 },
    { name: "Eye Movement: Random Direction", duration: 30, repetitions: 1 },
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
  const [showSettings, setShowSettings] = useState(false);
  const { voiceMode, updateVoiceMode } = useSettings();
  const current = useRef<AppState | null>(null);
  const audio = useRef<ExerciseAudio | null>(null);

  const updateState = (next: AppState | null): void => {
    current.current = next;
    audio.current?.sync(next);
    setState(next);
  };
  const getAudio = (): ExerciseAudio => {
    if (!audio.current) audio.current = new ExerciseAudio();
    return audio.current;
  };
  const prepareAudio = (): void => {
    void getAudio()
      .prepare()
      .catch((error: unknown) => console.warn("Audio preparation failed", error));
  };

  const { requestWakeLock, releaseWakeLock } = useWakeLock();

  useEffect(() => {
    const exerciseNames = plan.exercises.map((e) => e.name);
    void preloadAnnouncements(getAudio(), exerciseNames);
  }, [voiceMode]);

  function selectExercise(index: number, startedAt = Date.now()): AppState {
    return {
      index,
      segmentIndex: 0,
      timeline: genExerciseSegments(plan.exercises[index]),
      startedAt,
      secondsElapsedInSegment: 0,
      isPaused: false,
    };
  }

  // Derive the visible segment from the same timestamps used by the audio schedule.
  // Catch up directly after a delayed callback without replaying missed cues.
  const tick = (): void => {
    const previous = current.current;
    if (!previous || previous.isPaused) return;
    const now = Date.now();
    let next = previous;
    while (now >= next.startedAt + next.timeline[next.timeline.length - 1].endOffset) {
      if (next.index === plan.exercises.length - 1) {
        updateState(null);
        releaseWakeLock();
        void speakPraise(getAudio());
        return;
      }
      next = selectExercise(next.index + 1, next.startedAt + next.timeline[next.timeline.length - 1].endOffset);
    }
    const elapsedMs = Math.max(0, now - next.startedAt);
    const segmentIndex = next.timeline.findIndex((segment) => elapsedMs < segment.endOffset);
    const elapsed = Math.floor(elapsedMs / 1000);
    if (
      next.index === previous.index &&
      segmentIndex === previous.segmentIndex &&
      elapsed === previous.secondsElapsedInSegment
    )
      return;
    next = { ...next, segmentIndex, secondsElapsedInSegment: elapsed };
    updateState(next);
    if (next.index !== previous.index) {
      void announceExercise(plan.exercises[next.index].name, getAudio());
    }
  };

  useEffect(() => {
    if (!state || state.isPaused) return;
    const timer = window.setInterval(tick, 50);
    const onVisible = (): void => {
      if (document.visibilityState === "visible") {
        prepareAudio();
        tick();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [Boolean(state), state?.isPaused, releaseWakeLock]);

  useEffect(() => () => audio.current?.dispose(), []);

  const handleStart = (): void => {
    prepareAudio();
    updateState(selectExercise(0));
    void announceExercise(plan.exercises[0].name, getAudio());
    void requestWakeLock();
  };

  const handleStop = (): void => {
    updateState(null);
    releaseWakeLock();
  };

  const handleNext = (): void => {
    const previous = current.current;
    if (!previous || previous.index >= plan.exercises.length - 1) return;
    prepareAudio();
    updateState(selectExercise(previous.index + 1));
    void announceExercise(plan.exercises[previous.index + 1].name, getAudio());
  };

  const handlePause = (): void => {
    const previous = current.current;
    if (!previous) return;
    if (previous.isPaused) {
      prepareAudio();
      updateState({
        ...previous,
        isPaused: false,
        startedAt: previous.startedAt + Date.now() - (previous.pausedAt ?? Date.now()),
        pausedAt: undefined,
      });
    } else {
      tick();
      if (!current.current) return;
      updateState({ ...current.current, isPaused: true, pausedAt: Date.now() });
    }
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
      showSettings={showSettings}
      onOpenSettings={() => setShowSettings(true)}
      onCloseSettings={() => setShowSettings(false)}
      voiceMode={voiceMode}
      onVoiceModeChange={updateVoiceMode}
    />
  );
};

export default App;
