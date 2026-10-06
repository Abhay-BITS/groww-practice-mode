import { useMemo, useState } from 'react';
import { ArrowRight, Check, ChevronRight, Lock, TrendingDown, TrendingUp } from 'lucide-react';
import { getMarketPath, dayLabel, TRADING_DAYS } from '@/lib/market';
import { gates, grade, overall, traits, type Snapshot } from '@/lib/dna';
import { portfolioSeries, sampleAt } from '@/lib/history';
import { useStore } from '@/state/store';
import { Avatar, inr, J, Lines, pct, Ring, signed, SimBadge } from '@/components/ui';
import { SalarySheet } from '@/components/SalarySheet';
import { byId } from '@/data/instruments';
import type { Tab } from '@/App';

export function Home({ snap, go }: { snap: Snapshot; go: (t: Tab) => void }) {
  const { s } = useStore();
  const [planning, setPlanning] = useState(false);
  const path = getMarketPath(s.regime);
  const list = traits(s, snap);
  const dna = overall(list);
  const g = grade(dna);
  const series = useMemo(() => portfolioSeries(s), [s]);

  const buys = s.trades.filter((t) => t.kind === 'buy').length;
  const progress = Math.round((s.day / TRADING_DAYS) * 100);
  const ready = gates(s, snap).every((x) => x.done);
  const up = snap.pnl >= 0;

  // The path is the product explained in four rows. Each one is a real place to go.
  const steps = [
    {
      done: !!s.plan,
      title: 'Plan your salary',
      sub: s.plan ? `${inr(s.plan.invest)} a month set aside to invest` : `${inr(s.profile?.monthlyIncome ?? 32000)} lands. Decide where it goes.`,
      onClick: () => setPlanning(true),
    },
    {
      done: buys >= 2,
      title: 'Make two practice investments',
      sub: buys >= 2 ? `${buys} made, each with a reason` : `${buys} of 2. We'll ask you why each time.`,
      onClick: () => go('explore'),
    },
    {
      done: s.day >= TRADING_DAYS,
      locked: snap.positions.length === 0 && s.day === 0,
      title: 'Live through a year',
      sub: s.day >= TRADING_DAYS ? `${path.regime.label}, survived` : s.day > 0 ? `${progress}% through ${path.regime.label.toLowerCase()}` : 'A year of market in under a minute',
      onClick: () => go('time'),
    },
    {
      done: s.graduated,
      locked: !ready,
      title: 'Start investing for real',
      sub: s.graduated ? 'Your SIP is set up' : ready ? 'Turn your practice into a small real SIP' : 'Unlocks once you are ready',
      onClick: () => go('graduate'),
    },
  ];
  const nextIndex = steps.findIndex((x) => !x.done && !x.locked);

  return (
    <div className="pad" style={{ paddingTop: 16 }}>
      <div className="row between" style={{ marginBottom: 6 }}>
        <span className="tiny" style={{ fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase' }}>Practice portfolio</span>
        <SimBadge label="Practice money" />
      </div>
      <div className="hero-value num">{inr(snap.total)}</div>
      <div className="row" style={{ gap: 7, marginTop: 7, marginBottom: 14 }}>
        {up ? <TrendingUp size={15} color="var(--green-dark)" /> : <TrendingDown size={15} color="var(--red)" />}
        <span className={`num ${up ? 'pos' : 'neg'}`} style={{ fontSize: 14, fontWeight: 650 }}>
          {signed(snap.pnl)} ({pct(snap.pnlPct)})
        </span>
        <span className="tiny">{s.day > 0 ? `${dayLabel(s.day)}` : 'Day 1'}</span>
      </div>

      {s.day > 0 && (
        <div className="card" style={{ padding: '12px 12px 8px', marginBottom: 14 }}>
          <div className="legend" style={{ marginBottom: 8 }}>
            <span><i style={{ background: up ? 'var(--green)' : 'var(--red)' }} />You</span>
            <span><i style={{ background: 'var(--ink-4)' }} />Market</span>
          </div>
          <Lines
            you={series.you} market={series.market} height={92}
            markers={s.panics.map((p) => ({ at: sampleAt(series, p.day), tone: p.choice === 'sell' ? 'bad' as const : 'good' as const }))}
          />
        </div>
      )}

      {!s.graduated && (
        <div className="card" style={{ marginBottom: 16, padding: '4px 16px' }}>
          {steps.map((st, i) => (
            <button
              key={st.title}
              className={`path-row ${st.done ? 'done' : i === nextIndex ? 'next' : st.locked ? 'locked' : ''}`}
              onClick={st.locked ? undefined : st.onClick}
              disabled={st.locked}
            >
              <span className="path-dot">{st.done ? <Check size={14} strokeWidth={3} /> : st.locked ? <Lock size={11} /> : i + 1}</span>
              <span className="grow">
                <b>{st.title}</b>
                <span className="tiny">{st.sub}</span>
              </span>
              {!st.locked && <ChevronRight size={17} color="var(--ink-4)" />}
            </button>
          ))}
        </div>
      )}

      {s.profile?.fear === 'jargon' && s.seenGlossary.length === 0 && (
        <p className="tiny" style={{ marginBottom: 16, color: 'var(--ink-3)' }}>
          You said the words were the problem. Any word with a dotted line, like{' '}
          <J t="diversification">diversification</J>, explains itself when you tap it.
        </p>
      )}

      {s.trades.length > 0 && (
        <button className="card" style={{ width: '100%', textAlign: 'left', marginBottom: 16, display: 'block' }} onClick={() => go('dna')}>
          <div className="row" style={{ gap: 16 }}>
            <Ring score={dna} size={76} stroke={8} />
            <div className="grow">
              <span className="tiny" style={{ fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase' }}>Investor DNA</span>
              <b style={{ fontSize: 17, color: 'var(--ink)', fontWeight: 700, letterSpacing: '-0.02em', display: 'block', margin: '2px 0 3px' }}>{g.label}</b>
              <span className="tiny">How you decide: spread, patience, composure and conviction. Profit isn&rsquo;t part of it.</span>
            </div>
            <ArrowRight size={17} color="var(--ink-4)" style={{ flex: 'none' }} />
          </div>
        </button>
      )}

      {snap.positions.length > 0 && (
        <>
          <div className="row between" style={{ marginBottom: 2 }}>
            <div className="h-section">Holdings</div>
            <button className="tiny" style={{ color: 'var(--green-dark)', fontWeight: 600 }} onClick={() => go('portfolio')}>See all</button>
          </div>
          <div style={{ marginBottom: 12 }}>
            {snap.positions.slice(0, 3).map((p) => (
              <div className="list-row" key={p.lot.instrumentId}>
                <Avatar id={p.lot.instrumentId} />
                <div className="grow">
                  <h4>{byId(p.lot.instrumentId).name}</h4>
                  <span className="tiny">{Math.round(p.weight)}% of what you hold</span>
                </div>
                <div className="right">
                  <b className="num">{inr(p.value)}</b>
                  <span className={`num ${p.pnl >= 0 ? 'pos' : 'neg'}`}>{pct(p.pnlPct)}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <p className="tiny" style={{ marginTop: 8 }}>Prices are modelled, not live. Nothing here is investment advice.</p>

      {planning && <SalarySheet onClose={() => setPlanning(false)} />}
    </div>
  );
}
