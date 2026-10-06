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
export const REASONS: { id: ReasonId; label: string; quality: number; emoji: string }[] = [
  { id: 'understand', label: 'I read what this actually does', quality: 1.0, emoji: '\u{1F4D6}' },
  { id: 'diversify', label: 'It balances what I already own', quality: 1.0, emoji: '\u{2696}\u{FE0F}' },
  { id: 'longterm', label: 'I want to hold this for years', quality: 0.9, emoji: '\u{1F331}' },
  { id: 'dip', label: 'The price dropped and it looks cheap', quality: 0.5, emoji: '\u{1F4C9}' },
  { id: 'tip', label: 'Someone online recommended it', quality: 0.15, emoji: '\u{1F4F1}' },
  { id: 'fomo', label: "It's running and I don't want to miss out", quality: 0.0, emoji: '\u{1F525}' },
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

export type Profile = {
  name: string;
  stage: 'student' | 'firstjob' | 'settled';
  monthlyIncome: number;
  goal: 'habit' | 'bigbuy' | 'wealth' | 'curious';
  fear: 'losing' | 'jargon' | 'timing' | 'nothing';
};

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
  /** Practice-session days elapsed in the 14-day graduation programme. */
  sessionsCompleted: number;
  graduated: boolean;
  seenGlossary: string[];
  paycheckClaimed: boolean;
};
