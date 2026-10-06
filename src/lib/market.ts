import { INSTRUMENTS } from '@/data/instruments';

/**
 * A deterministic market. Every user who fast-forwards sees the same twelve
 * months, which is what makes the Decision Replay comparable between sessions
 * and makes the Panic Moment land at a scripted, reproducible point.
 */

export type RegimeId = 'crash2020' | 'grind2022' | 'calm2017';

export type Regime = {
  id: RegimeId;
  label: string;
  blurb: string;
  /** What actually happened, shown after the run so the lesson has an anchor. */
  reality: string;
  drift: number;
  vol: number;
  seed: number;
  /** Scripted shock: [startDay, lengthInDays, totalIndexMovePercent] */
  shock?: [number, number, number];
};

export const REGIMES: Regime[] = [
  {
    id: 'crash2020',
    label: 'The 2020 shock',
    blurb: 'A market that falls off a cliff in four weeks, then climbs back harder than it fell.',
    reality: 'The Nifty 50 fell about 38% between January and March 2020, then finished the year higher than it started. Investors who sold in March locked in the fall. Investors who kept their SIPs running bought the bottom without trying to.',
    drift: 0.085,
    vol: 1.35,
    seed: 20200324,
    shock: [34, 22, -33],
  },
  {
    id: 'grind2022',
    label: 'The sideways year',
    blurb: 'No crash, no rally. Twelve months of going nowhere while the news stays loud.',
    reality: 'Through 2022 the Nifty 50 ended roughly where it began, after swinging up and down by more than 15% on the way. Most people who quit that year quit out of boredom, not fear.',
    drift: 0.01,
    vol: 0.95,
    seed: 20220617,
  },
  {
    id: 'calm2017',
    label: 'The easy year',
    blurb: 'Everything goes up. Useful, because it shows you how little you learn when it does.',
    reality: 'The Nifty 50 rose about 29% in 2017 with almost no drawdown. Years like this teach beginners the wrong lesson: that conviction and luck feel identical from the inside.',
    drift: 0.27,
    vol: 0.55,
    seed: 20171231,
  },
];

export const TRADING_DAYS = 250;

/** mulberry32: small, fast, and reproducible across browsers. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Box-Muller, so the noise has tails rather than a flat band. */
function normal(r: () => number) {
  const u = Math.max(r(), 1e-9);
  const v = Math.max(r(), 1e-9);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** Daily index returns in percent, length TRADING_DAYS + 1 (day 0 = 0). */
function buildIndexPath(regime: Regime): number[] {
  const r = rng(regime.seed);
  const dailyDrift = (Math.pow(1 + regime.drift, 1 / TRADING_DAYS) - 1) * 100;
  const path: number[] = [0];
  for (let d = 1; d <= TRADING_DAYS; d++) path.push(dailyDrift + normal(r) * regime.vol);

  if (regime.shock) {
    const [start, len, total] = regime.shock;
    // Spread the shock over `len` days, front-loaded so it feels like a cliff.
    const perDay = (Math.pow(1 + total / 100, 1 / len) - 1) * 100;
    for (let i = 0; i < len; i++) {
      const weight = 1.8 - (1.6 * i) / len;
      path[start + i] = perDay * weight + normal(r) * regime.vol * 1.6;
    }
    // The recovery: the market does not stay down, which is the whole point.
    for (let i = start + len; i <= TRADING_DAYS; i++) {
      path[i] = path[i] + dailyDrift * 1.9;
    }
  }

  // Pin the endpoint. Random walks wander, and a regime called "the sideways
  // year" that happens to finish down 20% teaches the wrong lesson. We spread
  // the correction evenly in log space, which fixes where the year ends without
  // flattening the shape -- the crash still crashes, it just recovers to the
  // level the regime advertises.
  let realised = 0;
  for (let d = 1; d <= TRADING_DAYS; d++) realised += Math.log(1 + path[d] / 100);
  const adjust = (Math.log(1 + regime.drift) - realised) / TRADING_DAYS;
  for (let d = 1; d <= TRADING_DAYS; d++) path[d] = ((1 + path[d] / 100) * Math.exp(adjust) - 1) * 100;

  return path;
}

export type MarketPath = {
  regime: Regime;
  /** index[d] = cumulative index level, base 100 */
  index: number[];
  /** prices[instrumentId][d] */
  prices: Record<string, number[]>;
  /** The day the Panic Moment fires, or null if this regime never gets scary enough. */
  panicDay: number | null;
};

const cache = new Map<RegimeId, MarketPath>();

export function getMarketPath(id: RegimeId): MarketPath {
  const hit = cache.get(id);
  if (hit) return hit;

  const regime = REGIMES.find((x) => x.id === id)!;
  const daily = buildIndexPath(regime);

  const index: number[] = [100];
  for (let d = 1; d <= TRADING_DAYS; d++) index.push(index[d - 1] * (1 + daily[d] / 100));

  const prices: Record<string, number[]> = {};
  for (const inst of INSTRUMENTS) {
    const r = rng(regime.seed + inst.id.length * 7919 + inst.price);
    const series = [inst.price];
    for (let d = 1; d <= TRADING_DAYS; d++) {
      const move = inst.beta * daily[d] + normal(r) * inst.idio;
      series.push(Math.max(series[d - 1] * (1 + move / 100), inst.price * 0.08));
    }
    prices[inst.id] = series;
  }

  // Fire the Panic Moment on the first day the index is more than 12% below its
  // running peak. That is the moment a first-time investor reaches for the sell
  // button, so that is the moment worth recording.
  let peak = index[0];
  let panicDay: number | null = null;
  for (let d = 1; d <= TRADING_DAYS; d++) {
    peak = Math.max(peak, index[d]);
    if (panicDay === null && index[d] / peak - 1 <= -0.12) panicDay = d;
  }

  const built: MarketPath = { regime, index, prices, panicDay };
  cache.set(id, built);
  return built;
}

export function priceOn(regimeId: RegimeId, instrumentId: string, day: number) {
  const path = getMarketPath(regimeId);
  const series = path.prices[instrumentId];
  return series[Math.min(Math.max(day, 0), TRADING_DAYS)];
}

/** Trading days are not calendar days. 250 of them is roughly a year. */
export function dayLabel(day: number) {
  const months = Math.floor((day / TRADING_DAYS) * 12);
  if (day === 0) return 'Day 1';
  if (months < 1) return `Week ${Math.max(1, Math.round(day / 5))}`;
  return `Month ${months}`;
}
