/**
 * Tests for the claims the product makes, not for whether functions run.
 * Several of these exist because an earlier version broke exactly that claim;
 * those are marked "regression".
 */
import { dayChange, getMarketPath, historyTo, priceOn, REGIMES, TRADING_DAYS } from '@/lib/market';
import { gates, overall, snapshot, traits } from '@/lib/dna';
import { portfolioSeries } from '@/lib/history';
import { respond } from '@/lib/coach';
import { splitSip, MIN_PER_FUND } from '@/lib/sip';
import { defaultPlan } from '@/lib/plan';
import { demoState } from '@/state/demo';
import { INSTRUMENTS } from '@/data/instruments';
import { STARTING_CASH, type GameState, type HorizonId, type ReasonId, type Trade } from '@/lib/types';
import { STORIES } from './stories';
import { CORE, HOLDOUT, PARAPHRASE, type Case } from './coach.cases';

let fails = 0;
let count = 0;
const ok = (name: string, cond: boolean, extra = '') => {
  count++;
  if (!cond) { fails++; console.log(`FAIL  ${name}${extra ? `  -> ${extra}` : ''}`); }
  else console.log(`pass  ${name}`);
};
const section = (t: string) => console.log(`\n-- ${t}`);

// ---------------------------------------------------------------------------
section('Market');
for (const r of REGIMES) {
  const p = getMarketPath(r.id);
  const end = p.index[TRADING_DAYS] / 100 - 1;
  ok(`${r.id}: finishes within 2% of its stated return (${(end * 100).toFixed(1)}% vs ${(r.drift * 100).toFixed(0)}%)`, Math.abs(end - r.drift) < 0.02);
  ok(`${r.id}: every price is positive and finite`, Object.values(p.prices).every((s) => s.every((v) => v > 0 && Number.isFinite(v))));
  for (const [claim, holds] of STORIES[r.id](p)) ok(`${r.id}: ${claim}`, holds);
}
const crash = getMarketPath('crash2020');
let peak = crash.index[0], maxDD = 0;
for (const v of crash.index) { peak = Math.max(peak, v); maxDD = Math.min(maxDD, v / peak - 1); }
ok(`crash2020: falls more than 25% (${(maxDD * 100).toFixed(1)}%)`, maxDD < -0.25);
ok('crash2020: ends above where it started', crash.index[TRADING_DAYS] > 100);
ok('crash2020: fires a panic moment', crash.panicDay !== null);
ok('calm2017: never fires a panic moment', getMarketPath('calm2017').panicDay === null);
ok('paths are identical on every run', getMarketPath('crash2020').index[123] === crash.index[123]);

// regression: the detail sheet showed day 2's price while the list showed day 1's
ok('regression: chart history ends on the same price the list shows', INSTRUMENTS.every((i) =>
  [0, 37, 180].every((d) => { const h = historyTo('crash2020', i.id, d); return h[h.length - 1] === priceOn('crash2020', i.id, d); })));
// regression: every instrument read +0.00% on day one
ok('regression: day-one moves are not all zero', INSTRUMENTS.some((i) => Math.abs(dayChange('crash2020', i.id, 0)) > 0.01));
ok('history has a few months before day one', historyTo('crash2020', 'nifty50', 0).length > 40);

// ---------------------------------------------------------------------------
section('Investor DNA');
const base = (over: Partial<GameState> = {}): GameState => ({
  started: true, profile: null, regime: 'crash2020', day: 120, cash: 0, lots: [], trades: [],
  panics: [], pendingPanic: null, graduated: false, seenGlossary: [], plan: null, ...over,
});
const lot = (id: string, amount: number, h: HorizonId = 'years', r: ReasonId = 'understand', day = 0) => {
  const price = priceOn('crash2020', id, day);
  return { instrumentId: id, units: amount / price, cost: price, horizonId: h, reasonId: r, openedDay: day };
};
const buy = (id: string, amount: number, r: ReasonId, h: HorizonId, day = 0): Trade => {
  const price = priceOn('crash2020', id, day);
  return { id: `${id}-${day}`, instrumentId: id, kind: 'buy', amount, units: amount / price, price, day, reasonId: r, horizonId: h };
};

const gambler = base({
  lots: [lot('tatamotors', 100000, 'weeks', 'fomo')],
  trades: [buy('tatamotors', 100000, 'fomo', 'weeks')],
  panics: [{ day: 40, drawdown: -20, choice: 'sell', deliberationMs: 900 }],
});
const steady = base({
  cash: 10000,
  lots: [lot('nifty50', 40000, 'decade'), lot('hybrid', 25000, 'years', 'diversify'), lot('gold', 15000, 'years', 'diversify'), lot('largecap', 10000, 'decade', 'longterm')],
  trades: [buy('nifty50', 40000, 'understand', 'decade'), buy('hybrid', 25000, 'diversify', 'years'), buy('gold', 15000, 'diversify', 'years'), buy('largecap', 10000, 'longterm', 'decade')],
  panics: [{ day: 40, drawdown: -20, choice: 'hold', deliberationMs: 9000 }],
});
const g = overall(traits(gambler, snapshot(gambler)));
const st = overall(traits(steady, snapshot(steady)));
ok(`a diversified, patient run outscores a concentrated, impulsive one (${st} vs ${g})`, st > g + 30);
ok('an empty account scores 0, not NaN', overall(traits(base(), snapshot(base()))) === 0);
ok('every trait stays between 0 and 100', [gambler, steady].every((x) => traits(x, snapshot(x)).every((t) => t.score >= 0 && t.score <= 100)));
ok('selling at the panic drops Composure below 40', traits(gambler, snapshot(gambler)).find((t) => t.id === 'composure')!.score < 40);
ok('holding through it keeps Composure above 80', traits(steady, snapshot(steady)).find((t) => t.id === 'composure')!.score > 80);
ok('money in on momentum drops Conviction below 20', traits(gambler, snapshot(gambler)).find((t) => t.id === 'conviction')!.score < 20);
ok('patience is not scored on day one', traits(base({ day: 0, trades: steady.trades, lots: steady.lots }), snapshot(base({ day: 0, lots: steady.lots }))).find((t) => t.id === 'patience')!.score === 0);
const sSnap = snapshot(steady);
ok('position weights add up to 100%', Math.abs(sSnap.positions.reduce((t, p) => t + p.weight, 0) - 100) < 0.01);
ok('total equals holdings plus cash', Math.abs(sSnap.total - (sSnap.value + sSnap.cash)) < 0.01);

