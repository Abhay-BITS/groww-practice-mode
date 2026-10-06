import { useEffect, useMemo, useState } from 'react';
import { Clock, FastForward, Pause, TrendingDown } from 'lucide-react';
import { dayLabel, getMarketPath, REGIMES, TRADING_DAYS, type RegimeId } from '@/lib/market';
import { portfolioSeries, sampleAt } from '@/lib/history';
import { useStore } from '@/state/store';
import { Confirm, inr, J, Lines, pct, SimBadge } from '@/components/ui';
import type { Snapshot } from '@/lib/dna';

/**
 * A year in about a minute of clock time. You can't sit through a real
 * drawdown in a two-week trial, and sitting through one is the thing reading
 * about investing can't give you.
 */
export function TimeMachine({ snap }: { snap: Snapshot }) {
  const { s, advance, setRegime } = useStore();
  const [running, setRunning] = useState(false);
  const [switchTo, setSwitchTo] = useState<RegimeId | null>(null);
  const path = getMarketPath(s.regime);
  const done = s.day >= TRADING_DAYS;
  const series = useMemo(() => portfolioSeries(s), [s]);

  useEffect(() => {
    if (!running) return;
    if (done || s.pendingPanic) { setRunning(false); return; }
    const t = window.setInterval(() => advance(4), 120);
    return () => window.clearInterval(t);
  }, [running, done, s.pendingPanic, advance]);

  useEffect(() => { if (s.pendingPanic) setRunning(false); }, [s.pendingPanic]);

  const market = (path.index[s.day] / 100 - 1) * 100;
  const gap = snap.pnlPct - market;
  const panic = s.panics[0];
  const empty = snap.positions.length === 0 && s.trades.length === 0;

  return (
    <div className="pad" style={{ paddingTop: 16 }}>
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="row between" style={{ marginBottom: 10 }}>
          <div className="row" style={{ gap: 7 }}>
            <Clock size={15} color="var(--blue)" />
            <span className="tiny" style={{ fontWeight: 650, letterSpacing: '.04em', textTransform: 'uppercase' }}>{dayLabel(s.day)}</span>
          </div>
          <SimBadge label="Modelled market" />
        </div>
        <div className="hero-value num" style={{ fontSize: 30 }}>{inr(snap.total)}</div>
        <div className="row" style={{ gap: 10, marginTop: 5, flexWrap: 'wrap' }}>
          <span className={`num ${snap.pnl >= 0 ? 'pos' : 'neg'}`} style={{ fontSize: 14, fontWeight: 650 }}>
            You {pct(snap.pnlPct)}
          </span>
          <span className="num" style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-3)' }}>Market {pct(market)}</span>
        </div>
        <div style={{ margin: '14px 0 4px' }}>
          <Lines
            you={series.you} market={series.market} height={104}
            markers={s.panics.map((p) => ({ at: sampleAt(series, p.day), tone: p.choice === 'sell' ? 'bad' as const : 'good' as const }))}
          />
        </div>
        <div className="legend" style={{ marginTop: 8 }}>
          <span><i style={{ background: snap.pnl >= 0 ? 'var(--green)' : 'var(--red)' }} />Your practice money</span>
          <span><i style={{ background: 'var(--ink-4)' }} />Nifty 50</span>
        </div>
      </div>

      <div className="meter" style={{ marginBottom: 14 }}>
        <i style={{ width: `${Math.max((s.day / TRADING_DAYS) * 100, 1)}%`, background: 'var(--blue)' }} />
      </div>

      {empty && (
        <div className="card tint-amber" style={{ marginBottom: 14, padding: 12 }}>
          <p className="tiny" style={{ color: '#7a5206' }}>You haven&rsquo;t invested anything yet, so there&rsquo;s nothing for the year to happen to. Explore first.</p>
        </div>
      )}

      {!done && (
        <div className="row" style={{ gap: 9, marginBottom: 16 }}>
          <button className="btn" onClick={() => setRunning(!running)} disabled={!!s.pendingPanic || empty}>
            {running ? <><Pause size={17} /> Pause</> : <><FastForward size={17} /> {s.day === 0 ? 'Start the year' : 'Keep going'}</>}
          </button>
          <button className="btn ghost nowrap" style={{ width: 'auto', padding: '0 16px', flex: 'none' }} onClick={() => { setRunning(false); advance(20); }} disabled={!!s.pendingPanic || empty}>
            +1 month
          </button>
        </div>
      )}

      {done && (
        <div className="card tint-green" style={{ marginBottom: 16 }}>
          <b style={{ fontSize: 14.5, color: 'var(--ink)', fontWeight: 700, display: 'block', marginBottom: 6 }}>That&rsquo;s the year.</b>
          <p className="sub" style={{ fontSize: 13, marginBottom: 10 }}>
            You finished {pct(snap.pnlPct)}. The market finished {pct(market)}. {Math.abs(gap) < 1
              ? 'You tracked it almost exactly.'
              : gap > 0
                ? `You beat it by ${Math.abs(gap).toFixed(1)} points.`
                : `You trailed it by ${Math.abs(gap).toFixed(1)} points, mostly down to ${s.panics.some((p) => p.choice === 'sell') ? 'selling during the fall' : snap.cash > 30000 ? 'cash that sat out the recovery' : 'what you chose to hold'}.`}
          </p>
          <p className="sub" style={{ fontSize: 13 }}>{path.regime.reality}</p>
        </div>
      )}

      {done && s.profile?.fear === 'timing' && path.regime.shock && (
        <div className="card flat" style={{ marginBottom: 16 }}>
          <p className="sub" style={{ fontSize: 13 }}>
            You said you never know when to start. The lowest point this year was {dayLabel(path.bottomDay).toLowerCase()},
            {' '}{Math.abs(Math.round((path.index[path.bottomDay] / 100 - 1) * 100))}% below where it started. To have bought exactly there,
            you&rsquo;d have needed to invest on the day the news was at its worst. Almost nobody does.
          </p>
        </div>
      )}

      {panic && (
        <div className={`card ${panic.choice === 'sell' ? 'tint-red' : 'tint-green'}`} style={{ marginBottom: 16 }}>
          <span className="tiny" style={{ fontWeight: 650, letterSpacing: '.04em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>When it fell</span>
          <p className="sub" style={{ fontSize: 13 }}>
            In {dayLabel(panic.day).toLowerCase()} the market was {Math.abs(Math.round(panic.drawdown))}% below its high, a{' '}
            <J t="drawdown">drawdown</J>.
            You took {(panic.deliberationMs / 1000).toFixed(1)} seconds and chose to{' '}
            <b style={{ color: 'var(--ink)' }}>{panic.choice === 'buy' ? 'buy more' : panic.choice === 'sell' ? 'sell everything' : 'hold'}</b>.
            {' '}{panic.choice === 'sell'
              ? 'The market recovered after that. Selling is what turned the fall into a loss.'
              : 'Plenty of people with real money do the opposite.'}
          </p>
        </div>
      )}

      <div className="h-section" style={{ marginBottom: 4 }}>Try a different year</div>
      <p className="tiny" style={{ marginBottom: 12 }}>Switching starts your practice run again, so the comparison is fair.</p>
      <div className="stack sm">
        {REGIMES.map((r) => (
          <button key={r.id} className={`option ${s.regime === r.id ? 'on' : ''}`} onClick={() => s.regime !== r.id && setSwitchTo(r.id)}>
            <div className="grow">
              <b>{r.label}</b>
              <span>{r.blurb}</span>
            </div>
            {r.shock && <TrendingDown size={17} color="var(--red)" style={{ flex: 'none' }} />}
          </button>
        ))}
      </div>

      <p className="tiny" style={{ marginTop: 18 }}>
        Each year is shaped like a real one in the Indian market, but the prices are generated. Nothing here
        is a forecast.
      </p>

      {switchTo && (
        <Confirm
          title={`Switch to ${REGIMES.find((r) => r.id === switchTo)!.label.toLowerCase()}?`}
          body="Your holdings, journal and Investor DNA start again from zero. Your salary plan stays."
          yes="Switch and start again"
          onYes={() => { setRegime(switchTo); setSwitchTo(null); }}
          onNo={() => setSwitchTo(null)}
        />
      )}
    </div>
  );
}

/** The interrupt. Blocks the app until answered, and times the answer. */
export function PanicModal() {
  const { s, answerPanic } = useStore();
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const i = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => window.clearInterval(i);
  }, []);
  if (!s.pendingPanic) return null;
  const dd = Math.abs(Math.round(s.pendingPanic.drawdown));
  const scared = s.profile?.fear === 'losing';

  return (
    <div className="scrim center" style={{ background: 'rgba(18,18,18,.72)', zIndex: 120 }}>
      <div className="modal" style={{ borderTop: '4px solid var(--red)' }}>
        <div className="row alarm" style={{ gap: 8, marginBottom: 12 }}>
          <TrendingDown size={19} color="var(--red)" />
          <span className="tiny" style={{ fontWeight: 700, color: 'var(--red)', letterSpacing: '.06em', textTransform: 'uppercase' }}>
            Market alert
          </span>
        </div>
        <div className="h-screen" style={{ fontSize: 21, marginBottom: 10 }}>
          The market is down {dd}% from its high. Everyone you follow is posting about it.
        </div>
        <p className="sub" style={{ marginBottom: 6 }}>
          {scared
            ? "You said losing money is what's held you back. This is what it feels like. It's practice money, so this is the cheapest it will ever be to find out what you do."
            : 'What you do in the next minute matters more than anything you picked so far. There is no right answer on this screen, only yours.'}
        </p>
        <p className="tiny" style={{ marginBottom: 18 }}>{elapsed}s so far. No rush.</p>

        {/* Identical styling on purpose. Making one of these the primary button would be a recommendation. */}
        <div className="stack sm">
          <button className="btn ghost" onClick={() => answerPanic('sell')}>Sell everything</button>
          <button className="btn ghost" onClick={() => answerPanic('hold')}>Do nothing</button>
          <button className="btn ghost" onClick={() => answerPanic('buy')}>Buy a little more</button>
        </div>
        <p className="tiny" style={{ marginTop: 14, textAlign: 'center' }}>Simulated event. Not a recommendation.</p>
      </div>
    </div>
  );
}
