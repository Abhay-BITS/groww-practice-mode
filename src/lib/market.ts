import { INSTRUMENTS } from '@/data/instruments';

/**
 * A deterministic market. Every user who fast-forwards sees the same twelve
 * months, which is what makes Investor DNA comparable between people and makes
 * the panic moment land at a reproducible point.
 */

export type RegimeId = 'crash2020' | 'grind2022' | 'calm2017';

export type Regime = {
  id: RegimeId;
  label: string;
  blurb: string;
  /** What actually happened in the year this one is shaped like. Shown at the end of a run. */
  reality: string;
  drift: number;
  vol: number;
  seed: number;
  /**
   * Offset for the per-instrument noise. Chosen by search so that each year
   * tells its textbook story (high-beta falls hardest in a crash, gold holds up
   * in 2020, high-beta leads in an easy year). test/engine.test.ts enforces it.
   */
  noise: number;
  /** Scripted shock: [startDay, lengthInDays, totalIndexMovePercent] */
  shock?: [number, number, number];
};

export const REGIMES: Regime[] = [
  {
    id: 'crash2020',
    label: 'The 2020 crash',
    blurb: 'Falls off a cliff in a month, then climbs back past where it started.',
    reality: 'The Nifty 50 fell about 38% between January and March 2020, then ended the year higher than it began. People who sold in March locked in the fall. People whose SIPs kept running bought near the bottom without trying to.',
    drift: 0.085,
    vol: 1.35,
    seed: 20200324,
    noise: 22,
    shock: [34, 22, -33],
  },
  {
    id: 'grind2022',
    label: 'The sideways year',
    blurb: 'No crash, one 15% dip, and a year of going nowhere while the news stays loud.',
    reality: 'The Nifty 50 ended 2022 close to where it started, after swinging more than 15% along the way. Most people who stopped investing that year stopped out of boredom, not fear.',
    drift: 0.01,
    vol: 0.95,
    seed: 20220617,
    noise: 0,
  },
  {
    id: 'calm2017',
    label: 'The easy year',
    blurb: 'Everything goes up. Worth trying once, to see how little it teaches you.',
    reality: 'The Nifty 50 rose about 29% in 2017 with hardly any fall along the way. Years like that make luck and skill feel identical from the inside.',
    drift: 0.27,
    vol: 0.55,
    seed: 20171231,
    noise: 0,
  },
];

export const TRADING_DAYS = 250;
/** Trading days of price history shown before day one, so charts are not empty on arrival. */
export const PRE_DAYS = 60;

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

/** Daily index returns in percent, length days + 1 (index 0 = 0). */
function indexReturns(seed: number, days: number, drift: number, vol: number, shock?: [number, number, number]) {
  const r = rng(seed);
  const dailyDrift = (Math.pow(1 + drift, 1 / days) - 1) * 100;
  const path: number[] = [0];
  for (let d = 1; d <= days; d++) path.push(dailyDrift + normal(r) * vol);

  if (shock) {
    const [start, len, total] = shock;
    // Front-loaded, so it feels like a cliff rather than a slope.
    const perDay = (Math.pow(1 + total / 100, 1 / len) - 1) * 100;
    for (let i = 0; i < len; i++) {
      const weight = 1.8 - (1.6 * i) / len;
      path[start + i] = perDay * weight + normal(r) * vol * 1.6;
    }
    for (let i = start + len; i <= days; i++) path[i] += dailyDrift * 1.9;
  }

  // Pin the endpoint. A random walk wanders, and a year called "sideways" that
  // happens to finish down 20% teaches the wrong lesson. The correction is
  // spread evenly in log space, so the shape survives and only the ending moves.
  let realised = 0;
  for (let d = 1; d <= days; d++) realised += Math.log(1 + path[d] / 100);
  const adjust = (Math.log(1 + drift) - realised) / days;
  for (let d = 1; d <= days; d++) path[d] = ((1 + path[d] / 100) * Math.exp(adjust) - 1) * 100;
  return path;
}

function levels(returns: number[]) {
  const out = [100];
  for (let d = 1; d < returns.length; d++) out.push(out[d - 1] * (1 + returns[d] / 100));
  return out;
}

/**
 * Instrument prices follow the index through their beta, plus a mean-reverting
 * wobble of their own. The wobble is what lets two stocks differ; the reversion
 * is what stops one of them shrugging off a crash, which an earlier version
 * did, and which made a high-risk stock look safer than a balanced fund.
 */
