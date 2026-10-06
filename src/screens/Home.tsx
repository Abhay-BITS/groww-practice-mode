import { useMemo } from 'react';
import { ArrowRight, Banknote, Brain, Compass, FastForward, GraduationCap, TrendingDown, TrendingUp } from 'lucide-react';
import { byId } from '@/data/instruments';
import { getMarketPath, dayLabel, TRADING_DAYS } from '@/lib/market';
import { overall, traits, grade, type Snapshot } from '@/lib/dna';
import { STARTING_CASH } from '@/lib/types';
import { useStore } from '@/state/store';
import { inr, J, pct, Ring, signed, SimBadge, Spark } from '@/components/ui';
import type { Tab } from '@/App';

export function Home({ snap, go }: { snap: Snapshot; go: (t: Tab) => void }) {
  const { s, set } = useStore();
  const path = getMarketPath(s.regime);
  const t = traits(s, snap);
  const dna = overall(t);
  const g = grade(dna);

  // Portfolio value over every day we have lived through so far.
  const history = useMemo(() => {
    const out: number[] = [];
    for (let d = 0; d <= s.day; d += Math.max(1, Math.floor(s.day / 60) || 1)) {
      let v = s.cash;
      for (const lot of s.lots) v += lot.units * path.prices[lot.instrumentId][d];
      out.push(v);
    }
    if (out.length < 2) out.push(out[0] ?? STARTING_CASH);
    return out;
  }, [s.day, s.lots, s.cash, path]);

  const up = snap.pnl >= 0;
  const paycheck = s.profile?.monthlyIncome ?? 32000;
  const progress = Math.min(100, Math.round((s.day / TRADING_DAYS) * 100));

  return (
    <div className="pad" style={{ paddingTop: 16 }}>
      {/* --- The one number, and the honest label next to it. ------------- */}
      <div className="row between" style={{ marginBottom: 6 }}>
        <span className="tiny" style={{ fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase' }}>Practice portfolio</span>
        <SimBadge label="Fake money" />
      </div>
      <div className="hero-value num">{inr(snap.total)}</div>
      <div className="row" style={{ gap: 7, marginTop: 7, marginBottom: 14 }}>
        {up ? <TrendingUp size={15} color="var(--green-dark)" /> : <TrendingDown size={15} color="var(--red)" />}
        <span className={`num ${up ? 'pos' : 'neg'}`} style={{ fontSize: 14, fontWeight: 650 }}>
          {signed(snap.pnl)} ({pct(snap.pnlPct)})
        </span>
        <span className="tiny">&middot; {dayLabel(s.day)} of {path.regime.label.toLowerCase()}</span>
      </div>

      <div className="card" style={{ padding: '10px 10px 4px', marginBottom: 14 }}>
        <Spark data={history} height={86} markers={s.panics.map((p) => ({ at: Math.min(Math.floor((p.day / Math.max(s.day, 1)) * (history.length - 1)), history.length - 1), tone: p.choice === 'sell' ? 'bad' as const : 'good' as const }))} />
        <div className="row between" style={{ padding: '4px 4px 8px' }}>
          <span className="tiny">Day 1</span>
          <span className="tiny">{dayLabel(s.day)}</span>
        </div>
      </div>

      {/* --- Cash, invested, and what is still sitting idle ---------------- */}
      <div className="card flat" style={{ marginBottom: 16 }}>
        <div className="row between" style={{ marginBottom: 10 }}>
          <div>
            <div className="tiny">Invested</div>
            <b className="num" style={{ fontSize: 16, color: 'var(--ink)' }}>{inr(snap.invested)}</b>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="tiny">Practice cash left</div>
            <b className="num" style={{ fontSize: 16, color: 'var(--ink)' }}>{inr(snap.cash)}</b>
          </div>
        </div>
        <div className="meter">
          <i style={{ width: `${(snap.invested / STARTING_CASH) * 100}%`, background: 'var(--green)' }} />
        </div>
      </div>

      {/* --- The paycheck ritual: the moment this product is built for ----- */}
      {!s.paycheckClaimed && (
        <button
          className="card tint-green"
          style={{ width: '100%', textAlign: 'left', marginBottom: 16, display: 'block' }}
          onClick={() => { set({ paycheckClaimed: true }); go('explore'); }}
        >
          <div className="row">
            <div style={{ width: 38, height: 38, borderRadius: 11, background: '#fff', display: 'grid', placeItems: 'center', flex: 'none' }}>
              <Banknote size={19} color="var(--green-dark)" />
            </div>
            <div className="grow">
              <b style={{ fontSize: 14.5, color: 'var(--ink)', fontWeight: 650, display: 'block' }}>
                {inr(paycheck)} just landed
              </b>
              <span className="tiny" style={{ color: 'var(--ink-3)' }}>
                Decide what happens to it before it disappears. Most of it should not be invested.
              </span>
            </div>
            <ArrowRight size={18} color="var(--green-dark)" style={{ flex: 'none' }} />
          </div>
        </button>
      )}

      {/* --- Investor DNA: the scoreboard that is not a return ------------- */}
      <button className="card" style={{ width: '100%', textAlign: 'left', marginBottom: 16, display: 'block' }} onClick={() => go('dna')}>
        <div className="row" style={{ gap: 16 }}>
          <Ring score={dna} size={82} stroke={8} />
          <div className="grow">
            <div className="row" style={{ gap: 6, marginBottom: 3 }}>
              <Brain size={14} color="var(--ink-3)" />
              <span className="tiny" style={{ fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase' }}>Investor DNA</span>
            </div>
            <b style={{ fontSize: 17, color: 'var(--ink)', fontWeight: 700, letterSpacing: '-0.02em', display: 'block', marginBottom: 4 }}>{g.label}</b>
            <span className="tiny">
              Scored on how you decide: <J t="diversification">spread</J>, patience, composure, conviction.
              Not on what you made.
            </span>
          </div>
        </div>
      </button>

      {/* --- Time Machine ------------------------------------------------- */}
      <div className="h-section" style={{ marginBottom: 10 }}>Your fourteen-day run</div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="row between" style={{ marginBottom: 8 }}>
          <span className="sub" style={{ fontWeight: 550, color: 'var(--ink-2)' }}>{path.regime.label}</span>
          <span className="tiny num">{progress}% through the year</span>
        </div>
        <div className="meter" style={{ marginBottom: 12 }}>
          <i style={{ width: `${Math.max(progress, 1)}%`, background: 'var(--blue)' }} />
        </div>
        <p className="tiny" style={{ marginBottom: 12 }}>{path.regime.blurb}</p>
        <button className="btn" onClick={() => go('time')} disabled={s.lots.length === 0}>
          <FastForward size={17} />
          {s.day >= TRADING_DAYS ? 'Review the year' : s.day === 0 ? 'Start the clock' : 'Fast-forward'}
        </button>
        {s.lots.length === 0 && (
          <p className="tiny" style={{ textAlign: 'center', marginTop: 9 }}>
            Invest something first. There is nothing to fast-forward through yet.
          </p>
        )}
      </div>

      {/* --- Holdings preview --------------------------------------------- */}
      {snap.positions.length > 0 && (
        <>
          <div className="row between" style={{ marginBottom: 2 }}>
            <div className="h-section">Holdings</div>
            <button className="tiny" style={{ color: 'var(--green-dark)', fontWeight: 600 }} onClick={() => go('portfolio')}>See all</button>
          </div>
          <div style={{ marginBottom: 16 }}>
            {snap.positions.slice(0, 3).map((p) => {
              const inst = byId(p.lot.instrumentId);
              return (
                <div className="list-row" key={p.lot.instrumentId}>
                  <div className="avatar" style={{ background: inst.color }}>{inst.short.slice(0, 2)}</div>
                  <div className="grow">
                    <h4>{inst.name}</h4>
                    <span className="tiny">{Math.round(p.weight)}% of portfolio</span>
                  </div>
                  <div className="right">
                    <b className="num">{inr(p.value)}</b>
                    <span className={`num ${p.pnl >= 0 ? 'pos' : 'neg'}`}>{pct(p.pnlPct)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {snap.positions.length === 0 && (
        <button className="card tint-blue" style={{ width: '100%', textAlign: 'left', marginBottom: 16, display: 'block' }} onClick={() => go('explore')}>
          <div className="row">
            <Compass size={20} color="var(--blue)" style={{ flex: 'none' }} />
            <div className="grow">
              <b style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 650, display: 'block' }}>Make your first practice investment</b>
              <span className="tiny">Nine things to choose from. We will ask you why.</span>
            </div>
            <ArrowRight size={17} color="var(--blue)" style={{ flex: 'none' }} />
          </div>
        </button>
      )}

      {/* --- Graduation --------------------------------------------------- */}
      <button className="card" style={{ width: '100%', textAlign: 'left', marginBottom: 14, display: 'block', borderColor: dna >= 60 ? 'var(--green)' : 'var(--line)' }} onClick={() => go('graduate')}>
        <div className="row">
          <GraduationCap size={20} color={dna >= 60 ? 'var(--green-dark)' : 'var(--ink-4)'} style={{ flex: 'none' }} />
          <div className="grow">
            <b style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 650, display: 'block' }}>
              {dna >= 60 ? 'You are ready to invest for real' : 'Graduating to real money'}
            </b>
            <span className="tiny">
              {dna >= 60
                ? 'Turn your practice allocation into a real ₹100 monthly SIP.'
                : `Reach a DNA of 60 and survive one market fall. You are at ${dna}.`}
            </span>
          </div>
          <ArrowRight size={17} color="var(--ink-4)" style={{ flex: 'none' }} />
        </div>
      </button>

      <p className="tiny" style={{ marginTop: 18 }}>
        Prices are modelled, not live. Nothing here is investment advice.
      </p>
    </div>
  );
}
