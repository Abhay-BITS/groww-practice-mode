import { byId } from '@/data/instruments';
import { priceOn } from '@/lib/market';
import { horizon, reason, STARTING_CASH, type GameState, type Lot } from '@/lib/types';

export type Position = {
  lot: Lot;
  price: number;
  value: number;
  invested: number;
  pnl: number;
  pnlPct: number;
  weight: number;
};

export type Snapshot = {
  positions: Position[];
  invested: number;
  value: number;
  cash: number;
  total: number;
  pnl: number;
  pnlPct: number;
  largest: Position | null;
};

export function snapshot(s: GameState): Snapshot {
  const raw = s.lots.map((lot) => {
    const price = priceOn(s.regime, lot.instrumentId, s.day);
    const value = lot.units * price;
    const invested = lot.units * lot.cost;
    return { lot, price, value, invested, pnl: value - invested, pnlPct: invested ? (value / invested - 1) * 100 : 0, weight: 0 };
  });
  const value = raw.reduce((t, p) => t + p.value, 0);
  const invested = raw.reduce((t, p) => t + p.invested, 0);
  const positions = raw
    .map((p) => ({ ...p, weight: value ? (p.value / value) * 100 : 0 }))
    .sort((a, b) => b.value - a.value);
  const total = value + s.cash;
  return {
    positions,
    invested,
    value,
    cash: s.cash,
    total,
    pnl: total - STARTING_CASH,
    pnlPct: (total / STARTING_CASH - 1) * 100,
    largest: positions[0] ?? null,
  };
}

export type Trait = {
  id: 'spread' | 'patience' | 'composure' | 'conviction';
  label: string;
  score: number;
  /** What the number is actually measuring, in the user's own data. */
  evidence: string;
  /** The single thing that would move this number. */
  nudge: string;
};

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/**
 * Four traits, each derived only from what the user actually did. No trait
 * rewards making money -- a lucky bet on one stock scores badly on three of
 * the four, which is the point.
 */