// regression: selling everything at the panic still ticked "hold through one market fall"
ok('regression: selling at the panic does not count as holding through a fall', !gates(gambler, snapshot(gambler)).find((x) => x.id === 'fall')!.done);
ok('holding at the panic does count', gates(steady, sSnap).find((x) => x.id === 'fall')!.done);

// ---------------------------------------------------------------------------
section('Portfolio history');
const later = base({
  day: 60, cash: STARTING_CASH - 50000,
  lots: [lot('nifty50', 50000, 'decade', 'understand', 30)],
  trades: [buy('nifty50', 50000, 'understand', 'decade', 30)],
});
const series = portfolioSeries(later, 1000);
const before = series.you[series.days.indexOf(29)];
// regression: the chart used today's holdings for every day, including before they were bought
ok('regression: the line is flat before the first purchase', Math.abs(before - 100) < 1e-9, String(before));
ok('the last point of the line matches the headline total', Math.abs(series.you[series.you.length - 1] / 100 * STARTING_CASH - snapshot(later).total) < 0.01);

// ---------------------------------------------------------------------------
section('Real SIP split');
const three = [{ id: 'nifty50', value: 34000 }, { id: 'hybrid', value: 18000 }, { id: 'gold', value: 12000 }];
for (const amount of [100, 250, 500, 1000, 3000]) {
  const { parts } = splitSip(amount, three);
  ok(`₹${amount}: every fund gets at least ₹${MIN_PER_FUND}`, parts.every((p) => p.amount >= MIN_PER_FUND), JSON.stringify(parts));
  ok(`₹${amount}: the parts add up exactly`, parts.reduce((t, p) => t + p.amount, 0) === amount);
}
// regression: ₹100 used to be split three ways into ₹33 SIPs that no fund accepts
ok('regression: ₹100 goes into the single largest fund', JSON.stringify(splitSip(100, three).parts) === JSON.stringify([{ id: 'nifty50', amount: 100 }]));
ok('₹1,000 keeps all three funds', splitSip(1000, three).parts.length === 3);
for (const income of [8000, 32000, 65000]) {
  const pl = defaultPlan(income);
  ok(`salary plan for ₹${income} adds up and leaves needs above 40%`, pl.needs + pl.buffer + pl.wants + pl.invest === income && pl.needs >= income * 0.4);
}

// ---------------------------------------------------------------------------
section('Coach');
const demo = demoState();
const dSnap = snapshot(demo);
const run = (set: Case[]) => set.map((c) => {
  const got = respond(c.q, demo, dSnap).guard ?? 'answer';
  const want = Array.isArray(c.expect) ? c.expect : [c.expect];
  return { c, got, pass: want.includes(got as never) };
});
for (const [name, set] of [['core', CORE], ['paraphrase', PARAPHRASE]] as const) {
  for (const r of run(set)) ok(`${name}: "${r.c.q}"`, r.pass, `expected ${r.c.expect}, got ${r.got}`);
}
const banned = /\b(will|definitely|certainly|guaranteed to) (rise|go up|grow|double)\b|you should (buy|sell|hold)\b/i;
ok('no reply anywhere promises a rise or tells you to buy, sell or hold',
  [...CORE, ...PARAPHRASE, ...HOLDOUT].every((c) => !banned.test(respond(c.q, demo, dSnap).text)));
ok('no reply repeats the disclaimer (the screen carries it once)',
  [...CORE, ...PARAPHRASE].every((c) => !/not financial advice/i.test(respond(c.q, demo, dSnap).text)));
const top = [...dSnap.positions].sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl))[0];
ok('"why did my portfolio fall" names the biggest mover in rupees',
  respond('Why did my portfolio fall?', demo, dSnap).text.startsWith(`Mostly ${INSTRUMENTS.find((i) => i.id === top.lot.instrumentId)!.name}`));

// Reported, never asserted. See test/coach.cases.ts for why.
const held = run(HOLDOUT);
console.log(`\n-- Coach holdout (reported, not asserted): ${held.filter((r) => r.pass).length}/${held.length}`);
for (const r of held) console.log(`  ${r.pass ? 'ok  ' : 'miss'}  "${r.c.q}"  -> ${r.got}${r.pass ? '' : `  (wanted ${r.c.expect})`}`);

console.log(fails === 0 ? `\nALL ${count} PASS` : `\n${fails} of ${count} FAILED`);
process.exit(fails ? 1 : 0);
