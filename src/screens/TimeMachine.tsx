import { useEffect, useRef, useState } from 'react';
import { Clock, FastForward, Flame, Pause, TrendingDown } from 'lucide-react';
import { dayLabel, getMarketPath, REGIMES, TRADING_DAYS } from '@/lib/market';
import { useStore } from '@/state/store';
import { inr, J, pct, signed, SimBadge, Spark } from '@/components/ui';
import type { Snapshot } from '@/lib/dna';

/**
 * Compresses a year into about a minute. A fourteen-day practice programme
 * cannot show a beginner a drawdown in real time, and a drawdown you have not
 * sat through is the one thing reading cannot teach.
 */
export function TimeMachine({ snap }: { snap: Snapshot }) {
  const { s, advance, setRegime } = useStore();
  const [running, setRunning] = useState(false);
  const timer = useRef<number | null>(null);
  const path = getMarketPath(s.regime);
  const done = s.day >= TRADING_DAYS;

  useEffect(() => {
    if (!running) return;
    if (done || s.pendingPanic) { setRunning(false); return; }
    timer.current = window.setInterval(() => advance(4), 120);
    return () => { if (timer.current) window.clearInterval(timer.current); };
  }, [running, done, s.pendingPanic, advance]);

  // A panic alert interrupting the run must also stop the clock.
  useEffect(() => { if (s.pendingPanic) setRunning(false); }, [s.pendingPanic]);

  const indexSeries = path.index.slice(0, Math.max(s.day + 1, 2));
  const indexChange = (path.index[s.day] / 100 - 1) * 100;
  const panicked = s.panics[0];

  return (
    <div className="pad" style={{ paddingTop: 16 }}>
      <div className="card scenario" style={{ marginBottom: 16, ...(running ? {} : {}) }} data-running={running}>
        <div className={running ? 'scenario running' : 'scenario'} style={{ margin: -16, padding: 16, borderRadius: 15 }}>
          <div className="row between" style={{ marginBottom: 10 }}>
            <div className="row" style={{ gap: 7 }}>
              <Clock size={15} color="var(--blue)" />
              <span className="tiny" style={{ fontWeight: 650, letterSpacing: '.04em', textTransform: 'uppercase' }}>{dayLabel(s.day)}</span>
            </div>
            <SimBadge label="Modelled market" />
          </div>
          <div className="hero-value num" style={{ fontSize: 30 }}>{inr(snap.total)}</div>
          <div className={`num ${snap.pnl >= 0 ? 'pos' : 'neg'}`} style={{ fontSize: 14, fontWeight: 650, marginTop: 5 }}>
            {signed(snap.pnl)} ({pct(snap.pnlPct)}) &middot; market {pct(indexChange)}
          </div>
          <div style={{ margin: '12px -8px 0' }}>
            <Spark data={indexSeries} height={100} color="var(--ink-4)" fill={false} markers={s.panics.map((p) => ({ at: p.day, tone: p.choice === 'sell' ? 'bad' as const : 'good' as const }))} />
          </div>
        </div>
      </div>

      <div className="meter" style={{ marginBottom: 14 }}>
        <i style={{ width: `${Math.max((s.day / TRADING_DAYS) * 100, 1)}%`, background: 'var(--blue)' }} />
      </div>

      {!done && (
        <div className="row" style={{ gap: 9, marginBottom: 16 }}>
          <button className="btn" onClick={() => setRunning(!running)} disabled={!!s.pendingPanic}>
            {running ? <><Pause size={17} /> Pause</> : <><FastForward size={17} /> {s.day === 0 ? 'Start the year' : 'Continue'}</>}
          </button>
          <button className="btn ghost" style={{ width: 'auto', padding: '0 18px' }} onClick={() => { setRunning(false); advance(20); }} disabled={!!s.pendingPanic}>
            +1 month
          </button>
        </div>
      )}

      {done && (
        <div className="card tint-green" style={{ marginBottom: 16 }}>
          <b style={{ fontSize: 14.5, color: 'var(--ink)', fontWeight: 700, display: 'block', marginBottom: 6 }}>A year, survived.</b>
          <p className="sub" style={{ fontSize: 13, marginBottom: 10 }}>{path.regime.reality}</p>
          <p className="sub" style={{ fontSize: 13 }}>
            Your portfolio ended {pct(snap.pnlPct)} against a market that moved {pct(indexChange)}.
            The gap between those two numbers is the part you controlled.
          </p>
        </div>
      )}

      {panicked && (
        <div className={`card ${panicked.choice === 'sell' ? 'tint-red' : 'tint-green'}`} style={{ marginBottom: 16 }}>
          <div className="row" style={{ gap: 7, marginBottom: 6 }}>
            <Flame size={15} color={panicked.choice === 'sell' ? 'var(--red)' : 'var(--green-dark)'} />
            <span className="tiny" style={{ fontWeight: 650, letterSpacing: '.04em', textTransform: 'uppercase' }}>Your panic moment</span>
          </div>
          <p className="sub" style={{ fontSize: 13 }}>
            At a {Math.abs(Math.round(panicked.drawdown))}% <J t="drawdown">drawdown</J> on {dayLabel(panicked.day)} you chose to{' '}
            <b style={{ color: 'var(--ink)' }}>{panicked.choice === 'buy' ? 'buy more' : panicked.choice}</b>, after{' '}
            {(panicked.deliberationMs / 1000).toFixed(1)} seconds. {panicked.choice === 'sell'
              ? 'The market recovered after that point. Selling turned a fall into a loss.'
              : 'Holding through it is the hardest thing on this screen, and you did it.'}
          </p>
        </div>
      )}

      <div className="h-section" style={{ marginBottom: 4 }}>Choose a different year</div>
      <p className="tiny" style={{ marginBottom: 12 }}>Switching resets your practice run so the comparison is clean.</p>
      <div className="stack sm">
        {REGIMES.map((r) => (
          <button
            key={r.id}
            className={`option ${s.regime === r.id ? 'on' : ''}`}
            onClick={() => { if (s.regime !== r.id && confirm('Switching year resets your practice portfolio. Continue?')) setRegime(r.id); }}
          >
            <div className="grow">
              <b>{r.label}</b>
              <span>{r.blurb}</span>
            </div>
            {r.shock && <TrendingDown size={17} color="var(--red)" style={{ flex: 'none' }} />}
          </button>
        ))}
      </div>

      <p className="tiny" style={{ marginTop: 18 }}>
        These years are modelled on the shape of real Indian market years, not replays of them.
        Prices are generated, not historical quotes. Nothing here predicts anything.
      </p>
    </div>
  );
}

