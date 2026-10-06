import { priceOn } from '@/lib/market';
import { STARTING_CASH, type GameState, type Trade } from '@/lib/types';

/**
 * `?demo` drops a reviewer into a run already in progress: four months in,
 * four holdings, a panic already survived, and a Decision Journal with one
 * honest mistake in it. Starting from an empty state hides every feature that
 * only exists once there is history to reason about.
 */
export function demoState(): GameState {
  const regime = 'crash2020' as const;
  const day = 96;

  const buys: [string, number, number, GameState['lots'][0]['reasonId'], GameState['lots'][0]['horizonId']][] = [
    ['nifty50', 34000, 0, 'understand', 'decade'],
    ['hybrid', 18000, 3, 'diversify', 'years'],
    ['tatamotors', 22000, 11, 'fomo', 'weeks'],
    ['gold', 12000, 18, 'diversify', 'years'],
  ];

  const lots = buys.map(([id, amount, openedDay, reasonId, horizonId]) => {
    const price = priceOn(regime, id, openedDay);
    return { instrumentId: id, units: amount / price, cost: price, reasonId, horizonId, openedDay };
  });

  const trades: Trade[] = buys.map(([id, amount, openedDay, reasonId, horizonId], i) => ({
    id: `demo-${i}`,
    instrumentId: id,
    kind: 'buy' as const,
    amount,
    units: amount / priceOn(regime, id, openedDay),
    price: priceOn(regime, id, openedDay),
    day: openedDay,
    reasonId,
    horizonId,
  }));

  return {
    started: true,
    profile: { name: 'you', stage: 'firstjob', monthlyIncome: 32000, goal: 'habit', fear: 'losing' },
    regime,
    day,
    cash: STARTING_CASH - buys.reduce((t, b) => t + b[1], 0),
    lots,
    trades,
    panics: [{ day: 47, drawdown: -18.4, choice: 'hold', deliberationMs: 11200 }],
    pendingPanic: null,
    sessionsCompleted: 6,
    graduated: false,
    seenGlossary: [],
    paycheckClaimed: true,
  };
}
