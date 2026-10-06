import type { SalaryPlan } from '@/lib/types';

export const STEP = 500;
const round = (n: number) => Math.round(n / STEP) * STEP;

/** A sensible first split. The point of the salary sheet is that people move it. */
export function defaultPlan(income: number): SalaryPlan {
  const buffer = round(income * 0.15);
  const wants = round(income * 0.2);
  const invest = Math.max(STEP, round(income * 0.1));
  return { needs: income - buffer - wants - invest, buffer, wants, invest };
}
