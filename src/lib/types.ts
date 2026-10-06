import type { RegimeId } from '@/lib/market';

export const STARTING_CASH = 100000;

export type HorizonId = 'weeks' | 'months' | 'years' | 'decade';

export const HORIZONS: { id: HorizonId; label: string; short: string; days: number }[] = [
  { id: 'weeks', label: 'A few weeks', short: 'Weeks', days: 20 },
  { id: 'months', label: 'Six months or so', short: '6 months', days: 125 },
  { id: 'years', label: 'Three to five years', short: '3-5 years', days: 750 },
  { id: 'decade', label: 'Ten years plus', short: '10+ years', days: 2500 },
];

export type ReasonId = 'understand' | 'diversify' | 'longterm' | 'dip' | 'tip' | 'fomo';

/**
 * Reason quality is the spine of the Decision Journal. We never tell a user a
 * reason is wrong in the moment -- we record it, and let the replay do the
 * teaching once the outcome is known.
 */
export const REASONS: { id: ReasonId; label: string; quality: number }[] = [
  { id: 'understand', label: 'I read what this actually does', quality: 1.0 },
  { id: 'diversify', label: 'It balances what I already own', quality: 1.0 },
  { id: 'longterm', label: 'I want to hold this for years', quality: 0.9 },
  { id: 'dip', label: 'The price dropped and it looks cheap', quality: 0.5 },
  { id: 'tip', label: 'Someone online recommended it', quality: 0.15 },
  { id: 'fomo', label: "It's going up and I don't want to miss it", quality: 0.0 },
];

export const reason = (id: ReasonId) => REASONS.find((r) => r.id === id)!;
export const horizon = (id: HorizonId) => HORIZONS.find((h) => h.id === id)!;

export type Trade = {
  id: string;
  instrumentId: string;
  kind: 'buy' | 'sell';
  /** Rupees moved. Always positive. */
  amount: number;
  units: number;
  price: number;
  day: number;
  reasonId: ReasonId;
  horizonId: HorizonId;
  /** Only on sells: how the user described the exit. */
  exitReason?: 'target' | 'scared' | 'needed' | 'wrong';
};

export type Lot = {
  instrumentId: string;
  units: number;
  /** Weighted average cost per unit. */
  cost: number;
  /** Carried from the opening trade, so the replay knows the original promise. */
  horizonId: HorizonId;
  reasonId: ReasonId;
  openedDay: number;
};

export type PanicChoice = 'sell' | 'hold' | 'buy';

export type PanicEvent = {
  day: number;
  drawdown: number;
  choice: PanicChoice;
  /** Seconds between the alert appearing and the user choosing. */
  deliberationMs: number;
};

export type Fear = 'losing' | 'jargon' | 'timing' | 'nothing';

export type Profile = {
  stage: 'student' | 'firstjob' | 'settled';
  monthlyIncome: number;
  /** What has stopped them so far. Each answer changes something later in the app. */
  fear: Fear;
};

/** A monthly split of a real salary, in rupees. needs + buffer + wants + invest = income. */
export type SalaryPlan = { needs: number; buffer: number; wants: number; invest: number };

export type GameState = {
  started: boolean;
  profile: Profile | null;
  regime: RegimeId;
  day: number;
  cash: number;
  lots: Lot[];
  trades: Trade[];
  panics: PanicEvent[];
  /** Panic alert waiting for an answer, or null. */
  pendingPanic: { day: number; drawdown: number; shownAt: number } | null;
  graduated: boolean;
  seenGlossary: string[];
  /** Set from the salary card on Home. Becomes the suggested amount for the real SIP. */
  plan: SalaryPlan | null;
};