function instrumentPath(index: number[], beta: number, wander: number, seed: number, startPrice: number) {
  const r = rng(seed);
  const phi = 0.96;
  const sigma = (wander / 100) * Math.sqrt(1 - phi * phi);
  let x = 0;
  const out = [startPrice];
  for (let d = 1; d < index.length; d++) {
    x = phi * x + sigma * normal(r);
    out.push(startPrice * Math.exp(beta * Math.log(index[d] / index[0]) + x));
  }
  return out;
}

export type MarketPath = {
  regime: Regime;
  /** index[d] is the index level on day d, base 100 on day 0. */
  index: number[];
  /** prices[id][d] for d in 0..TRADING_DAYS */
  prices: Record<string, number[]>;
  /** pre[id] holds PRE_DAYS + 1 prices; the last one equals prices[id][0]. */
  pre: Record<string, number[]>;
  /** First day the index is 12% below its running peak, or null if the year never gets that scary. */
  panicDay: number | null;
  /** Day of the index low, used to show how hard the bottom is to time. */
  bottomDay: number;
};

const cache = new Map<string, MarketPath>();

export function getMarketPath(id: RegimeId): MarketPath {
  const regime = REGIMES.find((x) => x.id === id)!;
  // Keyed on the noise offset too, so the seed search in the tests can rebuild paths.
  const key = `${id}:${regime.noise}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const index = levels(indexReturns(regime.seed, TRADING_DAYS, regime.drift, regime.vol, regime.shock));
  // The months before day one are an ordinary, mildly rising market for every regime.
  const preIndex = levels(indexReturns(regime.seed ^ 0x5bd1e995, PRE_DAYS, 0.03, 0.8));

  const prices: Record<string, number[]> = {};
  const pre: Record<string, number[]> = {};
  for (const inst of INSTRUMENTS) {
    const seed = regime.seed + regime.noise * 104729 + inst.id.length * 7919 + inst.price;
    prices[inst.id] = instrumentPath(index, inst.beta, inst.wander, seed, inst.price);
    // Build the history forwards, then scale it so it lands exactly on today's price.
    const raw = instrumentPath(preIndex, inst.beta, inst.wander, seed ^ 0x2545f491, inst.price);
    const k = inst.price / raw[raw.length - 1];
    pre[inst.id] = raw.map((v) => v * k);
  }

  // The moment a first-time investor reaches for the sell button is the moment
  // worth recording, so that is where the panic alert fires.
  let peak = index[0];
  let panicDay: number | null = null;
  let bottomDay = 0;
  for (let d = 1; d <= TRADING_DAYS; d++) {
    peak = Math.max(peak, index[d]);
    if (panicDay === null && index[d] / peak - 1 <= -0.12) panicDay = d;
    if (index[d] < index[bottomDay]) bottomDay = d;
  }

  const built: MarketPath = { regime, index, prices, pre, panicDay, bottomDay };
  cache.set(key, built);
  return built;
}

const clampDay = (day: number) => Math.min(Math.max(day, 0), TRADING_DAYS);

export function priceOn(regimeId: RegimeId, instrumentId: string, day: number) {
  return getMarketPath(regimeId).prices[instrumentId][clampDay(day)];
}

/** One-day move in percent. On day 0 it uses the last day of history, so nothing reads +0.00%. */
export function dayChange(regimeId: RegimeId, instrumentId: string, day: number) {
  const path = getMarketPath(regimeId);
  const today = path.prices[instrumentId][clampDay(day)];
  const prev = day <= 0 ? path.pre[instrumentId][PRE_DAYS - 1] : path.prices[instrumentId][clampDay(day) - 1];
  return (today / prev - 1) * 100;
}

/** History up to and including `day`: the pre-start months, then the run so far. */
export function historyTo(regimeId: RegimeId, instrumentId: string, day: number) {
  const path = getMarketPath(regimeId);
  return [...path.pre[instrumentId].slice(0, PRE_DAYS), ...path.prices[instrumentId].slice(0, clampDay(day) + 1)];
}

/** Trading days are not calendar days. 250 of them is roughly a year. */
export function dayLabel(day: number) {
  if (day <= 0) return 'Day 1';
  const months = Math.floor((day / TRADING_DAYS) * 12);
  if (months < 1) return `Week ${Math.max(1, Math.round(day / 5))}`;
  return `Month ${months}`;
}