export function traits(s: GameState, snap: Snapshot): Trait[] {
  // --- Spread: Herfindahl on weights, plus credit for distinct categories.
  const hhi = snap.positions.reduce((t, p) => t + Math.pow(p.weight / 100, 2), 0);
  const cats = new Set(snap.positions.map((p) => byId(p.lot.instrumentId).category)).size;
  // Herfindahl runs 1 (everything in one holding) down towards 0 (evenly
  // spread). Categories earn a smaller bonus on top, because four holdings that
  // are all large-cap equity are less spread than the count suggests. Tuned so
  // a sensible four-way split lands in the high eighties, not at 100 -- this
  // score should stay reachable without ever being finished.
  const spreadScore = snap.positions.length === 0 ? 0 : clamp((1 - hhi) * 95 + cats * 5);
  const topWeight = snap.largest ? Math.round(snap.largest.weight) : 0;

  // --- Patience: did exits respect the horizon the user signed up to?
  const sells = s.trades.filter((t) => t.kind === 'sell');
  const broken = sells.filter((t) => {
    const opened = s.trades.find((x) => x.kind === 'buy' && x.instrumentId === t.instrumentId);
    if (!opened) return false;
    return t.day - opened.day < horizon(opened.horizonId).days;
  }).length;
  const churn = s.trades.length ? sells.length / s.trades.length : 0;
  // Not measurable on day one: nobody has been patient yet. Scored once a month has passed.
  const patienceScore = s.trades.length === 0 || s.day < 20 ? 0 : clamp(100 - broken * 26 - churn * 40);

  // --- Composure: what you did the day the floor fell out.
  const panicScore = s.panics.length === 0
    ? 0
    : clamp(
        s.panics.reduce((t, p) => {
          const base = p.choice === 'sell' ? 18 : p.choice === 'hold' ? 88 : 96;
          // Deciding in under four seconds is a reflex, not a decision.
          const considered = p.deliberationMs > 4000 ? 8 : 0;
          return t + base + considered;
        }, 0) / s.panics.length,
      );

  // --- Conviction: the quality of the reasons attached to real rupees.
  const buys = s.trades.filter((t) => t.kind === 'buy');
  const weighted = buys.reduce((t, b) => t + reason(b.reasonId).quality * b.amount, 0);
  const totalBuy = buys.reduce((t, b) => t + b.amount, 0);
  const convictionScore = totalBuy === 0 ? 0 : clamp((weighted / totalBuy) * 100);
  const hypeRupees = buys.filter((b) => reason(b.reasonId).quality < 0.3).reduce((t, b) => t + b.amount, 0);

  return [
    {
      id: 'spread',
      label: 'Spread',
      score: spreadScore,
      evidence: snap.positions.length === 0
        ? 'You have not invested yet, so there is nothing to spread.'
        : `${snap.positions.length} holding${snap.positions.length > 1 ? 's' : ''} across ${cats} categor${cats > 1 ? 'ies' : 'y'}. Your largest is ${topWeight}% of the portfolio.`,
      nudge: topWeight > 40
        ? `${topWeight}% in one holding means that holding decides your result. Adding a second category would change that.`
        : 'No single holding is deciding your result. Worth keeping an eye on as you add more.',
    },
    {
      id: 'patience',
      label: 'Patience',
      score: patienceScore,
      evidence: s.trades.length === 0
        ? 'No trades yet.'
        : s.day < 20
          ? 'Too early to tell. Fast-forward at least a month and this starts counting.'
          : broken > 0
          ? `You exited ${broken} position${broken > 1 ? 's' : ''} earlier than the horizon you set when you bought.`
          : `${sells.length} exit${sells.length === 1 ? '' : 's'} out of ${s.trades.length} decisions, all within the horizon you set.`,
      nudge: broken > 0
        ? 'You picked that horizon before anything happened. Selling early usually means the price changed your mind, not new information.'
        : 'So far you have stuck to the plans you made when you bought. That is harder than it sounds once the market moves.',
    },
    {
      id: 'composure',
      label: 'Composure',
      score: panicScore,
      evidence: s.panics.length === 0
        ? 'The market has not tested you yet. Fast-forward until it does.'
        : s.panics.map((p) => `At a ${Math.abs(Math.round(p.drawdown))}% fall you chose to ${p.choice === 'buy' ? 'buy more' : p.choice}.`).join(' '),
      nudge: s.panics.some((p) => p.choice === 'sell')
        ? 'A fall only becomes a loss when you sell. In this year, the market came back after the point where you got out.'
        : 'You did not sell into a falling market. Most of the difference between new and experienced investors comes down to that one habit.',
    },
    {
      id: 'conviction',
      label: 'Conviction',
      score: convictionScore,
      evidence: buys.length === 0
        ? 'No reasons recorded yet.'
        : hypeRupees > 0
          ? `₹${Math.round(hypeRupees).toLocaleString('en-IN')} of your money went in on a tip or on momentum.`
          : 'Every rupee you invested had a reason you could defend.',
      nudge: hypeRupees > 0
        ? 'If you bought on a tip, you will need another tip to know when to sell. That is what makes them expensive.'
        : 'Every rupee has a reason you can check later. That is what makes the replay useful.',
    },
  ];
}

export function overall(list: Trait[]) {
  const scored = list.filter((t) => t.score > 0);
  if (!scored.length) return 0;
  return Math.round(list.reduce((t, x) => t + x.score, 0) / list.length);
}

export function grade(score: number) {
  if (score >= 80) return { label: 'Steady', tone: 'good' as const };
  if (score >= 60) return { label: 'Building', tone: 'good' as const };
  if (score >= 35) return { label: 'Finding your feet', tone: 'warn' as const };
  if (score > 0) return { label: 'Early days', tone: 'warn' as const };
  return { label: 'Not measured yet', tone: 'muted' as const };
}

