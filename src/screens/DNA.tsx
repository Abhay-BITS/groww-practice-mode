import { useState } from 'react';
import { Brain, History } from 'lucide-react';
import { byId } from '@/data/instruments';
import { dayLabel, priceOn } from '@/lib/market';
import { grade, overall, traits, type Snapshot } from '@/lib/dna';
import { horizon, reason, STARTING_CASH } from '@/lib/types';
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
              Your practice portfolio is {snap.pnl >= 0 ? 'up' : 'down'} {inr(Math.abs(snap.pnl))}. None of
              that is in this number.
            </p>
          </div>

          <div className="stack" style={{ marginBottom: 20 }}>
            {list.map((t) => (
              <div key={t.id} className="card">
                <div className="row between" style={{ marginBottom: 8 }}>
                  <b style={{ fontSize: 15, color: 'var(--ink)', fontWeight: 650 }}>{t.label}</b>
                  <b className="num" style={{ fontSize: 15, color: scoreColor(t.score) }}>{t.score || 'Not yet'}</b>
                </div>
                <div style={{ marginBottom: 10 }}><Meter value={t.score} color={scoreColor(t.score)} /></div>
                <p className="sub" style={{ fontSize: 13, marginBottom: 7 }}>{t.evidence}</p>
                <p className="tiny" style={{ color: 'var(--ink-3)' }}>{t.nudge}</p>
              </div>
            ))}
          </div>

          <div className="card flat">
            <b style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 650, display: 'block', marginBottom: 6 }}>Why profit isn&rsquo;t in the score</b>
            <p className="sub" style={{ fontSize: 13 }}>
              Over a few months, luck swamps skill. If this scored returns, the person who put everything
              into one stock and got lucky would top it, and then do the same thing with their salary.
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
 * Every decision with the reason given at the time, and what actually happened
 * afterwards. The second half is the reason the journal exists.
 */
function Replay() {
  const { s } = useStore();

  if (!s.trades.length) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 10px' }}>
        <div className="h-section" style={{ marginBottom: 6 }}>Nothing to replay yet</div>
        <p className="sub" style={{ maxWidth: 270, margin: '0 auto' }}>
          Make a practice investment and fast-forward a few months. This fills up with what you said,
          next to what happened.
        </p>
      </div>
    );
  }

  const buys = s.trades.filter((t) => t.kind === 'buy');
  const totalIn = buys.reduce((t, b) => t + b.amount, 0);
  const hype = buys.filter((t) => reason(t.reasonId).quality < 0.3);
  const hypeIn = hype.reduce((t, b) => t + b.amount, 0);
  const firstBuy = (id: string) => s.trades.find((x) => x.kind === 'buy' && x.instrumentId === id);
  const early = s.trades.filter((t) => {
    const open = t.kind === 'sell' ? firstBuy(t.instrumentId) : undefined;
    return open ? t.day - open.day < horizon(open.horizonId).days : false;
  });
  // A short horizon that has quietly passed is its own kind of broken promise.
  const overstayed = s.lots.filter((l) => l.horizonId === 'weeks' && s.day - l.openedDay > horizon('weeks').days);

  const notes: string[] = [];
  if (hypeIn > 0) notes.push(`${inr(hypeIn)} of the ${inr(totalIn)} you invested (${Math.round((hypeIn / totalIn) * 100)}%) went in on a tip or because it was going up.`);
  if (early.length) notes.push(`You sold ${early.length} holding${early.length > 1 ? 's' : ''} before the horizon you set.`);
  if (overstayed.length) notes.push(`You said "a few weeks" for ${overstayed.map((l) => byId(l.instrumentId).name).join(', ')} and are still holding it ${s.day - overstayed[0].openedDay} trading days later. Plans that don't match what you do are worth noticing either way.`);

  return (
    <>
      {notes.length > 0 && (
        <div className="card tint-amber" style={{ marginBottom: 18 }}>
          <b style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 700, display: 'block', marginBottom: 7 }}>What stands out</b>
          <div className="stack sm">
            {notes.map((n) => <p key={n} className="sub" style={{ fontSize: 13, color: '#7a5206' }}>{n}</p>)}
          </div>
        </div>
      )}

      <div className="timeline">
        {[...s.trades].reverse().map((t) => {
          const inst = byId(t.instrumentId);
          const r = reason(t.reasonId);
          const h = horizon(t.horizonId);
          const open = firstBuy(t.instrumentId);
          const sold = t.kind === 'sell';
          const isEarly = sold && open && t.day - open.day < h.days;
          // What the purchase has done since, whether still held or later sold.
          const exit = s.trades.find((x) => x.kind === 'sell' && x.instrumentId === t.instrumentId && x.day >= t.day);
          const nowPrice = exit ? exit.price : priceOn(s.regime, t.instrumentId, s.day);
          const since = (nowPrice / t.price - 1) * 100;
          const tone = sold ? (isEarly ? 'bad' : 'good') : r.quality >= 0.8 ? 'good' : r.quality < 0.3 ? 'bad' : '';

          return (
            <div key={t.id} className={`tl-item ${tone}`}>
              <div className="row between" style={{ marginBottom: 3 }}>
                <b style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 650 }}>
                  {sold ? 'Sold' : 'Bought'} {inst.name}
                </b>
                <span className="tiny num">{dayLabel(t.day)}</span>
              </div>
              <span className="tiny num" style={{ display: 'block', marginBottom: 6 }}>{inr(t.amount)}</span>

              {!sold ? (
                <div className="card flat" style={{ padding: 11 }}>
                  <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5, marginBottom: 6 }}>
                    &ldquo;{r.label}&rdquo;, for {h.label.toLowerCase()}.
                  </p>
                  {t.day < s.day && (
                    <p className="tiny">
                      {exit ? 'Until you sold' : 'Since then'}:{' '}
                      <b className={`num ${since >= 0 ? 'pos' : 'neg'}`}>{pct(since)}</b>
                    </p>
                  )}
                </div>
              ) : (
                <div className={`card ${isEarly ? 'tint-red' : 'flat'}`} style={{ padding: 11 }}>
                  <p style={{ fontSize: 13, color: isEarly ? '#8f3620' : 'var(--ink-2)', lineHeight: 1.5 }}>
                    {t.exitReason === 'scared' && 'Sold because it was falling. '}
                    {t.exitReason === 'target' && 'Sold because the reason had played out. '}
                    {t.exitReason === 'needed' && 'Sold because the money was needed elsewhere. '}
                    {t.exitReason === 'wrong' && 'Sold because the original reason stopped holding. '}
                    {isEarly && open ? `You'd planned ${h.label.toLowerCase()} and held for ${t.day - open.day} trading days.` : 'Within the horizon you set.'}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="tiny" style={{ marginTop: 4 }}>
        Started with {inr(STARTING_CASH)} of practice money on {dayLabel(0)}.
      </p>
    </>
  );
}
