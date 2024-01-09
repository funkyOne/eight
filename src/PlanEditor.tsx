import React, { useState } from "react";
import { Exercise, ExercisePlan } from "./data";
import { Route, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { getNextid, savePlan } from "./db";

type PickPartial<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>> & Partial<Pick<T, K>>

interface Props {
  plan: PickPartial<ExercisePlan, "id">
}

export function PlanEditor({ plan }: Props) {
  const [, setLocation] = useLocation();
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState<number | undefined>(undefined);

  function handleFormFinish(ex: Exercise) {
    plan.exercises[currentExerciseIdx!] = ex;

    savePlan(plan);

    setCurrentExerciseIdx(undefined);
  }

  function handleAddNewClick() {
    plan.exercises.push({ repetitions: 1 } as any);
    setCurrentExerciseIdx(plan.exercises.length - 1);
  }

  return <div>
    <button onClick={() => setLocation("/")}>←BACK</button>
    <hr />
    {currentExerciseIdx
      ? <ExerciseForm exercise={plan.exercises[currentExerciseIdx]} onFinish={handleFormFinish} />
      : <div><h4>Exercises</h4>{plan.exercises.map((e, i) => <a key={i} href="#"
                                                                onClick={() => setCurrentExerciseIdx(i)}>{e.name}</a>)}
        <button onClick={handleAddNewClick}>ADD NEW</button>
      </div>}
  </div>;
}

interface ExerciseFormProps {
  exercise?: Exercise;

  onFinish(out: Exercise): void;
}

function ExerciseForm({ exercise, onFinish }: ExerciseFormProps) {
  const { register, handleSubmit } = useForm({
    defaultValues: {
      name: exercise?.name,
      duration: exercise?.duration,
      onScreenText: exercise?.onScreenText,
      repetitions: exercise?.repetitions,
      timeBetweenRepetitions: exercise?.timeBetweenRepetitions
    }
  });

  function onSubmit(data: any) {
    onFinish(data);
  }

  return <form onSubmit={handleSubmit(onSubmit)}>
    <label htmlFor="name">name</label>
    <input name="name" ref={register} />

    <label htmlFor="duration in sec.">duration</label>
    <input name="duration" type="number" ref={register} />

    <label htmlFor="onScreenText">onScreenText</label>
    <input name="onScreenText" ref={register} />

    <label htmlFor="repetitions">number repetitions</label>
    <input name="repetitions" ref={register} />

    <label htmlFor="timeBetweenRepetitions">time between repetitions</label>
    <input name="timeBetweenRepetitions" ref={register} />

    <button type="submit">SAVE</button>
  </form>;
}