/**
 * Observations about the portfolio as it stands. These describe consequences,
 * never verdicts -- "this holding decides your result" rather than "bad call".
 */
export function portfolioInsights(s: GameState, snap: Snapshot): { title: string; body: string; tone: 'info' | 'warn' | 'good' }[] {
  const out: { title: string; body: string; tone: 'info' | 'warn' | 'good' }[] = [];
  if (!snap.positions.length) return out;

  const top = snap.largest!;
  const topName = byId(top.lot.instrumentId).name;
  if (top.weight > 40) {
    out.push({
      title: `${topName} is ${Math.round(top.weight)}% of your portfolio`,
      body: `A 10% move in ${topName} alone moves your whole portfolio by about ${(top.weight / 10).toFixed(1)}%. Right now this one holding is making most of the decisions for you.`,
      tone: 'warn',
    });
  }

  const cats = new Set(snap.positions.map((p) => byId(p.lot.instrumentId).category));
  if (cats.size >= 3) {
    out.push({
      title: `You hold ${cats.size} different categories`,
      body: `${[...cats].join(', ')}. These do not all move together, which is why your portfolio swings less than any single thing inside it.`,
      tone: 'good',
    });
  }

  const stockWeight = snap.positions
    .filter((p) => byId(p.lot.instrumentId).category === 'Stock')
    .reduce((t, p) => t + p.weight, 0);
  if (stockWeight > 60) {
    out.push({
      title: `${Math.round(stockWeight)}% of your money is in individual stocks`,
      body: 'Individual companies carry risks a fund spreads out: one bad result, one management change, one regulation. Funds dilute that. Stocks concentrate it.',
      tone: 'info',
    });
  }

  if (snap.cash / STARTING_CASH > 0.6 && s.day > 20) {
    out.push({
      title: `₹${Math.round(snap.cash).toLocaleString('en-IN')} is still sitting in cash`,
      body: 'Waiting for a better entry point is itself a decision, and one that is hard to time. Notice how that cash performed while the market moved.',
      tone: 'info',
    });
  }

  const sips = snap.positions.filter((p) => horizon(p.lot.horizonId).days >= 750).length;
  if (sips && s.day > 60) {
    out.push({
      title: `${sips} of your holdings were bought for the long run`,
      body: 'You set a multi-year horizon on these. Over that long, this month\'s moves matter a lot less than they feel like they do.',
      tone: 'good',
    });
  }
  return out;
}

export type Gate = { id: 'two' | 'fall' | 'dna' | 'spread'; label: string; done: boolean; detail?: string };

/**
 * What stands between practice and a real SIP. Shared by Home and Graduate so
 * the two screens can never disagree about whether someone is ready.
 */
export function gates(s: GameState, snap: Snapshot): Gate[] {
  const buys = s.trades.filter((t) => t.kind === 'buy').length;
  const held = s.panics.some((p) => p.choice !== 'sell');
  const soldAtPanic = s.panics.some((p) => p.choice === 'sell');
  const dna = overall(traits(s, snap));
  const cats = new Set(snap.positions.map((p) => byId(p.lot.instrumentId).category)).size;
  return [
    { id: 'two', label: 'Make at least two practice investments', done: buys >= 2, detail: buys < 2 ? `${buys} of 2 so far` : undefined },
    {
      id: 'fall', label: 'Hold through one market fall', done: held,
      detail: held ? undefined : soldAtPanic ? 'You sold at the last one. Reset or try another year for another go.' : 'Fast-forward until the market drops',
    },
    { id: 'dna', label: 'Reach an Investor DNA of 60', done: dna >= 60, detail: dna < 60 ? `You are at ${dna}` : undefined },
    { id: 'spread', label: 'Hold more than one kind of investment', done: cats > 1, detail: cats <= 1 ? 'Stocks, index funds, mutual funds or gold' : undefined },
  ];
}