/** The interrupt. Full screen, timed, and it blocks the app until answered. */
export function PanicModal() {
  const { s, answerPanic } = useStore();
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const i = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => window.clearInterval(i);
  }, []);
  if (!s.pendingPanic) return null;
  const dd = Math.abs(Math.round(s.pendingPanic.drawdown));

  return (
    <div className="scrim center" style={{ background: 'rgba(18,18,18,.72)', zIndex: 120 }}>
      <div className="modal" style={{ borderTop: '4px solid var(--red)' }}>
        <div className="row alarm" style={{ gap: 8, marginBottom: 12 }}>
          <TrendingDown size={19} color="var(--red)" />
          <span className="tiny" style={{ fontWeight: 700, color: 'var(--red)', letterSpacing: '.06em', textTransform: 'uppercase' }}>
            Market down {dd}%
          </span>
        </div>
        <div className="h-screen" style={{ fontSize: 21, marginBottom: 10 }}>
          Your portfolio is down {dd}%. Everyone you follow is posting about it.
        </div>
        <p className="sub" style={{ marginBottom: 6 }}>
          This is the decision that separates investors who keep their returns from investors who do not.
          There is no right answer here, only your answer &mdash; and we are recording it.
        </p>
        <p className="tiny" style={{ marginBottom: 18 }}>You have been looking at this for {elapsed}s. Take your time. Really.</p>

        {/* All three options carry identical visual weight on purpose. Styling one
            of them as the primary action would make this screen a recommendation,
            which is exactly what it must not be. */}
        <div className="stack sm">
          <button className="btn ghost" onClick={() => answerPanic('sell')}>Sell everything, get me out</button>
          <button className="btn ghost" onClick={() => answerPanic('hold')}>Do nothing, hold</button>
          <button className="btn ghost" onClick={() => answerPanic('buy')}>Buy more while it is cheaper</button>
        </div>
        <p className="tiny" style={{ marginTop: 14, textAlign: 'center' }}>
          Simulated event. No real money is affected, and this is not a recommendation to do any of these things.
        </p>
      </div>
    </div>
  );
}
