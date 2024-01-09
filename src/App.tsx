import React, { useState } from "react";
import { Link, Route, Switch, useLocation } from "wouter";

import "./App.css";
import { PlanRunner } from "./PlanRunner";
import { PlanEditor } from "./PlanEditor";
import { Exercise, ExercisePlan } from "./data";
import { getPlan, getPlanList } from "./db";

// const plans: ExercisePlan[] = [createPlan(), createPlan()];

// function createPlan(): ExercisePlan {
//   const exercises: Exercise[] = [];
//
//   for (let i = 0; i < 7; i++) {
//     const num = Math.round(Math.random() * 100);
//     const repetitions = Math.ceil(Math.random() * 3);
//     exercises.push({
//       name: `exercise #${num}`,
//       duration: 10,
//       onScreenText: `Do ${num * 10} crunches!`,
//       repetitions,
//       timeBetweenRepetitions: (repetitions > 0 ? 5 : undefined)
//     });
//   }
//
//   return {
//     id: Math.round(Math.random() * 100),
//     name: "Plan #" + Math.random(),
//     exercises,
//     timeBetweenSec: 5
//   };
// }

type PickPartial<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>> & Partial<Pick<T, K>>

function createPlan1(): PickPartial<ExercisePlan, "id"> {
  return {
    name: "Plan #" + Math.random(),
    exercises: [],
    timeBetweenSec: 5
  };
}

function App() {
  const [, setLocation] = useLocation();

  const planIds = getPlanList();

  function handleStartClick() {
    setLocation("/exercise/1");
  }

  function handleFinished() {
    handleStartClick();
  }

  function handlePlanClick(id: number) {
    setLocation("/exercise/" + id);
  }

  function handleAddNewClick() {
    setLocation("/plan/new");
  }

  return (
    <div className="App">
      <Switch>
        <Route path="/exercise/:id">
          {(params) => <PlanRunner plan={getPlan(parseInt(params.id))} onFinished={handleFinished} />}
        </Route>
        <Route path="/plan/new">
          {() => <PlanEditor plan={createPlan1()} />}
        </Route>
        <Route>
          {planIds.map((id, i) => <div key={id} onClick={() => handlePlanClick(id)}>{id}</div>)}
          <hr />
          <button onClick={handleAddNewClick}>ADD NEW</button>
          <button onClick={handleStartClick}>Start</button>
        </Route>
      </Switch>
    </div>
  );
}

export default App;
