import { getMarketPath } from '@/lib/market';
import { STARTING_CASH, type GameState } from '@/lib/types';

export type Series = {
  /** Total practice value on each sampled day, rebased so day one = 100. */
  you: number[];
  /** The index on the same days, rebased the same way. */
  market: number[];
  /** The trading day each sample represents. */
  days: number[];
};

/**
 * Replays the trade log day by day. Using today's holdings for every past day
 * (which an earlier version did) draws a line for money that had not been
 * invested yet, so the chart and the numbers next to it disagreed.
 */
export function portfolioSeries(s: GameState, samples = 80): Series {
  const path = getMarketPath(s.regime);
  const step = Math.max(1, Math.ceil(s.day / samples));
  const trades = [...s.trades].sort((a, b) => a.day - b.day);

  const units: Record<string, number> = {};
  let cash = STARTING_CASH;
  let t = 0;
  const out: Series = { you: [], market: [], days: [] };

  for (let d = 0; d <= s.day; d++) {
    while (t < trades.length && trades[t].day === d) {
      const tr = trades[t++];
      units[tr.instrumentId] = (units[tr.instrumentId] ?? 0) + (tr.kind === 'buy' ? tr.units : -tr.units);
      cash += tr.kind === 'buy' ? -tr.amount : tr.amount;
    }
    if (d % step === 0 || d === s.day) {
      let v = cash;
      for (const [id, u] of Object.entries(units)) v += u * path.prices[id][d];
      out.you.push((v / STARTING_CASH) * 100);
      out.market.push(path.index[d]);
      out.days.push(d);
    }
  }
  return out;
}

/** Index of the sample closest to a given trading day, for placing markers. */
export function sampleAt(series: Series, day: number) {
  let best = 0;
  for (let i = 0; i < series.days.length; i++) if (Math.abs(series.days[i] - day) < Math.abs(series.days[best] - day)) best = i;
  return best;
}
