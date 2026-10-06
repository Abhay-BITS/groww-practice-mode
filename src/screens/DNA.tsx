import { useState } from 'react';
import { Brain, History, Info } from 'lucide-react';
import { byId } from '@/data/instruments';
import { dayLabel } from '@/lib/market';
import { grade, overall, traits, type Snapshot } from '@/lib/dna';
import { horizon, reason } from '@/lib/types';
import { useStore } from '@/state/store';
import { inr, Meter, pct, Ring, scoreColor } from '@/components/ui';

export function DNA({ snap }: { snap: Snapshot }) {
  const { s } = useStore();
  const [tab, setTab] = useState<'dna' | 'replay'>('dna');
  const list = traits(s, snap);
  const score = overall(list);
  const g = grade(score);

  return (
    <div className="pad" style={{ paddingTop: 16 }}>
      <div className="chips" style={{ marginBottom: 18 }}>
        <button className={`chip ${tab === 'dna' ? 'on' : ''}`} onClick={() => setTab('dna')}><Brain size={14} /> Investor DNA</button>
        <button className={`chip ${tab === 'replay' ? 'on' : ''}`} onClick={() => setTab('replay')}><History size={14} /> Decision replay</button>
      </div>

      {tab === 'dna' ? (
        <>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ display: 'inline-block', marginBottom: 12 }}>
              <Ring score={score} size={132} stroke={11} label="out of 100" />
            </div>
            <div className="h-screen" style={{ fontSize: 21, marginBottom: 6 }}>{g.label}</div>
            <p className="sub" style={{ maxWidth: 290, margin: '0 auto' }}>
              Your score says nothing about how much money you made. Two people with identical returns
              can sit 60 points apart here.
            </p>
          </div>

          <div className="stack" style={{ marginBottom: 20 }}>
            {list.map((t) => (
              <div key={t.id} className="card">
                <div className="row between" style={{ marginBottom: 8 }}>
                  <b style={{ fontSize: 15, color: 'var(--ink)', fontWeight: 650 }}>{t.label}</b>
                  <b className="num" style={{ fontSize: 15, color: scoreColor(t.score) }}>{t.score || '\u2013'}</b>
                </div>
                <div style={{ marginBottom: 10 }}><Meter value={t.score} color={scoreColor(t.score)} /></div>
                <p className="sub" style={{ fontSize: 13, marginBottom: 7 }}>{t.evidence}</p>
                <p className="tiny" style={{ color: 'var(--ink-3)' }}>{t.nudge}</p>
              </div>
            ))}
          </div>

          <div className="card flat">
            <div className="row" style={{ gap: 7, marginBottom: 7 }}>
              <Info size={14} color="var(--ink-3)" />
              <b style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 650 }}>Why we do not score returns</b>
            </div>
            <p className="sub" style={{ fontSize: 13 }}>
              A beginner who puts everything into one stock and gets lucky learns the wrong lesson and
              repeats it with real money. Scoring the decision instead of the outcome is the only way a
              fourteen-day practice run can teach anything that survives contact with a real market.
            </p>
          </div>
        </>
      ) : (
        <Replay />
      )}
    </div>
  );
}

/**
 * Decision Replay. Every trade, with the reason the user gave at the time, set
 * against what the position did afterwards. This is the artefact the whole
 * Decision Journal exists to produce.
 */
function Replay() {
  const { s } = useStore();

  if (!s.trades.length) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 10px' }}>
        <div className="h-section" style={{ marginBottom: 6 }}>Nothing to replay yet</div>
        <p className="sub" style={{ maxWidth: 270, margin: '0 auto' }}>
          Make a practice investment, fast-forward a few months, and this page fills itself with what you
          said against what you did.
        </p>
      </div>
    );
  }

  const buys = s.trades.filter((t) => t.kind === 'buy');
  const hype = buys.filter((t) => reason(t.reasonId).quality < 0.3);
  const brokenPromises = s.trades.filter((t) => {
    if (t.kind !== 'sell') return false;
    const open = s.trades.find((x) => x.kind === 'buy' && x.instrumentId === t.instrumentId);
    return open ? t.day - open.day < horizon(open.horizonId).days : false;
  });

  return (
    <>
      {(hype.length > 0 || brokenPromises.length > 0) && (
        <div className="card tint-amber" style={{ marginBottom: 18 }}>
          <b style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 700, display: 'block', marginBottom: 7 }}>The pattern in your year</b>
          <p className="sub" style={{ fontSize: 13, color: '#7a5206' }}>
            {brokenPromises.length > 0 && `You set a horizon ${buys.length} times and broke it ${brokenPromises.length} time${brokenPromises.length > 1 ? 's' : ''}. `}
            {hype.length > 0 && `${hype.length} of your ${buys.length} purchases went in on a tip or on momentum. `}
            That is the habit worth fixing before real money is involved, because real money makes it more expensive, not less.
          </p>
        </div>
      )}

      <div className="timeline">
        {[...s.trades].reverse().map((t) => {
          const inst = byId(t.instrumentId);
          const r = reason(t.reasonId);
          const h = horizon(t.horizonId);
          const open = s.trades.find((x) => x.kind === 'buy' && x.instrumentId === t.instrumentId);
          const early = t.kind === 'sell' && open && t.day - open.day < h.days;
          const pnlOnExit = t.kind === 'sell' && open ? (t.price / open.price - 1) * 100 : null;
          const tone = t.kind === 'sell' ? (early ? 'bad' : 'good') : r.quality >= 0.8 ? 'good' : r.quality < 0.3 ? 'bad' : '';

          return (
            <div key={t.id} className={`tl-item ${tone}`}>
              <div className="row between" style={{ marginBottom: 3 }}>
                <b style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 650 }}>
                  {t.kind === 'buy' ? 'Bought' : 'Sold'} {inst.short}
                </b>
                <span className="tiny num">{dayLabel(t.day)}</span>
              </div>
              <div className="row" style={{ gap: 8, marginBottom: 6 }}>
                <span className="tiny num">{inr(t.amount)}</span>
                {pnlOnExit !== null && (
                  <span className={`tiny num ${pnlOnExit >= 0 ? 'pos' : 'neg'}`} style={{ fontWeight: 600 }}>
                    {pct(pnlOnExit)} on the position
                  </span>
                )}
              </div>

              {t.kind === 'buy' ? (
                <div className="card flat" style={{ padding: 11 }}>
                  <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5 }}>
                    &ldquo;{r.emoji} {r.label}&rdquo;, holding for {h.label.toLowerCase()}.
                  </p>
                </div>
              ) : (
                <div className={`card ${early ? 'tint-red' : 'flat'}`} style={{ padding: 11 }}>
                  <p style={{ fontSize: 13, color: early ? '#8f3620' : 'var(--ink-2)', lineHeight: 1.5 }}>
                    {t.exitReason === 'scared' && 'Exited because it was falling. '}
                    {t.exitReason === 'target' && 'Exited because the reason had played out. '}
                    {t.exitReason === 'needed' && 'Exited because the money was needed elsewhere. '}
                    {t.exitReason === 'wrong' && 'Exited because the original reason no longer held. '}
                    {early && open
                      ? `You had committed to ${h.label.toLowerCase()} and held for ${t.day - open.day} trading days.`
                      : 'Within the horizon you set.'}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
