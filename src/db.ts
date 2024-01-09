import { ExercisePlan } from "./data";

export function getNextid(): number {
  const id = parseInt(localStorage.getItem("lastId") ?? "0") + 1;
  localStorage.setItem("lastId", String(id));
  return id;
}

type PickPartial<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>> & Partial<Pick<T, K>>

export function getPlanList(): number[] {
  return JSON.parse(localStorage.getItem("planIds") ?? "[]") as number[];
}


export function getPlan(id: number): ExercisePlan {
  return JSON.parse(localStorage.getItem("plan_" + id)!) as ExercisePlan;
}

export function savePlan(plan: PickPartial<ExercisePlan, "id">) {
  if (plan.id == null) {
    plan.id = getNextid();

    const planIds = getPlanList();
    planIds.push(plan.id);
    localStorage.setItem("planIds", JSON.stringify(planIds));
  }

  localStorage.setItem("plan_" + plan.id, JSON.stringify(plan));
}
