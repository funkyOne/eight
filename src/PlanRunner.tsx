import React, { useEffect, useReducer } from "react";
import { Exercise, ExercisePlan } from "./data";
import { useLocation } from "wouter";

interface Props {
  plan: ExercisePlan;
  onFinished: () => any;
}

type TimeSegment = [number, number, "e" | "r"];

interface State {
  exercises: Exercise[]
  exerciseIndex: number;

  elapsed: number;
  isFinished: boolean;
  timeSegments: TimeSegment[];
  currentSegmentIndex: number;
}

interface Action {
  type: string;
  payload?: any;
}

// [till what time it runs, segment type]
function generateTimeSegments(exercise: Exercise): TimeSegment[] {
  const timings: TimeSegment[] = [];

  let runningTime: number = 0;
  for (let i = 0; i < exercise.repetitions; i++) {
    const startTime = runningTime;
    runningTime += exercise.duration;
    timings.push([runningTime, startTime, "e"]);
    if (i < exercise.repetitions - 1) {
      const startTime = runningTime;
      runningTime += exercise.timeBetweenRepetitions ?? 0;
      timings.push([runningTime, startTime, "r"]);
    }
  }

  return timings;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "tick": {
      const elapsed = state.elapsed + 1;

      const [tillTime] = getCurrentSegment(state);

      if (tillTime > elapsed) {
        return {
          ...state,
          elapsed
        };
      }

      const nextSegmentIndex = state.currentSegmentIndex + 1;

      const isExerciseFinished = nextSegmentIndex >= state.timeSegments.length;

      if (isExerciseFinished) {
        return nextExercise(state);
      }

      return {
        ...state,
        elapsed,
        currentSegmentIndex: nextSegmentIndex
      };
    }
    default:
      return state;
  }
}

function nextExercise(state: State): State {
  const exerciseIndex = state.exerciseIndex + 1;
  if (exerciseIndex >= state.exercises.length) {
    return {
      ...state,
      isFinished: true
    };
  } else {
    return {
      ...state,
      ...initExercise(exerciseIndex, state.exercises)
    };
  }
}

function initExercise(index: number, exercises: Exercise[]) {
  return {
    exerciseIndex: index,
    elapsed: 0,
    isFinished: false,
    currentSegmentIndex: 0,
    timeSegments: generateTimeSegments(exercises[index])
  };
}

function init(plan: ExercisePlan): State {
  return {
    exercises: plan.exercises,
    ...initExercise(0, plan.exercises)
  };
}

function getCurrentExercise(state: State): Exercise {
  return state.exercises[state.exerciseIndex];
}

function getCurrentSegment(state: State): TimeSegment {
  return state.timeSegments[state.currentSegmentIndex];
}

export function PlanRunner({ plan, onFinished }: Props) {
  const [, setLocation] = useLocation();
  const [state, dispatch] = useReducer(reducer, plan, init);

  useEffect(() => {
    if (state.isFinished) {
      onFinished();
      return;
    }

    const handle = setInterval(() => dispatch({ type: "tick" }), 1000);

    return () => clearInterval(handle);
  }, [state.isFinished, onFinished]);

  const [, fromTime, segmentType] = getCurrentSegment(state);

  const currentSegmentElapsed = state.elapsed - fromTime;

  const isExercise = segmentType === "e";

  return <div className={isExercise ? "exercise" : "break"}>
    <button onClick={() => setLocation("/")}>←BACK</button>
    {state.isFinished && <div>FINITO!</div>}
    <div>{state.exerciseIndex + 1} of {state.exercises.length}</div>
    {state.timeSegments.length > 1 && renderTimeSegments(state)}
    <div style={{ fontSize: 200 }}>{currentSegmentElapsed + 1}</div>
    {/*<div style={{ fontSize: 100 }}>{state.elapsed}</div>*/}
    <div>{getCurrentExercise(state).onScreenText}</div>
  </div>;
}

function renderTimeSegments(state: State) {
  return <div>
    {state.timeSegments.map(([, , type], i) => <span key={i}
                                                     className={i === state.currentSegmentIndex ? "current-segment" : ""}>{type}</span>)}
  </div>;
}
